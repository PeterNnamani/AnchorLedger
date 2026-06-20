import { clearSession } from '../lib/auth'
import { Logo } from './Logo'
import { NotificationBell } from './NotificationBell'
import { ConnectionStatus } from './ConnectionStatus'
import { WindowControls } from './WindowControls'

export type Page = 'dashboard' | 'wallet'

interface LayoutProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  children: React.ReactNode
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  function handleLogout() {
    clearSession()
    window.location.reload()
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <Logo size={36} />
        <nav className="app-nav">
          <button
            type="button"
            className={currentPage === 'dashboard' ? 'nav-active' : ''}
            onClick={() => onNavigate('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={currentPage === 'wallet' ? 'nav-active' : ''}
            onClick={() => onNavigate('wallet')}
          >
            Wallet
          </button>
        </nav>
        <div className="app-header-actions">
          <ConnectionStatus />
          <NotificationBell />
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Lock
          </button>
          <WindowControls />
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
