import { useState, type FormEvent } from 'react'
import type { SplitOption } from '../types'
import { SplitSelector } from './SplitSelector'

interface IncomeModalProps {
  onClose: () => void
  onSubmit: (amount: number, source: string, split: SplitOption) => void
}

export function IncomeModal({ onClose, onSubmit }: IncomeModalProps) {
  const [step, setStep] = useState<'details' | 'split'>('details')
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [selectedSplit, setSelectedSplit] = useState<SplitOption | null>(null)
  const [error, setError] = useState('')

  function handleDetailsSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) {
      setError('Enter a valid income amount.')
      return
    }
    if (!source.trim()) {
      setError('Enter an income source.')
      return
    }
    setError('')
    setStep('split')
  }

  function handleConfirm() {
    if (!selectedSplit) {
      setError('Select a split option.')
      return
    }
    onSubmit(parseFloat(amount), source.trim(), selectedSplit)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Record Income</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {step === 'details' ? (
          <form onSubmit={handleDetailsSubmit} className="modal-form">
            <label htmlFor="income-amount">Amount (₦)</label>
            <input
              id="income-amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
              autoFocus
            />
            <label htmlFor="income-source">Income Source</label>
            <input
              id="income-source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Salary, freelance, gift..."
            />
            {error && <p className="form-error">{error}</p>}
            <button type="submit">Next — Choose Split</button>
          </form>
        ) : (
          <div className="modal-form">
            <SplitSelector
              amount={parseFloat(amount)}
              selectedId={selectedSplit?.id ?? null}
              onSelect={setSelectedSplit}
            />
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep('details')}>
                Back
              </button>
              <button type="button" onClick={handleConfirm} disabled={!selectedSplit}>
                Apply Split &amp; Credit Accounts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
