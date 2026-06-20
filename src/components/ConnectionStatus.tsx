import { useSyncStatus } from '../hooks/useSyncStatus'
import { drain, type SyncStatus } from '../lib/sync'

const META: Record<SyncStatus, { label: string; cls: string }> = {
  online: { label: 'Synced', cls: 'is-online' },
  syncing: { label: 'Syncing', cls: 'is-syncing' },
  offline: { label: 'Offline', cls: 'is-offline' },
  error: { label: 'Retrying', cls: 'is-error' },
}

function formatAgo(ts: number | null): string {
  if (!ts) return 'Not yet synced'
  const seconds = Math.round((Date.now() - ts) / 1000)
  if (seconds < 60) return 'Synced just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `Synced ${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Synced ${hours}h ago`
  return `Synced ${Math.round(hours / 24)}d ago`
}

export function ConnectionStatus() {
  const { status, pending, lastSyncedAt } = useSyncStatus()
  const meta = META[status]

  const offline = status === 'offline'
  const label =
    offline && pending > 0
      ? `Offline · ${pending} queued`
      : status === 'online' && pending === 0
        ? 'Synced'
        : status === 'syncing'
          ? `Syncing${pending > 0 ? ` · ${pending}` : ''}`
          : status === 'error'
            ? `Retrying · ${pending}`
            : meta.label

  const title = offline
    ? `You're offline. ${pending} change(s) saved locally and will upload automatically when you reconnect.`
    : status === 'syncing'
      ? 'Uploading your latest changes to the cloud…'
      : status === 'error'
        ? 'Connection issue — changes are safe locally and will retry automatically.'
        : formatAgo(lastSyncedAt)

  return (
    <button
      type="button"
      className={`conn-status conn-status--${meta.cls}`}
      title={title}
      onClick={() => void drain()}
      aria-label={`Connection status: ${label}`}
    >
      <span className="conn-status-dot" aria-hidden="true" />
      <span className="conn-status-label">{label}</span>
    </button>
  )
}
