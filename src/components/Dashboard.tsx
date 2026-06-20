import { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useFinancialAnalysis } from '../hooks/useFinancialAnalysis'
import { computeDashboardStats, formatNaira } from '../lib/dashboardStats'
import { categoryLabel } from '../lib/classifier'
import { StatCard } from './StatCard'
import { DailyQuote } from './DailyQuote'
import { JobsPanel } from './JobsPanel'
import { TrendChart } from './charts/TrendChart'
import { DonutChart } from './charts/DonutChart'
import { MiniBarChart } from './charts/MiniBarChart'

export function Dashboard() {
  const { totalIncome, totalExpenditure, totalSavings, state } = useFinance()
  const { alertBanner, analysisModal } = useFinancialAnalysis()

  const stats = useMemo(() => computeDashboardStats(state), [state])
  const recentIncomes = state.incomes.slice(0, 5)

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Your financial snapshot at a glance</p>
      </div>

      <DailyQuote />

      {alertBanner}

      <div className="stat-grid">
        <StatCard label="Total Income" value={totalIncome} variant="income" icon="↑" />
        <StatCard label="Total Expenditure" value={totalExpenditure} variant="expense" icon="↓" />
        <StatCard label="Total Savings" value={totalSavings} variant="savings" icon="◎" />
      </div>

      <div className="dashboard-charts">
        <section className="panel chart-panel chart-panel--wide">
          <h2>Income vs Expenditure</h2>
          <TrendChart data={stats.trend} />
        </section>

        <section className="panel chart-panel">
          <h2>Spending Breakdown</h2>
          <DonutChart data={stats.categoryBreakdown} />
        </section>
      </div>

      <div className="dashboard-charts">
        <section className="panel chart-panel">
          <h2>Account Balances</h2>
          <MiniBarChart data={stats.accountBars} />
        </section>

        <section className="panel chart-panel chart-panel--wide">
          <h2>Real-Life Analysis</h2>
          <div className="analysis-grid">
            <div className="analysis-metric">
              <span className="analysis-metric-label">Savings Rate</span>
              <span className={`analysis-metric-value ${stats.savingsRate < 20 ? 'metric-bad' : 'metric-good'}`}>
                {Math.round(stats.savingsRate)}%
              </span>
              <span className="analysis-metric-hint">
                {stats.savingsRate < 20 ? 'Below the 20% target' : 'Healthy'}
              </span>
            </div>
            <div className="analysis-metric">
              <span className="analysis-metric-label">Avg Daily Burn</span>
              <span className="analysis-metric-value">{formatNaira(stats.avgDailyBurn)}</span>
              <span className="analysis-metric-hint">over {stats.activeDays} active day(s)</span>
            </div>
            <div className="analysis-metric">
              <span className="analysis-metric-label">Financial Runway</span>
              <span className={`analysis-metric-value ${stats.runwayDays !== null && stats.runwayDays < 14 ? 'metric-bad' : ''}`}>
                {stats.runwayDays === null ? '—' : `${stats.runwayDays} days`}
              </span>
              <span className="analysis-metric-hint">at current burn rate</span>
            </div>
            <div className="analysis-metric">
              <span className="analysis-metric-label">Unnecessary Spend</span>
              <span className={`analysis-metric-value ${stats.unnecessaryTotal > 0 ? 'metric-bad' : 'metric-good'}`}>
                {formatNaira(stats.unnecessaryTotal)}
              </span>
              <span className="analysis-metric-hint">money you could have kept</span>
            </div>
            <div className="analysis-metric">
              <span className="analysis-metric-label">Biggest Expense</span>
              <span className="analysis-metric-value analysis-metric-value--sm">
                {stats.biggestExpense ? stats.biggestExpense.type : '—'}
              </span>
              <span className="analysis-metric-hint">
                {stats.biggestExpense ? formatNaira(stats.biggestExpense.amount) : 'No expenses yet'}
              </span>
            </div>
            <div className="analysis-metric">
              <span className="analysis-metric-label">Top Income Source</span>
              <span className="analysis-metric-value analysis-metric-value--sm">
                {stats.topIncomeSource ? stats.topIncomeSource.source : '—'}
              </span>
              <span className="analysis-metric-hint">
                {stats.topIncomeSource ? formatNaira(stats.topIncomeSource.amount) : 'No income yet'}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-tables">
        <section className="panel">
          <h2>Top Expenses</h2>
          {stats.topExpenses.length === 0 ? (
            <p className="empty-state">No expenses recorded yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.topExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{new Date(expense.date).toLocaleDateString('en-NG')}</td>
                    <td>{expense.type}</td>
                    <td>
                      <span className={`badge badge--${expense.category}`}>
                        {categoryLabel(expense.category)}
                      </span>
                    </td>
                    <td className="amount-negative">{formatNaira(expense.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2>Recent Income</h2>
          {recentIncomes.length === 0 ? (
            <p className="empty-state">No income recorded yet. Head to Wallet to add your first income.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Split</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentIncomes.map((income) => (
                  <tr key={income.id}>
                    <td>{new Date(income.date).toLocaleDateString('en-NG')}</td>
                    <td>{income.source}</td>
                    <td>{income.splitName}</td>
                    <td className="amount-positive">{formatNaira(income.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <JobsPanel />

      {analysisModal}
    </div>
  )
}
