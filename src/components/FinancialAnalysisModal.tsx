import type { CSSProperties } from 'react'
import type { FinancialReport } from '../types'

interface FinancialAnalysisModalProps {
  report: FinancialReport
  onClose: () => void
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? 'var(--need)' : score >= 40 ? 'var(--want)' : 'var(--unnecessary)'
  return (
    <div className="score-ring" style={{ '--score-color': color } as CSSProperties}>
      <span className="score-value">{score}</span>
      <span className="score-label">Discipline</span>
    </div>
  )
}

function Section({ title, items, variant }: { title: string; items: string[]; variant?: string }) {
  if (items.length === 0) return null
  return (
    <section className={`analysis-section ${variant ?? ''}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export function FinancialAnalysisModal({ report, onClose }: FinancialAnalysisModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--analysis" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="analysis-counsellor">Your Independent Financial Counsellor</p>
            <h2>{report.headline}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="analysis-body">
          <div className={`analysis-verdict analysis-verdict--${report.level}`}>
            <ScoreRing score={report.disciplineScore} />
            <p>{report.verdict}</p>
          </div>

          <section className="analysis-section">
            <h3>Account Status</h3>
            <div className="account-status-grid">
              {report.accountStatus.map((a) => (
                <div key={a.name} className={`account-status account-status--${a.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className="account-status-name">{a.name}</span>
                  <span className="account-status-balance">₦{a.balance.toLocaleString()}</span>
                  <span className="account-status-label">{a.status}</span>
                </div>
              ))}
            </div>
          </section>

          <Section title="Income Analysis" items={report.incomeInsights} />
          <Section title="Expenditure Analysis" items={report.expenditureInsights} />

          {report.sameDayAlerts.length > 0 && (
            <section className="analysis-section analysis-section--alerts">
              <h3>Same-Day Spending Alerts</h3>
              {report.sameDayAlerts.map((alert, i) => (
                <div key={i} className="same-day-alert">
                  <p className="same-day-alert-msg">{alert.message}</p>
                  <ul>
                    {alert.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          <Section title="What You Did Wrong" items={report.mistakes} variant="analysis-section--mistakes" />
          <Section title="How You Should Have Done Better" items={report.recommendations} variant="analysis-section--recommendations" />

          <div className="analysis-columns">
            <Section title="Legitimate Purchases (Needs)" items={report.shouldHaveBought} variant="analysis-section--good" />
            <Section title="Purchases You Should NOT Have Made" items={report.shouldNotHaveBought} variant="analysis-section--bad" />
          </div>
        </div>

        <div className="analysis-footer">
          <p>This report is generated strictly from your recorded data. No excuses — only corrections.</p>
          <button type="button" onClick={onClose}>Close Report</button>
        </div>
      </div>
    </div>
  )
}
