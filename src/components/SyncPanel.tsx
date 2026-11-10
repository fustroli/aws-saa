import { useState, type FormEvent } from 'react'
import type { SyncState } from '../useProgress'

interface Props {
  sync: SyncState
  onCreate: () => void
  onLink: (id: string) => Promise<void>
  onDisconnect: () => void
  onSyncNow: () => void
}

function statusText(sync: SyncState): string {
  switch (sync.status) {
    case 'syncing':
      return 'Syncing…'
    case 'synced':
      return `Synced ${new Date(sync.lastSyncedAt ?? Date.now()).toLocaleTimeString()}`
    case 'error':
      return sync.error ?? 'Sync failed.'
    default:
      return 'Waiting to sync…'
  }
}

export function SyncPanel({ sync, onCreate, onLink, onDisconnect, onSyncNow }: Props) {
  const [input, setInput] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const link = async (e: FormEvent) => {
    e.preventDefault()
    setLinking(true)
    setLinkError(null)
    try {
      await onLink(input)
      setInput('')
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Could not link this ID.')
    } finally {
      setLinking(false)
    }
  }

  const copy = async () => {
    if (!sync.id) return
    try {
      await navigator.clipboard.writeText(sync.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked: the ID is still selectable on screen.
    }
  }

  const disconnect = () => {
    if (confirm('Stop syncing on this device? Progress stays here, and you can link the ID again later.')) {
      onDisconnect()
    }
  }

  if (sync.id) {
    return (
      <section className="card">
        <h2>Sync across devices</h2>
        <p className="muted small-text">Enter this ID on another device to load your progress there.</p>
        <div className="sync-id">
          <code>{sync.id}</code>
          <button className="small-btn" onClick={copy}>
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <p className={`sync-status ${sync.status}`}>{statusText(sync)}</p>
        <p className="muted small-text">Anyone with this ID can see and change your progress. Keep it private.</p>
        <div className="actions">
          <button onClick={onSyncNow} disabled={sync.status === 'syncing'}>
            Sync now
          </button>
          <button className="link danger-link" onClick={disconnect}>
            Disconnect this device
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Sync across devices</h2>
      <p className="muted small-text">
        No account needed. Create a sync ID here, then enter it on your other devices.
      </p>
      <button className="primary" onClick={onCreate}>
        Create sync ID
      </button>
      <form className="link-form" onSubmit={link}>
        <label className="field-label" htmlFor="sync-id-input">
          Already have an ID?
        </label>
        <div className="link-row">
          <input
            id="sync-id-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" disabled={linking || input.trim() === ''}>
            {linking ? 'Linking…' : 'Link'}
          </button>
        </div>
        {linkError && <p className="sync-status error">{linkError}</p>}
        <p className="muted small-text">Progress on this device is merged with the ID's progress.</p>
      </form>
    </section>
  )
}
