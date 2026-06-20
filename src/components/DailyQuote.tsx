import { useMemo } from 'react'
import { getDailyQuote } from '../lib/quotes'

export function DailyQuote() {
  const quote = useMemo(() => getDailyQuote(), [])
  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="daily-quote">
      <div className="daily-quote-mark">“</div>
      <div className="daily-quote-body">
        <p className="daily-quote-text">{quote.text}</p>
        <p className="daily-quote-meta">
          — {quote.author} · <span>{today}</span>
        </p>
      </div>
    </div>
  )
}
