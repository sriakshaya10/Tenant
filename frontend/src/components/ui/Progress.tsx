import { cn } from '@/lib/cn'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  label?: string
}

export function Progress({ value, max = 100, className, label }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-line', className)}
    >
      <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}
