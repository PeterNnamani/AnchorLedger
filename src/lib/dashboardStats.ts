import type { ExpenseCategory, FinanceState } from '../types'

export interface TrendPoint {
  label: string
  income: number
  expenditure: number
}

export interface CategorySlice {
  category: ExpenseCategory
  label: string
  value: number
}

export interface AccountBar {
  label: string
  value: number
  color: string
}

export interface TopExpense {
  id: string
  type: string
  amount: number
  category: ExpenseCategory
  date: string
}

export interface DashboardStats {
  hasData: boolean
  trend: TrendPoint[]
  categoryBreakdown: CategorySlice[]
  accountBars: AccountBar[]
  savingsRate: number
  avgDailyBurn: number
  runwayDays: number | null
  biggestExpense: TopExpense | null
  topIncomeSource: { source: string; amount: number } | null
  topExpenses: TopExpense[]
  unnecessaryTotal: number
  activeDays: number
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  need: 'Needs',
  want: 'Wants',
  unnecessary: 'Unnecessary',
}

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

function shortLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

/**
 * Builds an income-vs-expenditure series across the most recent active days.
 * Days are derived from the union of income and expense dates so the chart
 * reflects actual activity rather than empty calendar gaps.
 */
function buildTrend(state: FinanceState, maxPoints = 14): TrendPoint[] {
  const byDay = new Map<string, { income: number; expenditure: number }>()

  for (const income of state.incomes) {
    const key = dayKey(income.date)
    const slot = byDay.get(key) ?? { income: 0, expenditure: 0 }
    slot.income += income.amount
    byDay.set(key, slot)
  }

  for (const expense of state.expenses) {
    const key = dayKey(expense.date)
    const slot = byDay.get(key) ?? { income: 0, expenditure: 0 }
    slot.expenditure += expense.amount
    byDay.set(key, slot)
  }

  const sortedKeys = [...byDay.keys()].sort()
  const recentKeys = sortedKeys.slice(-maxPoints)

  return recentKeys.map((key) => ({
    label: shortLabel(key),
    income: byDay.get(key)!.income,
    expenditure: byDay.get(key)!.expenditure,
  }))
}

function buildCategoryBreakdown(state: FinanceState): CategorySlice[] {
  const totals: Record<ExpenseCategory, number> = {
    need: 0,
    want: 0,
    unnecessary: 0,
  }

  for (const expense of state.expenses) {
    totals[expense.category] += expense.amount
  }

  return (Object.keys(totals) as ExpenseCategory[])
    .map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      value: totals[category],
    }))
    .filter((slice) => slice.value > 0)
}

function buildAccountBars(state: FinanceState): AccountBar[] {
  const colors: Record<string, string> = {
    growth: '#3b82f6',
    safety: '#eab308',
    daily: '#22c55e',
  }

  return state.accounts.map((account) => ({
    label: account.name,
    value: account.balance,
    color: colors[account.id] ?? '#14b8a6',
  }))
}

function countActiveDays(state: FinanceState): number {
  const days = new Set<string>()
  for (const expense of state.expenses) days.add(dayKey(expense.date))
  return days.size
}

export function computeDashboardStats(state: FinanceState): DashboardStats {
  const totalIncome = state.incomes.reduce((sum, i) => sum + i.amount, 0)
  const totalExpenditure = state.expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalBalance = state.accounts.reduce((sum, a) => sum + a.balance, 0)

  const hasData = state.incomes.length > 0 || state.expenses.length > 0

  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpenditure) / totalIncome) * 100 : 0

  const activeDays = Math.max(1, countActiveDays(state))
  const avgDailyBurn = totalExpenditure / activeDays

  const runwayDays =
    avgDailyBurn > 0 ? Math.floor(totalBalance / avgDailyBurn) : null

  const sortedExpenses = [...state.expenses].sort((a, b) => b.amount - a.amount)
  const topExpenses: TopExpense[] = sortedExpenses.slice(0, 5).map((e) => ({
    id: e.id,
    type: e.type,
    amount: e.amount,
    category: e.category,
    date: e.date,
  }))
  const biggestExpense = topExpenses[0] ?? null

  const incomeBySource = new Map<string, number>()
  for (const income of state.incomes) {
    incomeBySource.set(
      income.source,
      (incomeBySource.get(income.source) ?? 0) + income.amount,
    )
  }
  let topIncomeSource: { source: string; amount: number } | null = null
  for (const [source, amount] of incomeBySource) {
    if (!topIncomeSource || amount > topIncomeSource.amount) {
      topIncomeSource = { source, amount }
    }
  }

  const unnecessaryTotal = state.expenses
    .filter((e) => e.category === 'unnecessary')
    .reduce((sum, e) => sum + e.amount, 0)

  return {
    hasData,
    trend: buildTrend(state),
    categoryBreakdown: buildCategoryBreakdown(state),
    accountBars: buildAccountBars(state),
    savingsRate,
    avgDailyBurn,
    runwayDays,
    biggestExpense,
    topIncomeSource,
    topExpenses,
    unnecessaryTotal,
    activeDays,
  }
}

export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`
}
