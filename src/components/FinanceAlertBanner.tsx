import type { WalletAlertLevel } from '../types'

interface FinanceAlertBannerProps {
  level: WalletAlertLevel
  message: string
  onViewAnalysis: () => void
}

export function FinanceAlertBanner({ level, message, onViewAnalysis }: FinanceAlertBannerProps) {
  if (level === 'none') return null

  return (
    <div className={`finance-alert finance-alert--${level}`} role="alert">
      <div className="finance-alert-content">
        <span className="finance-alert-icon">
          {level === 'critical' ? '🚨' : level === 'danger' ? '⚠️' : '⚡'}
        </span>
        <div>
          <strong>
            {level === 'critical' ? 'Critical' : level === 'danger' ? 'Danger' : 'Warning'}
          </strong>
          <p>{message}</p>
        </div>
      </div>
      <button type="button" className="finance-alert-btn" onClick={onViewAnalysis}>
        View Financial Analysis →
      </button>
    </div>
  )
}
