export type ExpenseCategory = 'need' | 'want' | 'unnecessary'

export type AccountId = 'growth' | 'safety' | 'daily'

export interface Account {
  id: AccountId
  name: string
  bank: string
  accountNumber: string
  balance: number
}

export interface IncomeEntry {
  id: string
  amount: number
  source: string
  date: string
  splitName: string
  allocations: Record<AccountId, number>
}

export interface ExpenseEntry {
  id: string
  amount: number
  type: string
  notes: string
  date: string
  category: ExpenseCategory
  deductedFrom: AccountId[]
  emergencyUsed: boolean
  savingsUsed: boolean
}

export type WalletAlertLevel = 'none' | 'warning' | 'danger' | 'critical'

export interface SameDayAlert {
  date: string
  category: string
  count: number
  total: number
  items: string[]
  message: string
}

export interface FinancialReport {
  level: WalletAlertLevel
  headline: string
  verdict: string
  disciplineScore: number
  incomeInsights: string[]
  expenditureInsights: string[]
  mistakes: string[]
  recommendations: string[]
  shouldHaveBought: string[]
  shouldNotHaveBought: string[]
  sameDayAlerts: SameDayAlert[]
  accountStatus: { name: string; balance: number; status: string }[]
}

export interface SplitOption {
  id: string
  name: string
  description: string
  percentages: Record<AccountId, number>
}

export interface FinanceState {
  accounts: Account[]
  incomes: IncomeEntry[]
  expenses: ExpenseEntry[]
}
