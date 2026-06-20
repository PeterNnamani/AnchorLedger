import type { TrendPoint } from '../../lib/dashboardStats'
import { formatNaira } from '../../lib/dashboardStats'

interface TrendChartProps {
  data: TrendPoint[]
}

const WIDTH = 520
const HEIGHT = 200
const PADDING = { top: 16, right: 12, bottom: 28, left: 12 }

function buildPath(values: number[], max: number): string {
  if (values.length === 0) return ''
  const innerW = WIDTH - PADDING.left - PADDING.right
  const innerH = HEIGHT - PADDING.top - PADDING.bottom
  const step = values.length > 1 ? innerW / (values.length - 1) : 0

  return values
    .map((value, i) => {
      const x = PADDING.left + step * i
      const y = PADDING.top + innerH - (max > 0 ? (value / max) * innerH : 0)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return <p className="empty-state">No activity yet to chart.</p>
  }

  const max = Math.max(
    1,
    ...data.map((d) => Math.max(d.income, d.expenditure)),
  )

  const incomePath = buildPath(data.map((d) => d.income), max)
  const expensePath = buildPath(data.map((d) => d.expenditure), max)

  const innerW = WIDTH - PADDING.left - PADDING.right
  const step = data.length > 1 ? innerW / (data.length - 1) : 0

  return (
    <div className="chart-block">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="trend-svg" role="img" aria-label="Income versus expenditure trend">
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = PADDING.top + (HEIGHT - PADDING.top - PADDING.bottom) * (1 - ratio)
          return (
            <line
              key={ratio}
              x1={PADDING.left}
              y1={y}
              x2={WIDTH - PADDING.right}
              y2={y}
              className="chart-gridline"
            />
          )
        })}

        <path d={expensePath} className="trend-line trend-line--expense" fill="none" />
        <path d={incomePath} className="trend-line trend-line--income" fill="none" />

        {data.map((d, i) => {
          const x = PADDING.left + step * i
          return (
            <text key={i} x={x} y={HEIGHT - 8} className="chart-axis-label" textAnchor="middle">
              {d.label}
            </text>
          )
        })}
      </svg>
      <div className="chart-legend">
        <span className="chart-legend-item chart-legend-item--income">
          ● Income · {formatNaira(data.reduce((s, d) => s + d.income, 0))}
        </span>
        <span className="chart-legend-item chart-legend-item--expense">
          ● Expenditure · {formatNaira(data.reduce((s, d) => s + d.expenditure, 0))}
        </span>
      </div>
    </div>
  )
}
