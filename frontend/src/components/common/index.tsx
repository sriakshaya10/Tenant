import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Select } from '@/components/ui/Select'
import { formatNumber } from '@/lib/format'
import type { Dataset } from '@/types'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-ink-faint', className)} />
}

export function PageLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-64 items-center justify-center', className)}>
      <Spinner />
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  eyebrow?: React.ReactNode
}

export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="font-serif text-[28px] leading-tight tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

interface EmptyStateProps {
  title: string
  description?: React.ReactNode
  icon?: React.ElementType
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex size-10 items-center justify-center rounded-full border border-line bg-canvas">
          <Icon className="size-[18px] text-ink-muted" />
        </div>
      )}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

interface StatProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  size?: 'md' | 'sm'
  className?: string
}

/** A single figure. Meant to sit inside a StatGrid. */
export function Stat({ label, value, hint, size = 'md', className }: StatProps) {
  return (
    <div className={cn('min-w-0 bg-white px-5 py-4', className)}>
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p className={cn('tabular mt-1 truncate font-mono font-medium tracking-tight text-ink', size === 'sm' ? 'text-xl' : 'text-2xl')}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
    </div>
  )
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface DatasetPickerProps {
  datasets: Dataset[]
  value: string
  onChange: (id: string) => void
  loading?: boolean
  label?: string
  className?: string
}

export function DatasetPicker({ datasets, value, onChange, loading, label = 'Dataset', className }: DatasetPickerProps) {
  const empty = !loading && datasets.length === 0
  return (
    <Select
      label={label}
      className={className}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={loading || empty}
      placeholder={loading ? 'Loading datasets…' : empty ? 'No completed datasets yet' : 'Choose a dataset'}
      hint={empty ? 'Generate a dataset first, then come back here.' : undefined}
      options={datasets.map(d => ({ value: d.id, label: `${d.name} · ${formatNumber(d.record_count)} rows` }))}
    />
  )
}

export function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-[13px]">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="truncate text-right text-ink">{children}</dd>
    </div>
  )
}
