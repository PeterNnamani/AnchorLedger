import type { AccountBar } from '../../lib/dashboardStats'
import { formatNaira } from '../../lib/dashboardStats'

interface MiniBarChartProps {
  data: AccountBar[]
}

export function MiniBarChart({ data }: MiniBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))

  if (data.every((d) => d.value === 0)) {
    return <p className="empty-state">No balances yet. Record income to fund your accounts.</p>
  }

  return (
    <div className="bar-chart">
      {data.map((bar) => (
        <div key={bar.label} className="bar-row">
          <span className="bar-label">{bar.label}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(bar.value / max) * 100}%`, background: bar.color }}
            />
          </div>
          <span className="bar-value">{formatNaira(bar.value)}</span>
        </div>
      ))}
    </div>
  )
}
