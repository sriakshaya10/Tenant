import React, { useId } from 'react'
import { cn } from '@/lib/cn'

export const controlClass =
  'w-full rounded-md border border-line-strong bg-white px-3 text-sm text-ink placeholder:text-ink-faint ' +
  'transition-colors hover:border-ink-faint focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ' +
  'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-muted'

interface FieldProps {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: string
  htmlFor?: string
  className?: string
  children: React.ReactNode
}

export function Field({ label, hint, error, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-soft">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-700">{error}</p>
      ) : (
        hint && <p className="text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: string
  prefix?: string
}

export function Input({ label, hint, error, prefix, className, id, ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-muted">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={cn(controlClass, 'h-9', prefix && 'pl-7', error && 'border-red-400', className)}
          aria-invalid={!!error}
          {...props}
        />
      </div>
    </Field>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: string
}

export function Textarea({ label, hint, error, className, id, ...props }: TextareaProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      <textarea id={inputId} className={cn(controlClass, 'min-h-[80px] resize-y py-2', className)} {...props} />
    </Field>
  )
}
