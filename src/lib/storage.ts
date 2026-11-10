import { emptyDoc, parseDoc, type ProgressDoc } from './progressDoc'

export const STORAGE_KEY = 'aws-saa:progress'
/** Pre-sync key; read once and migrated. */
export const LEGACY_STORAGE_KEY = 'aws-saa:v1'
export const SYNC_ID_KEY = 'aws-saa:sync-id'

function read(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Loads the progress doc; unreadable data yields a fresh start. */
export function loadDoc(storage: Storage = localStorage): ProgressDoc {
  return parseDoc(read(storage, STORAGE_KEY)) ?? parseDoc(read(storage, LEGACY_STORAGE_KEY)) ?? emptyDoc()
}

export function saveDoc(doc: ProgressDoc, storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(doc))
    storage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Storage full or unavailable: progress stays in memory for this session.
  }
}

export function loadSyncId(storage: Storage = localStorage): string | null {
  try {
    return storage.getItem(SYNC_ID_KEY)
  } catch {
    return null
  }
}

export function saveSyncId(id: string | null, storage: Storage = localStorage): void {
  try {
    if (id) storage.setItem(SYNC_ID_KEY, id)
    else storage.removeItem(SYNC_ID_KEY)
  } catch {
    // ignore
  }
}
