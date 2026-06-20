interface LogoProps {
  size?: number
  showText?: boolean
}

export function Logo({ size = 40, showText = true }: LogoProps) {
  return (
    <div className="logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="48" height="48" rx="12" fill="url(#logoGrad)" />
        <path
          d="M24 10C17.37 10 12 15.37 12 22c0 4.2 2.1 7.9 5.3 10.1V36h13.4v-3.9C33.9 29.9 36 26.2 36 22c0-6.63-5.37-12-12-12z"
          fill="white"
          fillOpacity="0.95"
        />
        <rect x="18" y="36" width="12" height="3" rx="1.5" fill="white" fillOpacity="0.8" />
        <circle cx="24" cy="22" r="4" fill="url(#logoGrad)" />
        <path
          d="M22 22l1.5 1.5L26 20"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="logoGrad" x1="4" y1="4" x2="44" y2="44">
            <stop stopColor="#0d9488" />
            <stop offset="1" stopColor="#0369a1" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <div className="logo-text">
          <span className="logo-name">AnchorLedger</span>
          <span className="logo-tagline">Your personal finance anchor</span>
        </div>
      )}
    </div>
  )
}
