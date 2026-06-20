import { useState, type FormEvent } from 'react'
import { classifyExpense, categoryLabel } from '../lib/classifier'

interface ExpenseFormProps {
  onSubmit: (amount: number, type: string, notes: string) => { success: boolean; error?: string }
}

export function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState<ReturnType<typeof classifyExpense> | null>(null)

  function updatePreview(nextType: string, nextNotes: string) {
    if (nextType.trim()) {
      setPreview(classifyExpense(nextType, nextNotes))
    } else {
      setPreview(null)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) {
      setError('Enter a valid expense amount.')
      return
    }
    if (!type.trim()) {
      setError('Enter an expense type.')
      return
    }

    const result = onSubmit(parsed, type.trim(), notes.trim())
    if (!result.success) {
      setError(result.error ?? 'Could not record expense.')
      return
    }

    setSuccess('Expense recorded successfully.')
    setAmount('')
    setType('')
    setNotes('')
    setPreview(null)
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <h3>Record Expense</h3>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="exp-amount">Amount (₦)</label>
          <input
            id="exp-amount"
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5000"
          />
        </div>
        <div className="form-field">
          <label htmlFor="exp-type">Expense Type</label>
          <input
            id="exp-type"
            type="text"
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              updatePreview(e.target.value, notes)
            }}
            placeholder="Groceries, transport, dining..."
          />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="exp-notes">Notes (optional)</label>
        <input
          id="exp-notes"
          type="text"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            updatePreview(type, e.target.value)
          }}
          placeholder="Additional details..."
        />
      </div>

      {preview && (
        <p className={`category-preview category-preview--${preview}`}>
          System classification: <strong>{categoryLabel(preview)}</strong>
        </p>
      )}

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <button type="submit">Record Expense</button>
      <p className="deduction-note">
        Deducted from Daily Vault first, then Safety Net, then Growth Reserve if needed. View Financial Analysis when balances run low.
      </p>
    </form>
  )
}
