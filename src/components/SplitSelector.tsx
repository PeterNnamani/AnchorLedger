import type { AccountId } from '../types'
import { calculateAllocations } from '../lib/splits'
import { SPLIT_OPTIONS } from '../lib/splits'
import type { SplitOption } from '../types'

interface SplitSelectorProps {
  amount: number
  selectedId: string | null
  onSelect: (split: SplitOption) => void
}

const ACCOUNT_LABELS: Record<AccountId, string> = {
  growth: 'Growth Reserve',
  safety: 'Safety Net',
  daily: 'Daily Vault',
}

export function SplitSelector({ amount, selectedId, onSelect }: SplitSelectorProps) {
  return (
    <div className="split-selector">
      <p className="split-intro">Choose how to split ₦{amount.toLocaleString('en-NG')}:</p>
      <div className="split-options">
        {SPLIT_OPTIONS.map((split) => {
          const allocations = calculateAllocations(amount, split.percentages)
          const isSelected = selectedId === split.id

          return (
            <button
              key={split.id}
              type="button"
              className={`split-option ${isSelected ? 'split-option--selected' : ''}`}
              onClick={() => onSelect(split)}
            >
              <div className="split-option-header">
                <strong>{split.name}</strong>
                {isSelected && <span className="split-check">✓</span>}
              </div>
              <p className="split-desc">{split.description}</p>
              <div className="split-breakdown">
                {(Object.keys(allocations) as AccountId[]).map((id) => (
                  <div key={id} className="split-line">
                    <span>{ACCOUNT_LABELS[id]}</span>
                    <span>
                      {split.percentages[id]}% · ₦{allocations[id].toLocaleString('en-NG')}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
