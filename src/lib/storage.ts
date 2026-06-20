import type { FinanceState } from '../types'

const STORAGE_KEY = 'anchorledger_finance'

export const DEFAULT_ACCOUNTS = [
  {
    id: 'growth' as const,
    name: 'Growth Reserve',
    bank: 'OPay',
    accountNumber: '8166641487',
    balance: 0,
  },
  {
    id: 'safety' as const,
    name: 'Safety Net',
    bank: 'Access Bank',
    accountNumber: '— Add later —',
    balance: 0,
  },
  {
    id: 'daily' as const,
    name: 'Daily Vault',
    bank: 'UBA',
    accountNumber: '2150781491',
    balance: 0,
  },
]

export function getDefaultState(): FinanceState {
  return {
    accounts: DEFAULT_ACCOUNTS.map((a) => ({ ...a })),
    incomes: [],
    expenses: [],
  }
}

export function loadState(): FinanceState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return getDefaultState()
  try {
    const parsed = JSON.parse(raw) as FinanceState
    return {
      accounts: parsed.accounts ?? getDefaultState().accounts,
      incomes: parsed.incomes ?? [],
      expenses: (parsed.expenses ?? []).map((e) => ({
        ...e,
        savingsUsed: e.savingsUsed ?? false,
      })),
    }
  } catch {
    return getDefaultState()
  }
}

export function saveState(state: FinanceState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
