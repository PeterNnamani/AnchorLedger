import { useMemo, useState } from 'react'
import { buildFinancialReport, assessWalletHealth } from '../lib/analyst'
import { useFinance } from '../context/FinanceContext'
import { FinanceAlertBanner } from '../components/FinanceAlertBanner'
import { FinancialAnalysisModal } from '../components/FinancialAnalysisModal'

export function useFinancialAnalysis() {
  const { state, totalIncome, totalExpenditure } = useFinance()
  const [showAnalysis, setShowAnalysis] = useState(false)

  const health = useMemo(
    () => assessWalletHealth(state, totalIncome),
    [state, totalIncome],
  )

  const report = useMemo(
    () => buildFinancialReport(state, totalIncome, totalExpenditure, health),
    [state, totalIncome, totalExpenditure, health],
  )

  const alertBanner = health.shouldShowAnalysis ? (
    <FinanceAlertBanner
      level={health.level}
      message={health.message}
      onViewAnalysis={() => setShowAnalysis(true)}
    />
  ) : null

  const analysisModal = showAnalysis ? (
    <FinancialAnalysisModal report={report} onClose={() => setShowAnalysis(false)} />
  ) : null

  return { health, report, alertBanner, analysisModal, openAnalysis: () => setShowAnalysis(true) }
}
