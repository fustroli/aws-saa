import type { Attempt, Progress } from '../types'

// The progress document is what gets stored locally and synced to the server.
// It is designed to merge: attempts only ever get added, bookmarks are
// last-write-wins per question, and a reset is a timestamp that hides
// everything recorded before it on every device.
//
// Shared by the browser app and the sync Lambda — keep it dependency-free.

export const DOC_VERSION = 2

export interface BookmarkState {
  on: boolean
  at: number
}

export interface ProgressDoc {
  version: typeof DOC_VERSION
  attempts: Attempt[]
  bookmarks: Record<string, BookmarkState>
  /** Anything recorded at or before this time is discarded. 0 = never reset. */
  resetAt: number
}

export const emptyDoc = (): ProgressDoc => ({ version: DOC_VERSION, attempts: [], bookmarks: {}, resetAt: 0 })

/** The read-only view the UI works with. */
export function toProgress(doc: ProgressDoc): Progress {
  return {
    attempts: doc.attempts,
    bookmarks: Object.keys(doc.bookmarks).filter((id) => doc.bookmarks[id].on),
  }
}

export const addAttempt = (doc: ProgressDoc, attempt: Attempt): ProgressDoc => ({
  ...doc,
  attempts: [...doc.attempts, attempt],
})

export function toggleBookmark(doc: ProgressDoc, questionId: string, now: number): ProgressDoc {
  const on = !doc.bookmarks[questionId]?.on
  return { ...doc, bookmarks: { ...doc.bookmarks, [questionId]: { on, at: now } } }
}

export const resetDoc = (now: number): ProgressDoc => ({ ...emptyDoc(), resetAt: now })

const attemptKey = (a: Attempt) => `${a.questionId}@${a.timestamp}`

/** Commutative, idempotent merge. Output is normalized so equal content serializes identically. */
export function mergeDocs(a: ProgressDoc, b: ProgressDoc): ProgressDoc {
  const resetAt = Math.max(a.resetAt, b.resetAt)

  const attempts = new Map<string, Attempt>()
  for (const att of [...a.attempts, ...b.attempts]) {
    if (att.timestamp > resetAt && !attempts.has(attemptKey(att))) attempts.set(attemptKey(att), att)
  }

  const bookmarks: Record<string, BookmarkState> = {}
  for (const source of [a.bookmarks, b.bookmarks]) {
    for (const [id, state] of Object.entries(source)) {
      if (state.at <= resetAt) continue
      const prev = bookmarks[id]
      // Later change wins; on a tie, prefer "bookmarked" so the result doesn't depend on argument order.
      if (!prev || state.at > prev.at || (state.at === prev.at && state.on)) bookmarks[id] = state
    }
  }

  return normalize({ version: DOC_VERSION, attempts: [...attempts.values()], bookmarks, resetAt })
}

function normalize(doc: ProgressDoc): ProgressDoc {
  const attempts = [...doc.attempts].sort(
    (x, y) => x.timestamp - y.timestamp || x.questionId.localeCompare(y.questionId),
  )
  const bookmarks = Object.fromEntries(
    Object.keys(doc.bookmarks)
      .sort()
      .map((id) => [id, doc.bookmarks[id]]),
  )
  return { ...doc, attempts, bookmarks }
}

/** Stable string form, used to tell whether two docs hold the same content. */
export const serializeDoc = (doc: ProgressDoc) => JSON.stringify(normalize(doc))

// ---------- Validation (runs on untrusted input on the server) ----------

const MAX_ID = 100
const isShortString = (v: unknown, max = MAX_ID): v is string => typeof v === 'string' && v.length <= max
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

function parseAttempt(v: unknown): Attempt | null {
  if (typeof v !== 'object' || v === null) return null
  const a = v as Record<string, unknown>
  if (!isShortString(a.questionId) || typeof a.correct !== 'boolean' || !isTime(a.timestamp)) return null
  if (!Array.isArray(a.selected) || a.selected.length > 10 || !a.selected.every((s) => isShortString(s, 20))) {
    return null
  }
  // Rebuild the object so unknown fields are dropped.
  return { questionId: a.questionId, selected: [...a.selected], correct: a.correct, timestamp: a.timestamp }
}

/**
 * Parses a stored or received doc, dropping unknown fields. Accepts the v1
 * local format ({ attempts, bookmarks: string[] }) and upgrades it.
 * Returns null if the shape is wrong.
 */
export function parseDoc(value: unknown): ProgressDoc | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (!Array.isArray(v.attempts)) return null

  const attempts: Attempt[] = []
  for (const raw of v.attempts) {
    const a = parseAttempt(raw)
    if (!a) return null
    attempts.push(a)
  }

  const bookmarks: Record<string, BookmarkState> = {}
  if (v.version === 1 && Array.isArray(v.bookmarks)) {
    for (const id of v.bookmarks) {
      if (!isShortString(id)) return null
      bookmarks[id] = { on: true, at: 1 }
    }
    return normalize({ version: DOC_VERSION, attempts, bookmarks, resetAt: 0 })
  }

  if (v.version !== DOC_VERSION || typeof v.bookmarks !== 'object' || v.bookmarks === null) return null
  if (Array.isArray(v.bookmarks) || !isTime(v.resetAt)) return null
  for (const [id, raw] of Object.entries(v.bookmarks)) {
    const s = raw as Record<string, unknown> | null
    if (!isShortString(id) || typeof s !== 'object' || s === null) return null
    if (typeof s.on !== 'boolean' || !isTime(s.at)) return null
    bookmarks[id] = { on: s.on, at: s.at }
  }
  return normalize({ version: DOC_VERSION, attempts, bookmarks, resetAt: v.resetAt })
}

// ---------- Sync IDs ----------

const SYNC_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/** Sync IDs are random v4 UUIDs; they act as the password for a progress file. */
export const isValidSyncId = (id: string) => SYNC_ID.test(id)

export const normalizeSyncId = (input: string) => input.trim().toLowerCase()
