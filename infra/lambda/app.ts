import type { LambdaFunctionURLEvent, LambdaFunctionURLResult } from 'aws-lambda'
import { isValidSyncId, mergeDocs, parseDoc, type ProgressDoc } from '../../src/lib/progressDoc'

// HTTP API for progress sync, independent of S3 so it can be tested with an in-memory store.
//   GET /api/progress/{id}  -> stored doc, or 404
//   PUT /api/progress/{id}  -> merges the body into the stored doc, returns the result

export const MAX_BODY_BYTES = 1024 * 1024
const MAX_WRITE_ATTEMPTS = 4

export interface StoredDoc {
  body: string
  /** Version tag used for conditional writes. */
  etag: string
}

export interface ProgressStore {
  get(id: string): Promise<StoredDoc | null>
  /** Writes only if the stored version still matches `expectedEtag` (null = must not exist yet). */
  put(id: string, body: string, expectedEtag: string | null): Promise<void>
}

/** Thrown by a store when a conditional write loses a race. */
export class WriteConflictError extends Error {}

const json = (statusCode: number, body: unknown): LambdaFunctionURLResult => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
})

const error = (statusCode: number, message: string) => json(statusCode, { error: message })

function readStored(stored: StoredDoc | null): ProgressDoc | null {
  if (!stored) return null
  const doc = parseDoc(JSON.parse(stored.body))
  if (!doc) throw new Error('Stored progress is corrupt')
  return doc
}

export function createHandler(store: ProgressStore) {
  return async (event: LambdaFunctionURLEvent): Promise<LambdaFunctionURLResult> => {
    const match = /^\/api\/progress\/([^/]+)$/.exec(event.rawPath)
    if (!match) return error(404, 'Not found')
    const id = decodeURIComponent(match[1])
    if (!isValidSyncId(id)) return error(400, 'Invalid sync ID')

    const method = event.requestContext.http.method
    try {
      if (method === 'GET') {
        const doc = readStored(await store.get(id))
        return doc ? json(200, doc) : error(404, 'No progress for this ID')
      }

      if (method === 'PUT') {
        const raw = event.body ?? ''
        const text = event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw
        if (Buffer.byteLength(text) > MAX_BODY_BYTES) return error(413, 'Progress too large')

        let incoming: ProgressDoc | null
        try {
          incoming = parseDoc(JSON.parse(text))
        } catch {
          incoming = null
        }
        if (!incoming) return error(400, 'Invalid progress document')

        // Optimistic concurrency: read, merge, write-if-unchanged, retry on conflict.
        for (let i = 0; i < MAX_WRITE_ATTEMPTS; i++) {
          const stored = await store.get(id)
          const existing = readStored(stored)
          const merged = existing ? mergeDocs(existing, incoming) : mergeDocs(incoming, incoming)
          const body = JSON.stringify(merged)
          if (Buffer.byteLength(body) > MAX_BODY_BYTES) return error(413, 'Progress too large')
          try {
            await store.put(id, body, stored?.etag ?? null)
            return json(200, merged)
          } catch (e) {
            if (!(e instanceof WriteConflictError)) throw e
          }
        }
        return error(409, 'Too many concurrent updates, try again')
      }

      return error(405, 'Method not allowed')
    } catch (e) {
      console.error('Request failed', { method, id, error: e })
      return error(500, 'Internal error')
    }
  }
}
