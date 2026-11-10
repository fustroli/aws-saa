import { describe, expect, it } from 'vitest'
import type { LambdaFunctionURLEvent } from 'aws-lambda'
import { createHandler, MAX_BODY_BYTES, WriteConflictError, type ProgressStore, type StoredDoc } from './app'
import { emptyDoc, type ProgressDoc } from '../../src/lib/progressDoc'

const ID = '0b6f3c1e-8a2d-4f5b-9c7e-1d2a3b4c5d6e'

class MemoryStore implements ProgressStore {
  data = new Map<string, StoredDoc>()
  version = 0
  /** Number of upcoming puts that should fail as if another writer got there first. */
  conflicts = 0

  async get(id: string) {
    return this.data.get(id) ?? null
  }

  async put(id: string, body: string, expectedEtag: string | null) {
    if (this.conflicts > 0) {
      this.conflicts--
      throw new WriteConflictError()
    }
    const current = this.data.get(id)
    if ((current?.etag ?? null) !== expectedEtag) throw new WriteConflictError()
    this.data.set(id, { body, etag: `v${++this.version}` })
  }
}

const event = (method: string, path: string, body?: string): LambdaFunctionURLEvent =>
  ({ rawPath: path, body, isBase64Encoded: false, requestContext: { http: { method } } }) as LambdaFunctionURLEvent

const doc = (questionId: string, timestamp: number): ProgressDoc => ({
  ...emptyDoc(),
  attempts: [{ questionId, selected: ['a'], correct: true, timestamp }],
})

const put = (handler: ReturnType<typeof createHandler>, body: unknown, id = ID) =>
  handler(event('PUT', `/api/progress/${id}`, typeof body === 'string' ? body : JSON.stringify(body)))

const parse = (res: Awaited<ReturnType<ReturnType<typeof createHandler>>>) =>
  JSON.parse(typeof res === 'string' ? res : (res.body ?? ''))
const status = (res: Awaited<ReturnType<ReturnType<typeof createHandler>>>) =>
  typeof res === 'string' ? 200 : res.statusCode

describe('sync API', () => {
  it('GET on an unknown ID is 404', async () => {
    const res = await createHandler(new MemoryStore())(event('GET', `/api/progress/${ID}`))
    expect(status(res)).toBe(404)
  })

  it('PUT creates, a second PUT merges, GET returns the merged doc', async () => {
    const handler = createHandler(new MemoryStore())
    expect(status(await put(handler, doc('q1', 1)))).toBe(200)
    const merged = parse(await put(handler, doc('q2', 2)))
    expect(merged.attempts.map((a: { questionId: string }) => a.questionId)).toEqual(['q1', 'q2'])
    const res = await handler(event('GET', `/api/progress/${ID}`))
    expect(parse(res)).toEqual(merged)
  })

  it('retries when a concurrent write wins the race', async () => {
    const store = new MemoryStore()
    const handler = createHandler(store)
    await put(handler, doc('q1', 1))
    store.conflicts = 2
    const res = await put(handler, doc('q2', 2))
    expect(status(res)).toBe(200)
    expect(parse(res).attempts).toHaveLength(2)
  })

  it('gives up with 409 after repeated conflicts', async () => {
    const store = new MemoryStore()
    store.conflicts = 10
    expect(status(await put(createHandler(store), doc('q1', 1)))).toBe(409)
  })

  it('rejects bad IDs, bad bodies, oversized bodies and other methods', async () => {
    const handler = createHandler(new MemoryStore())
    expect(status(await put(handler, doc('q1', 1), 'not-a-uuid'))).toBe(400)
    expect(status(await put(handler, '{not json'))).toBe(400)
    expect(status(await put(handler, { attempts: 'nope' }))).toBe(400)
    expect(status(await put(handler, 'x'.repeat(MAX_BODY_BYTES + 1)))).toBe(413)
    expect(status(await handler(event('DELETE', `/api/progress/${ID}`)))).toBe(405)
    expect(status(await handler(event('GET', '/api/other')))).toBe(404)
  })

  it('drops unknown fields before storing', async () => {
    const store = new MemoryStore()
    await put(createHandler(store), { ...doc('q1', 1), junk: 'x'.repeat(100) })
    expect(store.data.get(ID)!.body).not.toContain('junk')
  })
})
