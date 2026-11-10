import { parseDoc, type ProgressDoc } from './progressDoc'

// Talks to the sync Lambda through CloudFront at /api (same origin, no CORS).

export class SyncError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

const url = (id: string) => `/api/progress/${encodeURIComponent(id)}`

/** CloudFront's origin access control signs requests to Lambda, which requires the body hash. */
async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function request(input: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch {
    throw new SyncError('Sync server unreachable. Are you offline?')
  }
}

async function readDoc(res: Response): Promise<ProgressDoc> {
  const doc = parseDoc(await res.json().catch(() => null))
  if (!doc) throw new SyncError('Sync server sent an unexpected response.', res.status)
  return doc
}

function fail(res: Response): never {
  if (res.status === 404) throw new SyncError('No progress found for this ID.', 404)
  if (res.status === 413) throw new SyncError('Progress is too large to sync.', 413)
  throw new SyncError(`Sync failed (HTTP ${res.status}).`, res.status)
}

/** Returns the stored doc, or null if the ID has never been saved. */
export async function fetchRemote(id: string): Promise<ProgressDoc | null> {
  const res = await request(url(id), { headers: { accept: 'application/json' } })
  if (res.status === 404) return null
  if (!res.ok) fail(res)
  return readDoc(res)
}

/** Sends the local doc; the server merges it with what it has and returns the result. */
export async function pushRemote(id: string, doc: ProgressDoc): Promise<ProgressDoc> {
  const body = JSON.stringify(doc)
  const res = await request(url(id), {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-amz-content-sha256': await sha256Hex(body),
    },
    body,
  })
  if (!res.ok) fail(res)
  return readDoc(res)
}
