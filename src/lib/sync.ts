// Offline-first sync engine.
//
// Local storage is always the source of truth for the UI. Every mutation is
// also queued into a durable "outbox" in local storage. Whenever the device is
// online, the outbox is drained to Supabase (idempotent upserts). Because the
// outbox lives in local storage, queued changes survive app restarts and power
// loss, and upload automatically as soon as connectivity returns.

import type { Account, ExpenseEntry, FinanceState, IncomeEntry } from '../types'
import { getDefaultState } from './storage'
import {
  RECORDS_TABLE,
  WORKSPACE_ID,
  supabase,
  type RecordKind,
} from './supabase'

const OUTBOX_KEY = 'anchorledger_outbox'
const LAST_SYNCED_KEY = 'anchorledger_last_synced'

export interface OutboxOp {
  kind: RecordKind
  id: string
  data: unknown
  ts: number
}

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error'

export interface SyncSnapshot {
  status: SyncStatus
  pending: number
  lastSyncedAt: number | null
  lastError: string | null
}

const opKey = (kind: RecordKind, id: string) => `${kind}:${id}`

// --- Outbox persistence ----------------------------------------------------

function loadOutbox(): OutboxOp[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as OutboxOp[]) : []
  } catch {
    return []
  }
}

function saveOutbox(ops: OutboxOp[]): void {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(ops))
  } catch {
    /* storage full / unavailable — best effort */
  }
}

function loadLastSynced(): number | null {
  const raw = localStorage.getItem(LAST_SYNCED_KEY)
  return raw ? Number(raw) || null : null
}

// --- Status pub/sub --------------------------------------------------------

const listeners = new Set<(snap: SyncSnapshot) => void>()

let snapshot: SyncSnapshot = {
  status: isOnline() ? 'online' : 'offline',
  pending: loadOutbox().length,
  lastSyncedAt: loadLastSynced(),
  lastError: null,
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

function emit(patch: Partial<SyncSnapshot>): void {
  snapshot = { ...snapshot, ...patch, pending: loadOutbox().length }
  for (const cb of listeners) cb(snapshot)
}

export function getSyncSnapshot(): SyncSnapshot {
  return snapshot
}

export function subscribeSync(cb: (snap: SyncSnapshot) => void): () => void {
  listeners.add(cb)
  cb(snapshot)
  return () => listeners.delete(cb)
}

// --- Enqueue ---------------------------------------------------------------

/** Queue a record for upload. Collapses repeated edits of the same record. */
export function enqueueUpsert(kind: RecordKind, id: string, data: unknown): void {
  const ops = loadOutbox().filter((op) => opKey(op.kind, op.id) !== opKey(kind, id))
  ops.push({ kind, id, data, ts: Date.now() })
  saveOutbox(ops)
  emit({})
  void drain()
}

/** Convenience helpers mapping the finance domain onto outbox ops. */
export function queueAccount(account: Account): void {
  enqueueUpsert('account', account.id, account)
}

export function queueIncome(income: IncomeEntry): void {
  enqueueUpsert('income', income.id, income)
}

export function queueExpense(expense: ExpenseEntry): void {
  enqueueUpsert('expense', expense.id, expense)
}

// --- Drain (upload) --------------------------------------------------------

let draining = false

export async function drain(): Promise<void> {
  if (draining) return
  if (!isOnline()) {
    emit({ status: 'offline' })
    return
  }

  const ops = loadOutbox()
  if (ops.length === 0) {
    emit({ status: 'online' })
    return
  }

  draining = true
  emit({ status: 'syncing' })

  // Remember exactly what we're sending so concurrent edits aren't lost.
  const sent = new Map<string, number>()
  for (const op of ops) sent.set(opKey(op.kind, op.id), op.ts)

  const rows = ops.map((op) => ({
    workspace_id: WORKSPACE_ID,
    kind: op.kind,
    id: op.id,
    data: op.data,
  }))

  try {
    const { error } = await supabase
      .from(RECORDS_TABLE)
      .upsert(rows, { onConflict: 'workspace_id,kind,id' })
    if (error) throw error

    // Drop only the ops we successfully sent; keep anything re-queued meanwhile.
    const remaining = loadOutbox().filter((op) => {
      const ts = sent.get(opKey(op.kind, op.id))
      return ts === undefined || op.ts > ts
    })
    saveOutbox(remaining)

    const now = Date.now()
    localStorage.setItem(LAST_SYNCED_KEY, String(now))
    emit({ status: remaining.length > 0 ? 'syncing' : 'online', lastSyncedAt: now, lastError: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    emit({ status: isOnline() ? 'error' : 'offline', lastError: message })
  } finally {
    draining = false
    if (loadOutbox().length > 0 && isOnline()) {
      setTimeout(() => void drain(), 4000)
    }
  }
}

// --- Pull / restore --------------------------------------------------------

/**
 * Fetches all records for this workspace and reconstructs a FinanceState.
 * Returns null when offline, on error, or when the workspace has no data yet.
 */
export async function pullState(): Promise<FinanceState | null> {
  if (!isOnline()) return null
  try {
    const { data, error } = await supabase
      .from(RECORDS_TABLE)
      .select('kind,id,data')
      .eq('workspace_id', WORKSPACE_ID)
    if (error || !data || data.length === 0) return null

    const accounts: Account[] = []
    const incomes: IncomeEntry[] = []
    const expenses: ExpenseEntry[] = []

    for (const row of data as { kind: RecordKind; data: unknown }[]) {
      if (row.kind === 'account') accounts.push(row.data as Account)
      else if (row.kind === 'income') incomes.push(row.data as IncomeEntry)
      else if (row.kind === 'expense') expenses.push(row.data as ExpenseEntry)
    }

    const byDateDesc = (a: { date: string }, b: { date: string }) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    incomes.sort(byDateDesc)
    expenses.sort(byDateDesc)

    // Backfill any missing default accounts so the UI always has all three.
    const defaults = getDefaultState().accounts
    const merged = defaults.map((def) => accounts.find((a) => a.id === def.id) ?? def)

    return { accounts: merged, incomes, expenses }
  } catch {
    return null
  }
}

/** Push an entire FinanceState into the outbox (used for an initial backfill). */
export function queueEntireState(state: FinanceState): void {
  state.accounts.forEach(queueAccount)
  state.incomes.forEach(queueIncome)
  state.expenses.forEach(queueExpense)
}

// --- Lifecycle -------------------------------------------------------------

let started = false
let intervalId: ReturnType<typeof setInterval> | null = null

/** Wire up connectivity listeners and kick off an initial drain. Idempotent. */
export function startSync(): void {
  if (started || typeof window === 'undefined') return
  started = true

  window.addEventListener('online', () => {
    emit({ status: 'online' })
    void drain()
  })
  window.addEventListener('offline', () => emit({ status: 'offline' }))

  // Safety net: retry pending uploads periodically even without events.
  intervalId = setInterval(() => {
    if (isOnline() && loadOutbox().length > 0) void drain()
    else emit({})
  }, 15000)

  void drain()
}

export function stopSync(): void {
  if (intervalId) clearInterval(intervalId)
  intervalId = null
  started = false
}
