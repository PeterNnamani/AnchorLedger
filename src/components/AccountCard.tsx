import type { Account } from '../types'

interface AccountCardProps {
  account: Account
  onEditAccountNumber?: () => void
}

const CARD_STYLES: Record<string, { gradient: string; chip: string }> = {
  growth: { gradient: 'card-growth', chip: 'Growth' },
  safety: { gradient: 'card-safety', chip: 'Safety' },
  daily: { gradient: 'card-daily', chip: 'Daily' },
}

export function AccountCard({ account, onEditAccountNumber }: AccountCardProps) {
  const style = CARD_STYLES[account.id]

  return (
    <div className={`account-card ${style.gradient}`}>
      <div className="account-card-top">
        <span className="account-chip">{style.chip}</span>
        <span className="account-bank">{account.bank}</span>
      </div>
      <p className="account-name">{account.name}</p>
      <p className="account-balance">₦{account.balance.toLocaleString('en-NG')}</p>
      <div className="account-card-bottom">
        <span className="account-number-label">Account</span>
        <span className="account-number">
          {account.accountNumber}
          {onEditAccountNumber && (
            <button type="button" className="btn-edit-acct" onClick={onEditAccountNumber} title="Edit account number">
              ✎
            </button>
          )}
        </span>
      </div>
      <div className="card-shine" aria-hidden="true" />
    </div>
  )
}
