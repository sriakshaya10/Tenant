import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import { useCompletedDatasets } from '@/hooks/useDatasets'
import type { ModelExperiment } from '@/types'
import { DatasetPicker, EmptyState, PageHeader, PageLoader, Stat, StatGrid } from '@/components/common'
import { BarChartView } from '@/components/charts'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { apiError, formatNumber, formatRatio, humanize, safeJson } from '@/lib/format'

const MODELS = [
  { value: 'LogisticRegression', label: 'Logistic regression' },
  { value: 'DecisionTree', label: 'Decision tree' },
  { value: 'RandomForest', label: 'Random forest' },
  { value: 'GradientBoosting', label: 'Gradient boosting' },
]

export default function ScreeningSimulator() {
  const { datasets, loading: listLoading } = useCompletedDatasets()
  const [selectedId, setSelectedId] = useState('')
  const [modelType, setModelType] = useState('RandomForest')
  const [split, setSplit] = useState(0.8)
  const [seed, setSeed] = useState('42')
  const [training, setTraining] = useState(false)
  const [experiment, setExperiment] = useState<ModelExperiment | null>(null)

  const train = async (e: React.FormEvent) => {
    e.preventDefault()
    setTraining(true)
    try {
      const r = await api.post('/models/train', {
        dataset_id: selectedId,
        model_type: modelType,
        train_test_split: split,
        random_seed: Number(seed) || 42,
      })
      setExperiment(r.data)
      toast.success('Model trained')
    } catch (err) {
      toast.error(apiError(err, 'Training failed.'))
    } finally {
      setTraining(false)
    }
  }

  const importance = Object.entries(safeJson<Record<string, number>>(experiment?.feature_importance_json, {}))
    .map(([feature, value]) => ({ feature: humanize(feature), importance: Math.round(value * 1000) / 10 }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 12)
  const results = safeJson<{ train_size?: number; test_size?: number }>(experiment?.results_json, {})
  const modelName = MODELS.find(m => m.value === experiment?.model_type)?.label ?? experiment?.model_type

  return (
    <>
      <PageHeader title="Screening model" description="Train a classifier on synthetic applicants and see how it performs." />

      <Alert variant="warning" className="mb-6">
        Results are simulated for research. Don’t use this model, or anything like it, to screen real tenants.
      </Alert>

      <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader title="Setup" />
          <form onSubmit={train}>
            <CardBody className="space-y-4">
              <DatasetPicker datasets={datasets} loading={listLoading} value={selectedId} onChange={setSelectedId} />
              <Select label="Model" options={MODELS} value={modelType} onChange={e => setModelType(e.target.value)} />
              <Field
                label={
                  <span className="flex justify-between">
                    Train / test split
                    <span className="tabular font-mono text-ink">
                      {Math.round(split * 100)} / {Math.round((1 - split) * 100)}
                    </span>
                  </span>
                }
              >
                <input
                  type="range"
                  min={0.5}
                  max={0.95}
                  step={0.05}
                  value={split}
                  onChange={e => setSplit(Number(e.target.value))}
                  className="slider mt-2"
                />
              </Field>
              <Input label="Random seed" type="number" value={seed} onChange={e => setSeed(e.target.value)} className="font-mono" />
              <Button type="submit" className="w-full" loading={training} disabled={!selectedId}>
                Train model
              </Button>
            </CardBody>
          </form>
        </Card>

        <div className="space-y-6">
          {training ? (
            <Card>
              <PageLoader />
            </Card>
          ) : !experiment ? (
            <Card>
              <EmptyState
                icon={ShieldCheck}
                title="No model yet"
                description="Pick a dataset and train a model. Metrics and feature importance will show up here."
              />
            </Card>
          ) : (
            <>
              <div>
                <p className="mb-2 text-[13px] text-ink-muted">
                  {modelName}
                  {results.train_size != null && (
                    <>
                      {' '}· trained on {formatNumber(results.train_size)}, tested on {formatNumber(results.test_size)}
                    </>
                  )}
                </p>
                <StatGrid className="sm:grid-cols-3 lg:grid-cols-5">
                  <Stat size="sm" label="Accuracy" value={formatRatio(experiment.accuracy)} />
                  <Stat size="sm" label="Precision" value={formatRatio(experiment.precision_score)} />
                  <Stat size="sm" label="Recall" value={formatRatio(experiment.recall_score)} />
                  <Stat size="sm" label="F1" value={formatRatio(experiment.f1_score)} />
                  <Stat size="sm" label="ROC AUC" value={experiment.roc_auc != null ? experiment.roc_auc.toFixed(3) : '—'} className="col-span-2 sm:col-span-1" />
                </StatGrid>
              </div>

              {importance.length > 0 && (
                <Card>
                  <CardHeader title="What drives the model" description="Relative feature importance, top 12." />
                  <div className="px-3 pb-4 pt-4">
                    <BarChartView
                      horizontal
                      data={importance}
                      xKey="feature"
                      series={[{ key: 'importance', label: 'Importance' }]}
                      format={v => `${v}%`}
                      height={Math.max(200, importance.length * 28)}
                    />
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
