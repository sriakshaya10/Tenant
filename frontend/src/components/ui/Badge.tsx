import React from 'react'
import { cn } from '@/lib/cn'

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const tones: Record<Tone, { box: string; dot: string }> = {
  neutral: { box: 'bg-ink/5 text-ink-soft', dot: 'bg-ink-faint' },
  success: { box: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  warning: { box: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  danger: { box: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  info: { box: 'bg-sky-50 text-sky-800', dot: 'bg-sky-500' },
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  dot?: boolean
}

export function Badge({ tone = 'neutral', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium', tones[tone].box, className)}
      {...props}
    >
      {dot && <span className={cn('size-1.5 rounded-full', tones[tone].dot)} />}
      {children}
    </span>
  )
}

const STATUS_TONE: Record<string, Tone> = {
  completed: 'success',
  running: 'info',
  pending: 'warning',
  failed: 'danger',
  cancelled: 'neutral',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
