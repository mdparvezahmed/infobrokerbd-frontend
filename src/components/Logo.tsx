import Link from "next/link";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="ibb-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#ibb-g)" />
      <path
        d="M16 6.5c-4 0-7 3-7 6.9 0 4.9 5.6 10.6 6.3 11.3a1 1 0 0 0 1.4 0c.7-.7 6.3-6.4 6.3-11.3 0-3.9-3-6.9-7-6.9Z"
        fill="#fff"
      />
      <circle cx="16" cy="13.4" r="3.1" fill="#f43f5e" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="InfoBrokerBD home">
      <LogoMark />
      <span className="text-lg font-extrabold tracking-tight">
        InfoBroker<span className="text-brand-600">BD</span>
      </span>
    </Link>
  );
}
