import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import type { Scenario } from '@/types'
import { EmptyState, PageHeader, PageLoader } from '@/components/common'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button, buttonClass } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RangeInputs } from '@/components/ui/RangeInputs'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { apiError, formatNumber, safeJson } from '@/lib/format'

interface Config {
  income_range?: [number, number]
  rent_range?: [number, number]
  credit_range?: [number, number]
  employment_types?: string[]
}

function ScenarioCard({ scenario, onDelete }: { scenario: Scenario; onDelete: (s: Scenario) => void }) {
  const cfg = safeJson<Config>(scenario.config_json, {})
  const rows: [string, string][] = []
  if (cfg.income_range) rows.push(['Income', `$${formatNumber(cfg.income_range[0])}–${formatNumber(cfg.income_range[1])}`])
  if (cfg.rent_range) rows.push(['Rent', `$${formatNumber(cfg.rent_range[0])}–${formatNumber(cfg.rent_range[1])}`])
  if (cfg.credit_range) rows.push(['Credit', `${cfg.credit_range[0]}–${cfg.credit_range[1]}`])

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{scenario.name}</h3>
        {!scenario.is_preset && <Badge tone="info">Custom</Badge>}
      </div>
      {scenario.description && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{scenario.description}</p>}

      {rows.length > 0 && (
        <dl className="mt-4 space-y-1 border-t border-line pt-3 text-xs">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="tabular font-mono text-ink-soft">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-auto flex items-center gap-2 pt-4">
        <Link to={`/generate?scenario=${scenario.id}`} className={buttonClass('secondary', 'sm')}>
          Use scenario
        </Link>
        {!scenario.is_preset && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(scenario)} aria-label={`Delete ${scenario.name}`} className="ml-auto">
            <Trash2 />
          </Button>
        )}
      </div>
    </Card>
  )
}

export default function ScenarioBuilder() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Scenario | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [income, setIncome] = useState<[number, number]>([2000, 10000])
  const [rent, setRent] = useState<[number, number]>([600, 3000])
  const [credit, setCredit] = useState<[number, number]>([580, 820])

  const load = useCallback(() => {
    setLoading(true)
    api
      .get('/scenarios')
      .then(r => setScenarios(r.data.items ?? []))
      .catch(() => toast.error('Could not load scenarios.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const resetForm = () => {
    setShowForm(false)
    setName('')
    setDescription('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Give the scenario a name.')
    if (income[0] >= income[1] || rent[0] >= rent[1] || credit[0] >= credit[1]) return toast.error('Check the ranges.')
    setSaving(true)
    try {
      await api.post('/scenarios', {
        name: name.trim(),
        description: description.trim(),
        scenario_type: 'custom',
        config_json: JSON.stringify({
          income_range: income,
          rent_range: rent,
          credit_range: credit,
          employment_types: ['full-time', 'part-time', 'self-employed', 'freelance'],
          missing_value_pct: 0.05,
        }),
      })
      toast.success('Scenario saved')
      resetForm()
      load()
    } catch (err) {
      toast.error(apiError(err, 'Could not save the scenario.'))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/scenarios/${toDelete.id}`)
      toast.success('Scenario deleted')
      setToDelete(null)
      load()
    } catch (err) {
      toast.error(apiError(err, 'Could not delete the scenario.'))
    } finally {
      setDeleting(false)
    }
  }

  const presets = scenarios.filter(s => s.is_preset)
  const custom = scenarios.filter(s => !s.is_preset)

  return (
    <>
      <PageHeader
        title="Scenarios"
        description="Reusable applicant profiles. Pick one on the generate page to prefill its ranges."
        actions={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus /> New scenario
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="mb-8">
          <CardHeader title="New scenario" />
          <form onSubmit={handleCreate}>
            <CardBody className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Name" placeholder="e.g. Tech hub, young professionals" value={name} onChange={e => setName(e.target.value)} autoFocus />
                <Input label="Description" placeholder="Who this population represents" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <RangeInputs label="Monthly income" prefix="$" step={100} bounds={[0, 100000]} min={income[0]} max={income[1]} onChange={(a, b) => setIncome([a, b])} />
                <RangeInputs label="Monthly rent" prefix="$" step={50} bounds={[0, 50000]} min={rent[0]} max={rent[1]} onChange={(a, b) => setRent([a, b])} />
                <RangeInputs label="Credit score" bounds={[300, 850]} min={credit[0]} max={credit[1]} onChange={(a, b) => setCredit([a, b])} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={saving}>
                  Save scenario
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardBody>
          </form>
        </Card>
      )}

      {loading ? (
        <PageLoader />
      ) : scenarios.length === 0 ? (
        <Card>
          <EmptyState icon={Layers} title="No scenarios" description="Create one to reuse a set of ranges across datasets." />
        </Card>
      ) : (
        <div className="space-y-10">
          {custom.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">Yours</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {custom.map(s => (
                  <ScenarioCard key={s.id} scenario={s} onDelete={setToDelete} />
                ))}
              </div>
            </section>
          )}
          {presets.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">Presets</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {presets.map(s => (
                  <ScenarioCard key={s.id} scenario={s} onDelete={setToDelete} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete scenario?"
        message={`“${toDelete?.name}” will be removed. Datasets already generated from it are not affected.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
