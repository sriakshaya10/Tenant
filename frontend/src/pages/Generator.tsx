import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useGeneration } from '@/hooks/useGeneration'
import api from '@/services/api'
import type { Scenario } from '@/types'
import { PageHeader, KeyValue, Spinner } from '@/components/common'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button, buttonClass } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { RangeInputs } from '@/components/ui/RangeInputs'
import { Progress } from '@/components/ui/Progress'
import { Alert } from '@/components/ui/Alert'
import { cn } from '@/lib/cn'
import { formatNumber, methodLabel, safeJson } from '@/lib/format'

const SIZES = [100, 500, 1000, 5000, 10000]

const METHODS = [
  { value: 'faker', note: 'Rule-based. Seconds.' },
  { value: 'gaussian_copula', note: 'Learns correlations. Fast.' },
  { value: 'ctgan', note: 'Deep generative. Slowest.' },
]

const EMPLOYMENT = ['full-time', 'part-time', 'self-employed', 'freelance', 'unemployed']

interface ScenarioConfig {
  income_range?: [number, number]
  rent_range?: [number, number]
  credit_range?: [number, number]
  employment_types?: string[]
  missing_value_pct?: number
}

export default function Generator() {
  const [params] = useSearchParams()
  const { job, submitting, error, generate, reset } = useGeneration()
  const [scenarios, setScenarios] = useState<Scenario[]>([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [size, setSize] = useState(1000)
  const [method, setMethod] = useState('faker')
  const [scenarioId, setScenarioId] = useState(params.get('scenario') ?? '')
  const [income, setIncome] = useState<[number, number]>([2000, 12000])
  const [rent, setRent] = useState<[number, number]>([600, 3500])
  const [credit, setCredit] = useState<[number, number]>([580, 820])
  const [employment, setEmployment] = useState<string[]>(['full-time', 'part-time', 'self-employed', 'freelance'])
  const [missingPct, setMissingPct] = useState(0.05)
  const [seed, setSeed] = useState('')

  useEffect(() => {
    api
      .get('/scenarios')
      .then(r => setScenarios(r.data.items ?? []))
      .catch(() => setScenarios([]))
    api
      .get('/settings')
      .then(r => {
        if (r.data.default_generation_method) setMethod(r.data.default_generation_method)
        if (r.data.default_record_count) setSize(r.data.default_record_count)
      })
      .catch(() => undefined)
  }, [])

  // Picking a scenario fills the form with its ranges; they can still be adjusted afterwards.
  const scenario = useMemo(() => scenarios.find(s => s.id === scenarioId), [scenarios, scenarioId])
  useEffect(() => {
    if (!scenario) return
    const cfg = safeJson<ScenarioConfig>(scenario.config_json, {})
    if (cfg.income_range) setIncome(cfg.income_range)
    if (cfg.rent_range) setRent(cfg.rent_range)
    if (cfg.credit_range) setCredit(cfg.credit_range)
    if (cfg.employment_types?.length) setEmployment(cfg.employment_types)
    if (cfg.missing_value_pct != null) setMissingPct(cfg.missing_value_pct)
    setName(prev => prev || scenario.name)
  }, [scenario])

  const rangesValid = income[0] < income[1] && rent[0] < rent[1] && credit[0] < credit[1]
  const sizeValid = size >= 1 && size <= 50000
  const running = job && ['pending', 'running'].includes(job.status)
  const busy = submitting || !!running

  const toggleEmployment = (type: string) =>
    setEmployment(prev => (prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Give the dataset a name.')
    if (!employment.length) return toast.error('Pick at least one employment type.')
    if (!rangesValid || !sizeValid) return toast.error('Fix the highlighted fields first.')

    await generate({
      name: name.trim(),
      description: description.trim() || undefined,
      record_count: size,
      generation_method: method,
      scenario_id: scenarioId || undefined,
      seed: seed ? Number(seed) : undefined,
      income_min: income[0],
      income_max: income[1],
      rent_min: rent[0],
      rent_max: rent[1],
      credit_min: credit[0],
      credit_max: credit[1],
      employment_types: employment,
      missing_value_pct: missingPct,
    })
  }

  useEffect(() => {
    if (job?.status === 'completed') toast.success('Dataset ready')
    if (job?.status === 'failed') toast.error('Generation failed')
  }, [job?.status])

  return (
    <>
      <PageHeader
        title="Generate a dataset"
        description="Describe the applicant population you want. Every record produced is fictional."
      />

      <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Basics" />
            <CardBody className="space-y-4">
              <Input
                label="Name"
                placeholder="e.g. Austin market, Q3 baseline"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <Textarea
                label="Notes"
                hint="Optional. Useful when you come back to this in a month."
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <Select
                label="Scenario"
                placeholder="None — set ranges manually"
                hint={scenario?.description}
                value={scenarioId}
                onChange={e => setScenarioId(e.target.value)}
                options={scenarios.map(s => ({ value: s.id, label: s.name }))}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Engine and size" />
            <CardBody className="space-y-5">
              <Field label="Generation engine">
                <div className="grid gap-2 sm:grid-cols-3">
                  {METHODS.map(m => (
                    <label
                      key={m.value}
                      className={cn(
                        'cursor-pointer rounded-md border px-3 py-2.5 transition-colors',
                        method === m.value ? 'border-ink bg-canvas' : 'border-line-strong hover:border-ink-faint',
                      )}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={m.value}
                        checked={method === m.value}
                        onChange={() => setMethod(m.value)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-medium text-ink">{methodLabel(m.value)}</span>
                      <span className="mt-0.5 block text-xs text-ink-muted">{m.note}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Number of records" error={sizeValid ? undefined : 'Choose between 1 and 50,000.'}>
                <div className="flex flex-wrap items-center gap-2">
                  {SIZES.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSize(n)}
                      className={cn(
                        'tabular h-9 rounded-md border px-3 font-mono text-[13px] transition-colors',
                        size === n ? 'border-ink bg-ink text-canvas' : 'border-line-strong bg-white text-ink-soft hover:border-ink-faint',
                      )}
                    >
                      {formatNumber(n)}
                    </button>
                  ))}
                  <input
                    type="number"
                    aria-label="Custom record count"
                    min={1}
                    max={50000}
                    value={size}
                    onChange={e => setSize(Number(e.target.value))}
                    className="tabular h-9 w-28 rounded-md border border-line-strong bg-white px-3 font-mono text-[13px] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Applicant profile" description="Bounds the generator samples within." />
            <CardBody className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <RangeInputs
                  label="Monthly income"
                  prefix="$"
                  step={100}
                  bounds={[0, 100000]}
                  min={income[0]}
                  max={income[1]}
                  onChange={(a, b) => setIncome([a, b])}
                />
                <RangeInputs
                  label="Monthly rent"
                  prefix="$"
                  step={50}
                  bounds={[0, 50000]}
                  min={rent[0]}
                  max={rent[1]}
                  onChange={(a, b) => setRent([a, b])}
                />
                <RangeInputs
                  label="Credit score"
                  bounds={[300, 850]}
                  min={credit[0]}
                  max={credit[1]}
                  onChange={(a, b) => setCredit([a, b])}
                />
              </div>

              <Field label="Employment types">
                <div className="flex flex-wrap gap-2">
                  {EMPLOYMENT.map(type => {
                    const on = employment.includes(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleEmployment(type)}
                        className={cn(
                          'h-8 rounded-full border px-3 text-[13px] capitalize transition-colors',
                          on ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-line-strong text-ink-muted hover:text-ink',
                        )}
                      >
                        {type.replace('-', ' ')}
                      </button>
                    )
                  })}
                </div>
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Realism" />
            <CardBody className="grid gap-5 md:grid-cols-2">
              <Field
                label={
                  <span className="flex justify-between">
                    Missing values
                    <span className="tabular font-mono text-ink">{Math.round(missingPct * 100)}%</span>
                  </span>
                }
                hint="Share of optional fields left blank, like real forms."
              >
                <input
                  type="range"
                  min={0}
                  max={0.3}
                  step={0.01}
                  value={missingPct}
                  onChange={e => setMissingPct(Number(e.target.value))}
                  className="slider mt-2"
                />
              </Field>
              <Input
                label="Random seed"
                type="number"
                placeholder="Random"
                hint="Set one to reproduce the exact same dataset."
                value={seed}
                onChange={e => setSeed(e.target.value)}
                className="font-mono"
              />
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <Card>
            <CardHeader title="Summary" />
            <CardBody className="pt-2">
              <dl className="divide-y divide-line">
                <KeyValue label="Records">
                  <span className="tabular font-mono">{formatNumber(size)}</span>
                </KeyValue>
                <KeyValue label="Engine">{methodLabel(method)}</KeyValue>
                <KeyValue label="Scenario">{scenario?.name ?? 'Custom'}</KeyValue>
                <KeyValue label="Income">
                  <span className="tabular font-mono">
                    ${formatNumber(income[0])}–{formatNumber(income[1])}
                  </span>
                </KeyValue>
                <KeyValue label="Credit">
                  <span className="tabular font-mono">
                    {credit[0]}–{credit[1]}
                  </span>
                </KeyValue>
              </dl>
              <Button type="submit" size="lg" className="mt-4 w-full" loading={busy} disabled={!rangesValid || !sizeValid}>
                {busy ? 'Generating…' : 'Generate'}
              </Button>
            </CardBody>
          </Card>

          {error && <Alert variant="danger">{error}</Alert>}

          {job && (
            <Card>
              <CardBody>
                {running && (
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
                      <Spinner className="size-4 text-brand-600" />
                      {job.status === 'pending' ? 'Starting up…' : 'Generating records…'}
                      <span className="tabular ml-auto font-mono text-ink-muted">{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} label="Generation progress" />
                  </div>
                )}

                {job.status === 'completed' && (
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                      <CheckCircle2 className="size-4" /> Dataset ready
                    </p>
                    <p className="mt-1 text-[13px] text-ink-muted">
                      {formatNumber(size)} records saved as “{name}”.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Link to={`/datasets/${job.dataset_id}`} className={buttonClass('primary', 'sm')}>
                        Open dataset
                      </Link>
                      <Button variant="secondary" size="sm" onClick={reset}>
                        New run
                      </Button>
                    </div>
                  </div>
                )}

                {(job.status === 'failed' || job.status === 'cancelled') && (
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-red-700">
                      <XCircle className="size-4" /> {job.status === 'failed' ? 'Generation failed' : 'Cancelled'}
                    </p>
                    {job.error_message && (
                      <p className="mt-2 break-words rounded bg-red-50 p-2 font-mono text-xs text-red-800">{job.error_message}</p>
                    )}
                    <Button variant="secondary" size="sm" className="mt-4" onClick={reset}>
                      Try again
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </aside>
      </form>
    </>
  )
}
