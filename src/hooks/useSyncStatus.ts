import { useSyncExternalStore } from 'react'
import { getSyncSnapshot, subscribeSync, type SyncSnapshot } from '../lib/sync'

/** Live view of the offline-first sync engine's status. */
export function useSyncStatus(): SyncSnapshot {
  return useSyncExternalStore(
    (onChange) => subscribeSync(() => onChange()),
    getSyncSnapshot,
    getSyncSnapshot,
  )
}
