import type { Account, ExpenseEntry, FinanceState, WalletAlertLevel } from '../types'

const LOW_DAILY_THRESHOLD = 5_000
const LOW_SAFETY_THRESHOLD = 10_000
const LOW_TOTAL_RATIO = 0.1

export interface WalletHealth {
  level: WalletAlertLevel
  message: string
  shouldShowAnalysis: boolean
}

export function assessWalletHealth(state: FinanceState, totalIncome: number): WalletHealth {
  const daily = state.accounts.find((a) => a.id === 'daily')?.balance ?? 0
  const safety = state.accounts.find((a) => a.id === 'safety')?.balance ?? 0
  const growth = state.accounts.find((a) => a.id === 'growth')?.balance ?? 0
  const total = daily + safety + growth

  if (totalIncome > 0 && total === 0) {
    return {
      level: 'critical',
      message: 'All accounts are fully exhausted. Your finances need immediate review.',
      shouldShowAnalysis: true,
    }
  }

  if (total === 0 && state.expenses.length > 0) {
    return {
      level: 'critical',
      message: 'You have zero balance across all accounts.',
      shouldShowAnalysis: true,
    }
  }

  if (daily === 0 && safety === 0 && growth > 0) {
    return {
      level: 'danger',
      message: 'Daily Vault and Safety Net are empty. You are now living off savings.',
      shouldShowAnalysis: true,
    }
  }

  if (daily === 0 && safety > 0) {
    return {
      level: 'danger',
      message: 'Daily Vault is exhausted. Emergency fund is now being consumed.',
      shouldShowAnalysis: true,
    }
  }

  if (totalIncome > 0 && total / totalIncome < LOW_TOTAL_RATIO) {
    return {
      level: 'danger',
      message: `Only ${Math.round((total / totalIncome) * 100)}% of your total income remains. Spending is dangerously high.`,
      shouldShowAnalysis: true,
    }
  }

  if (daily < LOW_DAILY_THRESHOLD && daily > 0) {
    return {
      level: 'warning',
      message: `Daily Vault is critically low at ₦${daily.toLocaleString()}. Slow down discretionary spending.`,
      shouldShowAnalysis: true,
    }
  }

  if (daily === 0) {
    return {
      level: 'warning',
      message: 'Daily Vault is empty. Any new expense will hit your Safety Net or savings.',
      shouldShowAnalysis: true,
    }
  }

  if (safety < LOW_SAFETY_THRESHOLD && safety > 0 && daily < LOW_DAILY_THRESHOLD * 3) {
    return {
      level: 'warning',
      message: 'Both spending and emergency buffers are running low.',
      shouldShowAnalysis: true,
    }
  }

  const recentSavingsDips = state.expenses.filter((e) => e.savingsUsed).length
  if (recentSavingsDips >= 2) {
    return {
      level: 'warning',
      message: 'You have repeatedly dipped into Growth Reserve. This pattern will destroy your savings.',
      shouldShowAnalysis: true,
    }
  }

  return { level: 'none', message: '', shouldShowAnalysis: false }
}

export function getAccountStatuses(accounts: Account[]) {
  return accounts.map((a) => {
    let status = 'Healthy'
    if (a.balance === 0) status = 'Exhausted'
    else if (a.id === 'daily' && a.balance < LOW_DAILY_THRESHOLD) status = 'Critically low'
    else if (a.id === 'safety' && a.balance < LOW_SAFETY_THRESHOLD) status = 'Low'
    else if (a.id === 'growth' && a.balance < 20_000) status = 'At risk'
    return { name: a.name, balance: a.balance, status }
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function normalizeType(type: string): string {
  return type.trim().toLowerCase().replace(/\s+/g, ' ')
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  return Math.max(1, Math.ceil(Math.abs(db - da) / (1000 * 60 * 60 * 24)))
}

export function buildFinancialReport(
  state: FinanceState,
  totalIncome: number,
  totalExpenditure: number,
  health: WalletHealth,
): import('../types').FinancialReport {
  const { expenses, incomes } = state
  const unnecessary = expenses.filter((e) => e.category === 'unnecessary')
  const wants = expenses.filter((e) => e.category === 'want')
  const needs = expenses.filter((e) => e.category === 'need')

  const unnecessaryTotal = sum(unnecessary)
  const wantsTotal = sum(wants)
  const needsTotal = sum(needs)

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenditure) / totalIncome) * 100 : 0
  const spendRate = totalIncome > 0 ? (totalExpenditure / totalIncome) * 100 : 0

  const disciplineScore = calculateDisciplineScore(
    expenses,
    totalIncome,
    totalExpenditure,
    state.accounts,
  )

  const sameDayAlerts = detectSameDayAlerts(expenses, totalIncome)

  const mistakes: string[] = []
  const recommendations: string[] = []
  const shouldHaveBought: string[] = []
  const shouldNotHaveBought: string[] = []
  const incomeInsights: string[] = []
  const expenditureInsights: string[] = []

  if (incomes.length === 0) {
    incomeInsights.push('You have recorded no income. Without income data, discipline cannot be measured.')
  } else {
    const avgIncome = totalIncome / incomes.length
    const sources = [...new Set(incomes.map((i) => i.source))]
    incomeInsights.push(
      `Total recorded income: ₦${totalIncome.toLocaleString()} across ${incomes.length} deposit(s).`,
    )
    incomeInsights.push(`Average income entry: ₦${Math.round(avgIncome).toLocaleString()}.`)
    incomeInsights.push(`Income sources: ${sources.join(', ')}.`)

    const lastIncome = incomes[0]
    const daysSinceIncome = daysBetween(lastIncome.date, new Date().toISOString())
    const spendSinceIncome = expenses
      .filter((e) => new Date(e.date) >= new Date(lastIncome.date))
      .reduce((s, e) => s + e.amount, 0)

    if (spendSinceIncome > lastIncome.amount * 0.7) {
      mistakes.push(
        `You have spent ₦${spendSinceIncome.toLocaleString()} since your last income of ₦${lastIncome.amount.toLocaleString()} (${formatDate(lastIncome.date)}) — over 70% gone in ${daysSinceIncome} day(s).`,
      )
    }
  }

  expenditureInsights.push(
    `Total spent: ₦${totalExpenditure.toLocaleString()} (${Math.round(spendRate)}% of income).`,
  )
  expenditureInsights.push(
    `Breakdown — Needs: ₦${needsTotal.toLocaleString()} (${pct(needsTotal, totalExpenditure)}), Wants: ₦${wantsTotal.toLocaleString()} (${pct(wantsTotal, totalExpenditure)}), Unnecessary: ₦${unnecessaryTotal.toLocaleString()} (${pct(unnecessaryTotal, totalExpenditure)}).`,
  )

  if (unnecessaryTotal > 0) {
    mistakes.push(
      `₦${unnecessaryTotal.toLocaleString()} went to unnecessary purchases. That is money you cannot recover.`,
    )
    unnecessary.forEach((e) => {
      shouldNotHaveBought.push(
        `${formatDate(e.date)}: ${e.type} — ₦${e.amount.toLocaleString()}${e.notes ? ` (${e.notes})` : ''}`,
      )
    })
  }

  if (wantsTotal > needsTotal && needsTotal > 0) {
    mistakes.push(
      `Wants (₦${wantsTotal.toLocaleString()}) exceeded needs (₦${needsTotal.toLocaleString()}). You are prioritising comfort over survival.`,
    )
  }

  if (wantsTotal > totalIncome * 0.25 && totalIncome > 0) {
    mistakes.push('More than 25% of your income went to wants. That is financially reckless.')
  }

  const emergencyDips = expenses.filter((e) => e.emergencyUsed && !e.savingsUsed)
  const savingsDips = expenses.filter((e) => e.savingsUsed)

  if (emergencyDips.length > 0) {
    mistakes.push(
      `You touched your Safety Net ${emergencyDips.length} time(s). Emergency funds are for emergencies, not poor planning.`,
    )
  }

  if (savingsDips.length > 0) {
    mistakes.push(
      `You raided Growth Reserve ${savingsDips.length} time(s) totalling ₦${sum(savingsDips).toLocaleString()}. Savings should be your last resort — and you are already there.`,
    )
  }

  needs
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .forEach((e) => {
      shouldHaveBought.push(
        `${formatDate(e.date)}: ${e.type} — ₦${e.amount.toLocaleString()} ✓ (genuine need)`,
      )
    })

  wants
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .forEach((e) => {
      shouldNotHaveBought.push(
        `${formatDate(e.date)}: ${e.type} — ₦${e.amount.toLocaleString()} (want — could have waited or skipped)`,
      )
    })

  if (savingsRate < 20 && totalIncome > 0) {
    recommendations.push(
      'Target saving at least 20% of every income. You are saving below sustainable levels.',
    )
  }

  if (unnecessary.length > 0) {
    recommendations.push(
      'Eliminate all unnecessary spending for the next 30 days. Treat every purchase as a loan from your future self.',
    )
  }

  if (sameDayAlerts.length > 0) {
    recommendations.push(
      'Stop same-day spending clusters. One category per day, one trip, one decision.',
    )
  }

  recommendations.push(
    'Use the Growth-First split on your next income. Rebuild buffers before spending freely.',
  )

  if (totalExpenditure > totalIncome && totalIncome > 0) {
    mistakes.push(
      `You spent ₦${(totalExpenditure - totalIncome).toLocaleString()} more than you earned. You are operating at a deficit.`,
    )
    recommendations.unshift(
      'You are living beyond your means. Cut all non-essential spending immediately until income exceeds expenditure.',
    )
  }

  if (mistakes.length === 0 && expenses.length > 0) {
    mistakes.push('No catastrophic errors detected — but low balances mean your margin for error is gone.')
  }

  if (shouldHaveBought.length === 0 && needs.length === 0) {
    shouldHaveBought.push('No essential purchases recorded yet. Ensure basics (food, transport, bills) are tracked.')
  }

  if (shouldNotHaveBought.length === 0 && wants.length === 0 && unnecessary.length === 0) {
    shouldNotHaveBought.push('No discretionary spending recorded.')
  }

  const headline = buildHeadline(health.level, disciplineScore)
  const verdict = buildVerdict(health.level, disciplineScore, savingsRate, spendRate)

  return {
    level: health.level,
    headline,
    verdict,
    disciplineScore,
    incomeInsights,
    expenditureInsights,
    mistakes,
    recommendations,
    shouldHaveBought,
    shouldNotHaveBought,
    sameDayAlerts,
    accountStatus: getAccountStatuses(state.accounts),
  }
}

function sum(items: { amount: number }[]): number {
  return items.reduce((s, i) => s + i.amount, 0)
}

function pct(part: number, whole: number): string {
  if (whole === 0) return '0%'
  return `${Math.round((part / whole) * 100)}%`
}

function calculateDisciplineScore(
  expenses: ExpenseEntry[],
  totalIncome: number,
  totalExpenditure: number,
  accounts: Account[],
): number {
  let score = 100

  const unnecessary = expenses.filter((e) => e.category === 'unnecessary')
  score -= unnecessary.length * 8
  score -= expenses.filter((e) => e.savingsUsed).length * 12
  score -= expenses.filter((e) => e.emergencyUsed && !e.savingsUsed).length * 6

  if (totalIncome > 0 && totalExpenditure > totalIncome) {
    score -= 25
  }

  const wantsRatio = totalExpenditure > 0
    ? expenses.filter((e) => e.category === 'want').reduce((s, e) => s + e.amount, 0) / totalExpenditure
    : 0
  if (wantsRatio > 0.4) score -= 15

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  if (totalIncome > 0 && totalBalance / totalIncome < 0.1) score -= 20

  return Math.max(0, Math.min(100, Math.round(score)))
}

function detectSameDayAlerts(expenses: ExpenseEntry[], totalIncome: number): import('../types').SameDayAlert[] {
  const byDate = new Map<string, ExpenseEntry[]>()

  for (const e of expenses) {
    const day = e.date.slice(0, 10)
    const list = byDate.get(day) ?? []
    list.push(e)
    byDate.set(day, list)
  }

  const alerts: import('../types').SameDayAlert[] = []
  const daySpendThreshold = totalIncome > 0 ? totalIncome * 0.15 : 50_000

  for (const [date, dayExpenses] of byDate) {
    const dayTotal = sum(dayExpenses)
    if (dayTotal > daySpendThreshold) {
      alerts.push({
        date: formatDate(date),
        category: 'All spending',
        count: dayExpenses.length,
        total: dayTotal,
        items: dayExpenses.map((e) => `${e.type} ₦${e.amount.toLocaleString()}`),
        message: `You spent ₦${dayTotal.toLocaleString()} on ${formatDate(date)} — over 15% of total income in a single day.`,
      })
    }

    const byType = new Map<string, ExpenseEntry[]>()
    for (const e of dayExpenses) {
      const key = normalizeType(e.type)
      const list = byType.get(key) ?? []
      list.push(e)
      byType.set(key, list)
    }

    for (const [type, items] of byType) {
      const typeTotal = sum(items)
      if (items.length >= 2 || (items.length === 1 && items[0].amount > 20_000 && items[0].category !== 'need')) {
        const isCluster = items.length >= 2
        const isHeavySingle = items.length === 1 && items[0].amount > 20_000

        if (isCluster || isHeavySingle) {
          alerts.push({
            date: formatDate(date),
            category: type,
            count: items.length,
            total: typeTotal,
            items: items.map((e) => `${e.type} ₦${e.amount.toLocaleString()} (${e.category})`),
            message: isCluster
              ? `${items.length} separate "${type}" purchases on ${formatDate(date)} totalling ₦${typeTotal.toLocaleString()}. This is impulsive same-day stacking.`
              : `Single "${type}" purchase of ₦${typeTotal.toLocaleString()} on ${formatDate(date)} — high for one transaction.`,
          })
        }
      }

      if (items.length >= 3) {
        alerts.push({
          date: formatDate(date),
          category: type,
          count: items.length,
          total: typeTotal,
          items: items.map((e) => `₦${e.amount.toLocaleString()}`),
          message: `ALERT: ${items.length} purchases on "${type}" in one day (${formatDate(date)}). You are binge-spending on a single category.`,
        })
      }
    }
  }

  const seen = new Set<string>()
  return alerts.filter((a) => {
    const key = `${a.date}-${a.category}-${a.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildHeadline(level: WalletAlertLevel, score: number): string {
  if (level === 'critical') return 'Financial Emergency — Accounts Depleted'
  if (level === 'danger') return 'Critical Warning — Buffers Breached'
  if (level === 'warning') return 'Low Balance Alert — Discipline Required'
  if (score < 50) return 'Poor Financial Discipline Detected'
  return 'Financial Health Review'
}

function buildVerdict(
  level: WalletAlertLevel,
  score: number,
  savingsRate: number,
  spendRate: number,
): string {
  if (level === 'critical') {
    return 'As your financial counsellor, I must be direct: you have exhausted your resources. Every naira you spent brought you here. Review this report carefully before spending another kobo.'
  }
  if (level === 'danger') {
    return 'You have burned through your spending account and are now eating into reserves meant for emergencies and growth. This is not sustainable. Correct course immediately.'
  }
  if (score < 40) {
    return `Your discipline score is ${score}/100 — unacceptable. You spent ${Math.round(spendRate)}% of income and saved only ${Math.round(savingsRate)}%. You know what you did wrong; this report proves it.`
  }
  if (score < 70) {
    return `Discipline score: ${score}/100. You are making avoidable mistakes. Read every section below — I will not soften this.`
  }
  return `Discipline score: ${score}/100. Room for improvement remains. Study the same-day alerts and unnecessary spending lists.`
}
