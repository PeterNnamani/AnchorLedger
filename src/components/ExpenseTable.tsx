import type { ExpenseEntry } from '../types'
import { categoryLabel } from '../lib/classifier'

interface ExpenseTableProps {
  expenses: ExpenseEntry[]
}

const ACCOUNT_NAMES: Record<string, string> = {
  daily: 'Daily Vault',
  safety: 'Safety Net',
  growth: 'Growth Reserve',
}

export function ExpenseTable({ expenses }: ExpenseTableProps) {
  if (expenses.length === 0) {
    return <p className="empty-state">No expenses recorded yet.</p>
  }

  return (
    <div className="table-wrap">
      <table className="data-table expense-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Notes</th>
            <th>Category</th>
            <th>Deducted From</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr
              key={expense.id}
              className={`expense-row expense-row--${expense.category}`}
            >
              <td>{new Date(expense.date).toLocaleDateString('en-NG')}</td>
              <td>{expense.type}</td>
              <td>{expense.notes || '—'}</td>
              <td>
                <span className={`badge badge--${expense.category}`}>
                  {categoryLabel(expense.category)}
                </span>
              </td>
              <td>
                {expense.deductedFrom.map((id) => ACCOUNT_NAMES[id]).join(' → ')}
                {expense.emergencyUsed && (
                  <span className="danger-alert" title="Emergency fund was used">
                    ⚠ Emergency
                  </span>
                )}
                {expense.savingsUsed && (
                  <span className="savings-alert" title="Savings were used">
                    🚨 Savings
                  </span>
                )}
              </td>
              <td className="amount-negative">₦{expense.amount.toLocaleString('en-NG')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
