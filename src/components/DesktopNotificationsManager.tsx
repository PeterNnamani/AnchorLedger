import { useEffect, useMemo, useRef } from 'react'
import { useFinance } from '../context/FinanceContext'
import { assessWalletHealth, buildFinancialReport } from '../lib/analyst'
import { getDailyQuote } from '../lib/quotes'
import { ensurePermission, notify, setBadge } from '../lib/desktop'
import type { NotificationUrgency } from '../lib/desktop'
import type { WalletAlertLevel } from '../types'

const SEEN_KEY = 'anchorledger_seen_alerts'
const TIP_KEY = 'anchorledger_last_tip'

function urgencyForLevel(level: WalletAlertLevel): NotificationUrgency {
  if (level === 'critical' || level === 'danger') return 'critical'
  if (level === 'warning') return 'normal'
  return 'low'
}

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveSeen(seen: Set<string>): void {
  // Cap the history so it never grows unbounded.
  const arr = [...seen].slice(-200)
  localStorage.setItem(SEEN_KEY, JSON.stringify(arr))
}

/**
 * Invisible component that turns finance events into real-time desktop
 * notifications. Mount once inside the FinanceProvider.
 */
export function DesktopNotificationsManager() {
  const { state, totalIncome, totalExpenditure } = useFinance()

  const health = useMemo(
    () => assessWalletHealth(state, totalIncome),
    [state, totalIncome],
  )

  const report = useMemo(
    () => buildFinancialReport(state, totalIncome, totalExpenditure, health),
    [state, totalIncome, totalExpenditure, health],
  )

  const seenRef = useRef<Set<string>>(loadSeen())
  const lastHealthSig = useRef<string>('')

  // Request browser permission once (no-op inside Electron).
  useEffect(() => {
    void ensurePermission()
  }, [])

  // Daily money tip — fires at most once per calendar day.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(TIP_KEY) === today) return
    const quote = getDailyQuote()
    const timer = window.setTimeout(() => {
      void notify({
        title: 'Daily money discipline',
        body: `"${quote.text}" — ${quote.author}`,
        tag: 'daily-tip',
        urgency: 'low',
      })
      localStorage.setItem(TIP_KEY, today)
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [])

  // Wallet health changes -> notify when the situation meaningfully changes.
  useEffect(() => {
    if (!health.shouldShowAnalysis || health.level === 'none') {
      lastHealthSig.current = ''
      return
    }
    const sig = `${health.level}:${health.message}`
    if (sig === lastHealthSig.current) return
    lastHealthSig.current = sig

    const title =
      health.level === 'critical'
        ? '🚨 Financial emergency'
        : health.level === 'danger'
          ? '⚠️ Danger — buffers breached'
          : '⚡ Low balance alert'

    void notify({
      title,
      body: health.message,
      tag: 'wallet-health',
      urgency: urgencyForLevel(health.level),
      requireInteraction: health.level === 'critical',
    })
  }, [health])

  // Same-day spending clusters -> notify for each newly detected alert.
  useEffect(() => {
    const fresh = report.sameDayAlerts.filter((a) => {
      const key = `sameday:${a.date}:${a.category}:${a.message}`
      return !seenRef.current.has(key)
    })
    if (fresh.length === 0) return

    fresh.slice(0, 3).forEach((alert) => {
      const key = `sameday:${alert.date}:${alert.category}:${alert.message}`
      seenRef.current.add(key)
      void notify({
        title: '🧾 Spending pattern detected',
        body: alert.message,
        tag: key,
        urgency: 'normal',
      })
    })
    saveSeen(seenRef.current)
  }, [report.sameDayAlerts])

  // Keep the tray/dock badge in sync with the number of active alerts.
  useEffect(() => {
    const activeHealth = health.level !== 'none' ? 1 : 0
    setBadge(activeHealth + report.sameDayAlerts.length)
  }, [health.level, report.sameDayAlerts.length])

  // Respond to the tray "Run financial check" action with a live summary.
  useEffect(() => {
    if (!window.anchorDesktop) return
    const unsubscribe = window.anchorDesktop.onRunFinancialCheck(() => {
      if (health.level === 'none') {
        void notify({
          title: '✅ Finances on track',
          body: `Discipline score ${report.disciplineScore}/100. No active alerts — keep it up.`,
          tag: 'financial-check',
          urgency: 'low',
        })
      } else {
        void notify({
          title: report.headline,
          body: health.message,
          tag: 'financial-check',
          urgency: urgencyForLevel(health.level),
        })
      }
    })
    return unsubscribe
  }, [health, report])

  return null
}
