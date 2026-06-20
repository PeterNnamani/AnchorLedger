import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AccountId, ExpenseEntry, FinanceState, IncomeEntry, SplitOption } from '../types'
import { classifyExpense } from '../lib/classifier'
import { deductExpense } from '../lib/deductions'
import { calculateAllocations } from '../lib/splits'
import { loadState, saveState } from '../lib/storage'
import {
  pullState,
  queueAccount,
  queueEntireState,
  queueExpense,
  queueIncome,
  startSync,
} from '../lib/sync'

function isEmptyState(state: FinanceState): boolean {
  return (
    state.incomes.length === 0 &&
    state.expenses.length === 0 &&
    state.accounts.every((a) => a.balance === 0)
  )
}

interface FinanceContextValue {
  state: FinanceState
  totalIncome: number
  totalExpenditure: number
  totalSavings: number
  addIncome: (amount: number, source: string, split: SplitOption) => void
  addExpense: (amount: number, type: string, notes: string) => { success: boolean; error?: string }
  updateAccountNumber: (accountId: AccountId, accountNumber: string) => void
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(() => loadState())

  const persist = useCallback((next: FinanceState) => {
    setState(next)
    saveState(next)
  }, [])

  // Start the offline-first sync engine and reconcile with the cloud once.
  const bootstrapped = useRef(false)
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    startSync()

    void (async () => {
      const local = loadState()
      const remote = await pullState()

      if (isEmptyState(local) && remote) {
        // Fresh device / reinstall: restore from the cloud without re-queuing.
        setState(remote)
        saveState(remote)
      } else if (!isEmptyState(local)) {
        // Existing local data: make sure the cloud has a full copy.
        queueEntireState(local)
      }
    })()
  }, [])

  const totalIncome = useMemo(
    () => state.incomes.reduce((sum, i) => sum + i.amount, 0),
    [state.incomes],
  )

  const totalExpenditure = useMemo(
    () => state.expenses.reduce((sum, e) => sum + e.amount, 0),
    [state.expenses],
  )

  const totalSavings = useMemo(
    () => state.accounts.find((a) => a.id === 'growth')?.balance ?? 0,
    [state.accounts],
  )

  const addIncome = useCallback(
    (amount: number, source: string, split: SplitOption) => {
      const allocations = calculateAllocations(amount, split.percentages)
      const entry: IncomeEntry = {
        id: crypto.randomUUID(),
        amount,
        source,
        date: new Date().toISOString(),
        splitName: split.name,
        allocations,
      }

      const updatedAccounts = state.accounts.map((account) => ({
        ...account,
        balance: account.balance + allocations[account.id],
      }))

      persist({
        ...state,
        accounts: updatedAccounts,
        incomes: [entry, ...state.incomes],
      })

      queueIncome(entry)
      updatedAccounts.forEach(queueAccount)
    },
    [state, persist],
  )

  const addExpense = useCallback(
    (amount: number, type: string, notes: string) => {
      const result = deductExpense(state.accounts, amount)
      if (!result.success) {
        return { success: false, error: result.error }
      }

      const entry: ExpenseEntry = {
        id: crypto.randomUUID(),
        amount,
        type,
        notes,
        date: new Date().toISOString(),
        category: classifyExpense(type, notes),
        deductedFrom: result.deductedFrom,
        emergencyUsed: result.emergencyUsed,
        savingsUsed: result.savingsUsed,
      }

      persist({
        ...state,
        accounts: result.updatedAccounts,
        expenses: [entry, ...state.expenses],
      })

      queueExpense(entry)
      result.updatedAccounts.forEach(queueAccount)

      return { success: true }
    },
    [state, persist],
  )

  const updateAccountNumber = useCallback(
    (accountId: AccountId, accountNumber: string) => {
      const nextAccounts = state.accounts.map((a) =>
        a.id === accountId ? { ...a, accountNumber } : a,
      )
      persist({ ...state, accounts: nextAccounts })

      const changed = nextAccounts.find((a) => a.id === accountId)
      if (changed) queueAccount(changed)
    },
    [state, persist],
  )

  const value = useMemo(
    () => ({
      state,
      totalIncome,
      totalExpenditure,
      totalSavings,
      addIncome,
      addExpense,
      updateAccountNumber,
    }),
    [state, totalIncome, totalExpenditure, totalSavings, addIncome, addExpense, updateAccountNumber],
  )

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
