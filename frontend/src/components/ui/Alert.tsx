import React from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'info' | 'success' | 'warning' | 'danger'

const styles: Record<Variant, { box: string; icon: React.ElementType }> = {
  info: { box: 'border-sky-200 bg-sky-50/60 text-sky-900', icon: Info },
  success: { box: 'border-emerald-200 bg-emerald-50/70 text-emerald-900', icon: CheckCircle2 },
  warning: { box: 'border-amber-200 bg-amber-50/70 text-amber-900', icon: AlertTriangle },
  danger: { box: 'border-red-200 bg-red-50 text-red-800', icon: XCircle },
}

interface AlertProps {
  variant?: Variant
  title?: string
  children?: React.ReactNode
  className?: string
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const { box, icon: Icon } = styles[variant]
  return (
    <div role={variant === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-md border px-4 py-3 text-[13px]', box, className)}>
      <Icon className="mt-0.5 size-4 shrink-0 opacity-80" />
      <div className="min-w-0 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
    </div>
  )
}
