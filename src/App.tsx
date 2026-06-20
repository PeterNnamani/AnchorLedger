import { useState } from 'react'
import { isAuthenticated } from './lib/auth'
import { FinanceProvider } from './context/FinanceContext'
import { AuthGate } from './components/AuthGate'
import { Layout, type Page } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { Wallet } from './components/Wallet'
import { DesktopNotificationsManager } from './components/DesktopNotificationsManager'

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated)
  const [page, setPage] = useState<Page>('dashboard')

  if (!authenticated) {
    return <AuthGate onAuthenticated={() => setAuthenticated(true)} />
  }

  return (
    <FinanceProvider>
      <DesktopNotificationsManager />
      <Layout currentPage={page} onNavigate={setPage}>
        {page === 'dashboard' ? <Dashboard /> : <Wallet />}
      </Layout>
    </FinanceProvider>
  )
}

export default App
