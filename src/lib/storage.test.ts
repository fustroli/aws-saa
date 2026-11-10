import { describe, expect, it } from 'vitest'
import { LEGACY_STORAGE_KEY, STORAGE_KEY, loadDoc, loadSyncId, saveDoc, saveSyncId } from './storage'
import { emptyDoc, toggleBookmark, toProgress } from './progressDoc'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

describe('storage', () => {
  it('round-trips the progress doc', () => {
    const s = new MemoryStorage()
    const doc = toggleBookmark(
      { ...emptyDoc(), attempts: [{ questionId: 'q', selected: ['a'], correct: true, timestamp: 1 }] },
      'q',
      2,
    )
    saveDoc(doc, s)
    expect(loadDoc(s)).toEqual(doc)
  })

  it('starts fresh when empty or corrupt', () => {
    const s = new MemoryStorage()
    expect(loadDoc(s)).toEqual(emptyDoc())
    s.setItem(STORAGE_KEY, '{not json')
    expect(loadDoc(s)).toEqual(emptyDoc())
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 99, attempts: [] }))
    expect(loadDoc(s)).toEqual(emptyDoc())
  })

  it('migrates v1 data and removes the old key on next save', () => {
    const s = new MemoryStorage()
    const attempts = [{ questionId: 'q', selected: ['a'], correct: false, timestamp: 1 }]
    s.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ version: 1, attempts, bookmarks: ['q'] }))
    const doc = loadDoc(s)
    expect(toProgress(doc)).toEqual({ attempts, bookmarks: ['q'] })
    saveDoc(doc, s)
    expect(s.getItem(LEGACY_STORAGE_KEY)).toBeNull()
  })

  it('stores and clears the sync ID', () => {
    const s = new MemoryStorage()
    expect(loadSyncId(s)).toBeNull()
    saveSyncId('abc', s)
    expect(loadSyncId(s)).toBe('abc')
    saveSyncId(null, s)
    expect(loadSyncId(s)).toBeNull()
  })
})
