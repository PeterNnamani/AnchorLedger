const PIN = '2490'
const SECURITY_QUESTION =
  "What's the most important date in your life?"
const SECURITY_ANSWER = '23-12-2025'
const SESSION_KEY = 'anchorledger_session'

export function getSecurityQuestion(): string {
  return SECURITY_QUESTION
}

export function verifyPin(pin: string): boolean {
  return pin === PIN
}

export function verifySecurityAnswer(answer: string): boolean {
  return answer.trim() === SECURITY_ANSWER
}

export function createSession(): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ authenticated: true, at: Date.now() }))
}

export function isAuthenticated(): boolean {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return false
  try {
    const session = JSON.parse(raw) as { authenticated: boolean }
    return session.authenticated === true
  } catch {
    return false
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
