interface StatCardProps {
  label: string
  value: number
  variant: 'income' | 'expense' | 'savings'
  icon: string
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

export function StatCard({ label, value, variant, icon }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <span className="stat-card-label">{label}</span>
        <span className="stat-card-value">{formatNaira(value)}</span>
      </div>
    </div>
  )
}
