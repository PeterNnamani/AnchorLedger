import { useState, type FormEvent } from 'react'
import {
  createSession,
  getSecurityQuestion,
  verifyPin,
  verifySecurityAnswer,
} from '../lib/auth'
import { Logo } from './Logo'
import { WindowControls } from './WindowControls'

type AuthStep = 'pin' | 'security'

interface AuthGateProps {
  onAuthenticated: () => void
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [step, setStep] = useState<AuthStep>('pin')
  const [pin, setPin] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  function handlePinSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (verifyPin(pin)) {
      setStep('security')
      setPin('')
    } else {
      setError('Incorrect PIN. Try again.')
      setPin('')
    }
  }

  function handleSecuritySubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (verifySecurityAnswer(answer)) {
      createSession()
      onAuthenticated()
    } else {
      setError('Incorrect answer. Use format DD-MM-YYYY.')
      setAnswer('')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-titlebar">
        <WindowControls />
      </div>
      <div className="auth-card">
        <Logo size={56} />
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Private access — authorised users only</p>

        {step === 'pin' ? (
          <form onSubmit={handlePinSubmit} className="auth-form">
            <label htmlFor="pin">Enter your PIN</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoComplete="off"
              autoFocus
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={pin.length !== 4}>
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleSecuritySubmit} className="auth-form">
            <label htmlFor="security">{getSecurityQuestion()}</label>
            <input
              id="security"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="DD-MM-YYYY"
              autoComplete="off"
              autoFocus
            />
            <p className="auth-hint">Answer in DD-MM-YYYY format</p>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={!answer.trim()}>
              Unlock AnchorLedger
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setStep('pin')
                setError('')
                setAnswer('')
              }}
            >
              Back to PIN
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
