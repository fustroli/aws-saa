import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Attempt } from './types'
import { loadDoc, loadSyncId, saveDoc, saveSyncId } from './lib/storage'
import {
  addAttempt,
  isValidSyncId,
  mergeDocs,
  normalizeSyncId,
  resetDoc,
  serializeDoc,
  toggleBookmark as toggleBookmarkIn,
  toProgress,
} from './lib/progressDoc'
import { fetchRemote, pushRemote, SyncError } from './lib/syncClient'

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'synced' | 'error'

export interface SyncState {
  id: string | null
  status: SyncStatus
  lastSyncedAt?: number
  error?: string
}

const PUSH_DELAY_MS = 1500

/** Progress state: saved to localStorage, and synced to the server when a sync ID is set. */
export function useProgress() {
  const [doc, setDoc] = useState(loadDoc)
  const [syncId, setSyncId] = useState(loadSyncId)
  const [sync, setSync] = useState<Omit<SyncState, 'id'>>({ status: syncId ? 'idle' : 'off' })
  // Bumped after each successful sync, so changes made while a request was in flight get pushed too.
  const [syncRound, setSyncRound] = useState(0)

  const docRef = useRef(doc)
  const lastSynced = useRef<string | null>(null) // serialized doc the server last confirmed
  const inFlight = useRef(false)

  useEffect(() => {
    docRef.current = doc
    saveDoc(doc)
  }, [doc])

  const runSync = useCallback(async (id: string, force = false) => {
    if (inFlight.current) return
    if (!force && serializeDoc(docRef.current) === lastSynced.current) return
    inFlight.current = true
    setSync((s) => ({ ...s, status: 'syncing' }))
    try {
      const remote = await pushRemote(id, docRef.current)
      lastSynced.current = serializeDoc(remote)
      setDoc((current) => mergeDocs(current, remote))
      setSync({ status: 'synced', lastSyncedAt: Date.now() })
      setSyncRound((r) => r + 1)
    } catch (e) {
      setSync((s) => ({ ...s, status: 'error', error: e instanceof SyncError ? e.message : 'Sync failed.' }))
    } finally {
      inFlight.current = false
    }
  }, [])

  // Push shortly after local changes (and once on startup).
  useEffect(() => {
    if (!syncId) return
    const timer = setTimeout(() => void runSync(syncId), PUSH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [doc, syncId, syncRound, runSync])

  // Pick up changes from other devices when coming back to the tab.
  useEffect(() => {
    if (!syncId) return
    const onVisible = () => document.visibilityState === 'visible' && void runSync(syncId, true)
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [syncId, runSync])

  const connect = useCallback((id: string) => {
    saveSyncId(id)
    setSyncId(id)
    lastSynced.current = null
    setSync({ status: 'idle' })
  }, [])

  /** Starts syncing under a brand-new ID. */
  const createSyncId = useCallback(() => connect(crypto.randomUUID()), [connect])

  /** Links this device to an existing ID; local and remote progress are merged. Throws on failure. */
  const linkSyncId = useCallback(
    async (input: string) => {
      const id = normalizeSyncId(input)
      if (!isValidSyncId(id)) throw new SyncError('That does not look like a sync ID.')
      const remote = await fetchRemote(id)
      if (!remote) throw new SyncError('No progress found for this ID.')
      setDoc((current) => mergeDocs(current, remote))
      connect(id)
    },
    [connect],
  )

  /** Stops syncing on this device. Local progress is kept. */
  const disconnect = useCallback(() => {
    saveSyncId(null)
    setSyncId(null)
    lastSynced.current = null
    setSync({ status: 'off' })
  }, [])

  const syncNow = useCallback(() => {
    if (syncId) void runSync(syncId, true)
  }, [syncId, runSync])

  const recordAttempt = useCallback((attempt: Attempt) => setDoc((d) => addAttempt(d, attempt)), [])

  const toggleBookmark = useCallback(
    (questionId: string) => setDoc((d) => toggleBookmarkIn(d, questionId, Date.now())),
    [],
  )

  /** Clears progress here and, when synced, on every device using the same ID. */
  const reset = useCallback(() => setDoc(resetDoc(Date.now())), [])

  const progress = useMemo(() => toProgress(doc), [doc])
  const syncState: SyncState = { id: syncId, ...sync }

  return {
    progress,
    recordAttempt,
    toggleBookmark,
    reset,
    sync: syncState,
    createSyncId,
    linkSyncId,
    disconnect,
    syncNow,
  }
}
