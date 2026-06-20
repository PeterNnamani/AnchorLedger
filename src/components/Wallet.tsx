import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useFinancialAnalysis } from '../hooks/useFinancialAnalysis'
import { AccountCard } from './AccountCard'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseTable } from './ExpenseTable'
import { IncomeModal } from './IncomeModal'
import { StatCard } from './StatCard'

export function Wallet() {
  const { state, totalIncome, totalExpenditure, totalSavings, addIncome, addExpense, updateAccountNumber } =
    useFinance()
  const { alertBanner, analysisModal } = useFinancialAnalysis()
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [editingSafety, setEditingSafety] = useState(false)
  const [safetyNumber, setSafetyNumber] = useState('')

  const safetyAccount = state.accounts.find((a) => a.id === 'safety')

  function handleEditSafety() {
    setSafetyNumber(safetyAccount?.accountNumber === '— Add later —' ? '' : safetyAccount?.accountNumber ?? '')
    setEditingSafety(true)
  }

  function saveSafetyNumber() {
    if (safetyNumber.trim()) {
      updateAccountNumber('safety', safetyNumber.trim())
    }
    setEditingSafety(false)
  }

  return (
    <div className="wallet">
      <div className="page-header wallet-header">
        <div>
          <h1>Wallet</h1>
          <p>Your three accounts, income splits, and daily expenses</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowIncomeModal(true)}>
          + Record Income
        </button>
      </div>

      {alertBanner}

      <div className="stat-grid stat-grid--compact">
        <StatCard label="Total Income" value={totalIncome} variant="income" icon="↑" />
        <StatCard label="Total Expenditure" value={totalExpenditure} variant="expense" icon="↓" />
        <StatCard label="Total Savings" value={totalSavings} variant="savings" icon="◎" />
      </div>

      <section className="accounts-section">
        <h2>Your Accounts</h2>
        <div className="account-grid">
          {state.accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEditAccountNumber={account.id === 'safety' ? handleEditSafety : undefined}
            />
          ))}
        </div>
      </section>

      {editingSafety && (
        <div className="modal-overlay" onClick={() => setEditingSafety(false)}>
          <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Safety Net Account Number</h2>
              <button type="button" className="modal-close" onClick={() => setEditingSafety(false)}>
                ×
              </button>
            </div>
            <div className="modal-form">
              <label htmlFor="safety-acct">Access Bank Account Number</label>
              <input
                id="safety-acct"
                type="text"
                value={safetyNumber}
                onChange={(e) => setSafetyNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter account number"
                autoFocus
              />
              <button type="button" onClick={saveSafetyNumber}>Save</button>
            </div>
          </div>
        </div>
      )}

      <section className="panel">
        <ExpenseForm onSubmit={addExpense} />
      </section>

      <section className="panel">
        <h2>Expense History</h2>
        <div className="legend">
          <span className="legend-item legend-item--need">● Need</span>
          <span className="legend-item legend-item--want">● Want</span>
          <span className="legend-item legend-item--unnecessary">● Unnecessary</span>
        </div>
        <ExpenseTable expenses={state.expenses} />
      </section>

      {showIncomeModal && (
        <IncomeModal
          onClose={() => setShowIncomeModal(false)}
          onSubmit={addIncome}
        />
      )}

      {analysisModal}
    </div>
  )
}
