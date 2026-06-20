import { useEffect, useMemo, useRef, useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { assessWalletHealth, buildFinancialReport } from '../lib/analyst'
import {
  ensurePermission,
  getNotificationPrefs,
  isDesktop,
  notify,
  saveNotificationPrefs,
} from '../lib/desktop'

export function NotificationBell() {
  const { state, totalIncome, totalExpenditure } = useFinance()
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState(getNotificationPrefs)
  const popoverRef = useRef<HTMLDivElement>(null)

  const health = useMemo(
    () => assessWalletHealth(state, totalIncome),
    [state, totalIncome],
  )
  const report = useMemo(
    () => buildFinancialReport(state, totalIncome, totalExpenditure, health),
    [state, totalIncome, totalExpenditure, health],
  )

  const unread = (health.level !== 'none' ? 1 : 0) + report.sameDayAlerts.length
  const hasAlerts = unread > 0

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function update(next: Partial<typeof prefs>) {
    const merged = { ...prefs, ...next }
    setPrefs(merged)
    saveNotificationPrefs(merged)
  }

  async function handleEnable() {
    const granted = await ensurePermission()
    update({ enabled: granted || isDesktop() })
  }

  async function sendTest() {
    await ensurePermission()
    void notify({
      title: '🔔 Notifications are on',
      body: 'AnchorLedger will alert you in real time about your spending and balances.',
      tag: 'test',
      urgency: 'normal',
    })
  }

  return (
    <div className="notif-bell" ref={popoverRef}>
      <button
        type="button"
        className="notif-bell-btn"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.73 21a2 2 0 0 1-3.46 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {hasAlerts && <span className="notif-bell-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-popover" role="dialog" aria-label="Notification settings">
          <div className="notif-popover-head">
            <strong>Notifications</strong>
            <span className={`notif-status ${prefs.enabled ? 'on' : 'off'}`}>
              {prefs.enabled ? 'On' : 'Off'}
            </span>
          </div>

          <p className="notif-popover-sub">
            {isDesktop()
              ? 'Real-time desktop alerts with sound are active.'
              : 'Enable browser notifications, or install the desktop app for background alerts.'}
          </p>

          <label className="notif-toggle">
            <span>Enable notifications</span>
            <input
              type="checkbox"
              checked={prefs.enabled}
              onChange={(e) => (e.target.checked ? handleEnable() : update({ enabled: false }))}
            />
          </label>

          <label className="notif-toggle">
            <span>Notification sound</span>
            <input
              type="checkbox"
              checked={prefs.sound}
              onChange={(e) => update({ sound: e.target.checked })}
            />
          </label>

          <div className="notif-summary">
            {hasAlerts ? (
              <>
                <span className="notif-summary-count">{unread}</span>
                <span>active financial alert{unread === 1 ? '' : 's'}</span>
              </>
            ) : (
              <span>No active alerts — you're on track.</span>
            )}
          </div>

          <button type="button" className="notif-test-btn" onClick={sendTest}>
            Send test notification
          </button>
        </div>
      )}
    </div>
  )
}
