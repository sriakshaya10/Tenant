import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden>
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path d="M9 11h14M16 11v12" stroke="#f8f3f1" strokeWidth="3" strokeLinecap="round" />
      <circle cx="23" cy="22" r="2" fill="#e0a28f" />
    </svg>
  )
}

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5 text-ink', className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">TenantSynth</span>
    </Link>
  )
}
