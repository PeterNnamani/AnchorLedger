import type { Account, AccountId } from '../types'

export interface DeductionResult {
  success: boolean
  error?: string
  deductedFrom: AccountId[]
  emergencyUsed: boolean
  savingsUsed: boolean
  updatedAccounts: Account[]
}

export function deductExpense(
  accounts: Account[],
  amount: number,
): DeductionResult {
  if (amount <= 0) {
    return {
      success: false,
      error: 'Amount must be greater than zero.',
      deductedFrom: [],
      emergencyUsed: false,
      savingsUsed: false,
      updatedAccounts: accounts,
    }
  }

  const updated = accounts.map((a) => ({ ...a }))
  const daily = updated.find((a) => a.id === 'daily')!
  const safety = updated.find((a) => a.id === 'safety')!
  const growth = updated.find((a) => a.id === 'growth')!

  const deductedFrom: AccountId[] = []
  let remaining = amount
  let emergencyUsed = false
  let savingsUsed = false

  const fromDaily = Math.min(daily.balance, remaining)
  if (fromDaily > 0) {
    daily.balance -= fromDaily
    remaining -= fromDaily
    deductedFrom.push('daily')
  }

  if (remaining > 0) {
    const fromSafety = Math.min(safety.balance, remaining)
    if (fromSafety > 0) {
      safety.balance -= fromSafety
      remaining -= fromSafety
      deductedFrom.push('safety')
      emergencyUsed = true
    }
  }

  if (remaining > 0) {
    const fromGrowth = Math.min(growth.balance, remaining)
    if (fromGrowth > 0) {
      growth.balance -= fromGrowth
      remaining -= fromGrowth
      deductedFrom.push('growth')
      savingsUsed = true
    }
  }

  if (remaining > 0) {
    return {
      success: false,
      error: `Insufficient funds across all accounts. You are ₦${remaining.toLocaleString()} short.`,
      deductedFrom: [],
      emergencyUsed: false,
      savingsUsed: false,
      updatedAccounts: accounts,
    }
  }

  return { success: true, deductedFrom, emergencyUsed, savingsUsed, updatedAccounts: updated }
}
