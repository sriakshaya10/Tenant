import React, { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Field, controlClass } from './Input'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export function Select({ label, hint, error, options, placeholder, className, id, ...props }: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <Field label={label} hint={hint} error={error} htmlFor={selectId}>
      <div className="relative">
        <select
          id={selectId}
          className={cn(controlClass, 'h-9 cursor-pointer appearance-none pr-9', className)}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
      </div>
    </Field>
  )
}
