import { Field, Input } from './Input'

interface RangeProps {
  label: string
  min: number
  max: number
  onChange: (min: number, max: number) => void
  prefix?: string
  bounds: [number, number]
  step?: number
}

export function RangeInputs({ label, min, max, onChange, prefix, bounds, step = 1 }: RangeProps) {
  const invalid = min >= max
  return (
    <Field label={label} error={invalid ? 'Minimum must be lower than maximum.' : undefined}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Input
          aria-label={`${label} minimum`}
          type="number"
          prefix={prefix}
          min={bounds[0]}
          max={bounds[1]}
          step={step}
          value={min}
          onChange={e => onChange(Number(e.target.value), max)}
          className="tabular font-mono"
        />
        <span className="text-ink-faint">–</span>
        <Input
          aria-label={`${label} maximum`}
          type="number"
          prefix={prefix}
          min={bounds[0]}
          max={bounds[1]}
          step={step}
          value={max}
          onChange={e => onChange(min, Number(e.target.value))}
          className="tabular font-mono"
        />
      </div>
    </Field>
  )
}
