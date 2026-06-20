import { useEffect, useState } from 'react'
import { isDesktop, windowControls } from '../lib/desktop'

// Custom, branded window controls for the frameless Electron window. Renders
// nothing in a plain browser (where the OS / browser chrome handles this).
export function WindowControls() {
  const [maximized, setMaximized] = useState(false)
  const desktop = isDesktop()

  useEffect(() => {
    if (!desktop) return
    let active = true
    void windowControls.isMaximized().then((value) => {
      if (active) setMaximized(value)
    })
    const unsubscribe = windowControls.onMaximizedChange(setMaximized)
    return () => {
      active = false
      unsubscribe()
    }
  }, [desktop])

  if (!desktop) return null

  return (
    <div className="window-controls" role="group" aria-label="Window controls">
      <button
        type="button"
        className="window-control window-control--min"
        onClick={() => windowControls.minimize()}
        aria-label="Minimize"
        title="Minimize"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
          <rect x="1" y="5" width="9" height="1.3" rx="0.65" fill="currentColor" />
        </svg>
      </button>

      <button
        type="button"
        className="window-control window-control--max"
        onClick={() => void windowControls.toggleMaximize()}
        aria-label={maximized ? 'Restore' : 'Maximize'}
        title={maximized ? 'Restore' : 'Maximize'}
      >
        {maximized ? (
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
            <rect x="2.4" y="0.9" width="7" height="7" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <rect x="0.9" y="2.4" width="7" height="7" rx="1.4" fill="var(--titlebar-bg, #111827)" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
            <rect x="1" y="1" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        )}
      </button>

      <button
        type="button"
        className="window-control window-control--close"
        onClick={() => windowControls.close()}
        aria-label="Close"
        title="Close"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
          <path
            d="M1.5 1.5l8 8M9.5 1.5l-8 8"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
