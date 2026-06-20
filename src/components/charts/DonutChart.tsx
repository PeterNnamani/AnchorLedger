import type { CategorySlice } from '../../lib/dashboardStats'
import { formatNaira } from '../../lib/dashboardStats'

interface DonutChartProps {
  data: CategorySlice[]
}

const SIZE = 180
const RADIUS = 70
const STROKE = 26
const CENTER = SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const COLORS: Record<string, string> = {
  need: '#22c55e',
  want: '#eab308',
  unnecessary: '#ef4444',
}

export function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return <p className="empty-state">No expenses yet to break down.</p>
  }

  // Precompute each slice's dash length and starting offset so we never mutate
  // state during render (the cumulative offset is derived, not reassigned).
  const segments = data.reduce<{ slice: CategorySlice; dash: number; offset: number }[]>(
    (acc, slice) => {
      const dash = (slice.value / total) * CIRCUMFERENCE
      const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0
      acc.push({ slice, dash, offset })
      return acc
    },
    [],
  )

  return (
    <div className="chart-block donut-block">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="donut-svg" role="img" aria-label="Spending by category">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE}
        />
        {segments.map(({ slice, dash, offset }) => (
          <circle
            key={slice.category}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={COLORS[slice.category]}
            strokeWidth={STROKE}
            strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        ))}
        <text x={CENTER} y={CENTER - 4} className="donut-center-value" textAnchor="middle">
          {formatNaira(total)}
        </text>
        <text x={CENTER} y={CENTER + 14} className="donut-center-label" textAnchor="middle">
          spent
        </text>
      </svg>
      <div className="donut-legend">
        {data.map((slice) => (
          <div key={slice.category} className="donut-legend-item">
            <span className="donut-dot" style={{ background: COLORS[slice.category] }} />
            <span className="donut-legend-label">{slice.label}</span>
            <span className="donut-legend-value">
              {formatNaira(slice.value)} ({Math.round((slice.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
