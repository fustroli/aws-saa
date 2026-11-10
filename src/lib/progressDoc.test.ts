import { describe, expect, it } from 'vitest'
import type { Attempt } from '../types'
import {
  addAttempt,
  emptyDoc,
  isValidSyncId,
  mergeDocs,
  normalizeSyncId,
  parseDoc,
  resetDoc,
  serializeDoc,
  toggleBookmark,
  toProgress,
  type ProgressDoc,
} from './progressDoc'

const attempt = (questionId: string, timestamp: number, correct = true): Attempt => ({
  questionId,
  selected: ['a'],
  correct,
  timestamp,
})

const withAttempts = (...attempts: Attempt[]): ProgressDoc => attempts.reduce(addAttempt, emptyDoc())

describe('mergeDocs', () => {
  it('unions attempts without duplicates and is order-independent', () => {
    const a = withAttempts(attempt('q1', 1), attempt('q2', 3))
    const b = withAttempts(attempt('q1', 1), attempt('q3', 2))
    const ab = mergeDocs(a, b)
    expect(ab.attempts.map((x) => x.questionId)).toEqual(['q1', 'q3', 'q2'])
    expect(serializeDoc(ab)).toBe(serializeDoc(mergeDocs(b, a)))
    expect(serializeDoc(mergeDocs(ab, ab))).toBe(serializeDoc(ab))
  })

  it('bookmarks: latest change wins, so a removal on one device sticks', () => {
    const added = toggleBookmark(emptyDoc(), 'q1', 1)
    const removedLater = toggleBookmark(added, 'q1', 5)
    expect(toProgress(mergeDocs(added, removedLater)).bookmarks).toEqual([])
    expect(toProgress(mergeDocs(removedLater, added)).bookmarks).toEqual([])
  })

  it('a reset hides older data from every device but keeps newer data', () => {
    const otherDevice = toggleBookmark(withAttempts(attempt('old', 5), attempt('new', 20)), 'q1', 6)
    const merged = mergeDocs(resetDoc(10), otherDevice)
    expect(merged.attempts.map((x) => x.questionId)).toEqual(['new'])
    expect(merged.bookmarks).toEqual({})
    expect(merged.resetAt).toBe(10)
  })
})

describe('toProgress', () => {
  it('lists only active bookmarks', () => {
    const doc = toggleBookmark(toggleBookmark(toggleBookmark(emptyDoc(), 'a', 1), 'b', 2), 'a', 3)
    expect(toProgress(doc).bookmarks).toEqual(['b'])
  })
})

describe('parseDoc', () => {
  it('round-trips a valid doc', () => {
    const doc = toggleBookmark(withAttempts(attempt('q1', 1)), 'q1', 2)
    expect(parseDoc(JSON.parse(JSON.stringify(doc)))).toEqual(mergeDocs(doc, doc))
  })

  it('upgrades the v1 local format', () => {
    const v1 = { version: 1, attempts: [attempt('q1', 1)], bookmarks: ['q2'] }
    const doc = parseDoc(v1)!
    expect(doc.version).toBe(2)
    expect(toProgress(doc)).toEqual({ attempts: [attempt('q1', 1)], bookmarks: ['q2'] })
  })

  it('rejects bad shapes', () => {
    for (const bad of [
      null,
      'x',
      { version: 2, attempts: 'x', bookmarks: {}, resetAt: 0 },
      { version: 2, attempts: [], bookmarks: [], resetAt: 0 },
      { version: 2, attempts: [], bookmarks: {}, resetAt: -1 },
      { version: 2, attempts: [{ questionId: 'q', selected: [], correct: 'yes', timestamp: 1 }], bookmarks: {}, resetAt: 0 },
      { version: 2, attempts: [], bookmarks: { q: { on: 1, at: 1 } }, resetAt: 0 },
      { version: 3, attempts: [], bookmarks: {}, resetAt: 0 },
    ]) {
      expect(parseDoc(bad)).toBeNull()
    }
  })

  it('drops unknown fields', () => {
    const parsed = parseDoc({
      version: 2,
      attempts: [{ ...attempt('q1', 1), extra: true }],
      bookmarks: {},
      resetAt: 0,
      extra: 1,
    })
    expect(JSON.stringify(parsed)).not.toContain('extra')
  })
})

describe('sync IDs', () => {
  it('accepts v4 UUIDs, normalizing case and whitespace', () => {
    expect(isValidSyncId(crypto.randomUUID())).toBe(true)
    expect(isValidSyncId(normalizeSyncId('  0B6F3C1E-8A2D-4F5B-9C7E-1D2A3B4C5D6E '))).toBe(true)
    expect(isValidSyncId('../../etc/passwd')).toBe(false)
    expect(isValidSyncId('0b6f3c1e8a2d4f5b9c7e1d2a3b4c5d6e')).toBe(false)
  })
})
