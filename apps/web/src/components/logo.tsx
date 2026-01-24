type LogoProps = { className?: string };

type LogoTextProps = {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
};

export function Logo({ className = 'h-10 w-10' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="45%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <radialGradient
          id="logoGlow"
          cx="0%"
          cy="0%"
          r="1"
          gradientTransform="translate(16 12) scale(90)"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="logoStroke" x1="24" y1="72" x2="72" y2="24">
          <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
      </defs>

      <rect x="6" y="6" width="84" height="84" rx="26" fill="url(#logoGradient)" />
      <rect x="6" y="6" width="84" height="84" rx="26" fill="url(#logoGlow)" />

      <path
        d="M24 34C32 24 48 20 60 26C72 32 76 46 70 58C64 70 50 76 36 72C26 70 20 60 22 48"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M26 60L40 46L52 52L70 34"
        stroke="url(#logoStroke)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M66 34H74V42"
        stroke="url(#logoStroke)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="60" r="3.5" fill="#ffffff" fillOpacity="0.7" />
      <circle cx="70" cy="34" r="3.5" fill="#ffffff" />
    </svg>
  );
}

export function LogoText({
  className = '',
  logoClassName = 'h-10 w-10',
  textClassName = 'text-2xl'
}: LogoTextProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo className={logoClassName} />
      <span
        className={`inline-flex items-center font-semibold tracking-tight text-transparent bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 bg-clip-text ${textClassName}`}
      >
        FinanceApp
      </span>
    </div>
  );
}
