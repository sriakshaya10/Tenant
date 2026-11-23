import { useEffect, useState } from 'react'
import { BarChart3, Play } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import { useCompletedDatasets } from '@/hooks/useDatasets'
import type { QualityReport } from '@/types'
import { DatasetPicker, EmptyState, PageHeader, PageLoader } from '@/components/common'
import { BarChartView } from '@/components/charts'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, type Tone } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { apiError, formatDate, safeJson } from '@/lib/format'

function grade(score: number): { label: string; tone: Tone; color: string } {
  if (score >= 75) return { label: 'Good', tone: 'success', color: '#4f8a6e' }
  if (score >= 50) return { label: 'Fair', tone: 'warning', color: '#c99a4e' }
  return { label: 'Poor', tone: 'danger', color: '#a8473b' }
}

export default function QualityAnalysis() {
  const { datasets, loading: listLoading } = useCompletedDatasets()
  const [selectedId, setSelectedId] = useState('')
  const [report, setReport] = useState<QualityReport | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    setReport(null)
    if (!selectedId) return
    setLoadingReport(true)
    api
      .get(`/quality/reports/${selectedId}`)
      .then(r => setReport(r.data.items?.[0] ?? null))
      .catch(() => setReport(null))
      .finally(() => setLoadingReport(false))
  }, [selectedId])

  const analyze = async () => {
    setAnalyzing(true)
    try {
      const r = await api.post(`/quality/analyze/${selectedId}`)
      setReport(r.data)
      toast.success('Quality check finished')
    } catch (err) {
      toast.error(apiError(err, 'The quality check failed.'))
    } finally {
      setAnalyzing(false)
    }
  }

  const columnScores = safeJson<Record<string, number>>(report?.column_scores_json, {})
  const warnings = safeJson<string[]>(report?.warnings_json, [])
  const chartData = Object.entries(columnScores)
    .map(([column, score]) => ({ column, score: Math.round(score) }))
    .sort((a, b) => a.score - b.score)
  const g = report ? grade(report.overall_score) : null

  return (
    <>
      <PageHeader
        title="Quality"
        description="How closely a dataset matches reference distributions for income, rent, credit and the rest."
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <DatasetPicker className="w-full sm:w-80" datasets={datasets} loading={listLoading} value={selectedId} onChange={setSelectedId} />
        <Button onClick={analyze} loading={analyzing} disabled={!selectedId}>
          <Play /> {report ? 'Run again' : 'Run check'}
        </Button>
      </div>

      {!selectedId ? (
        <Card>
          <EmptyState icon={BarChart3} title="Choose a dataset" description="You’ll get an overall score and a breakdown per column." />
        </Card>
      ) : loadingReport || analyzing ? (
        <PageLoader />
      ) : !report || !g ? (
        <Card>
          <EmptyState title="Not checked yet" description="Run a check to score this dataset. It usually takes a few seconds." />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            <Card className="p-5">
              <p className="text-[13px] text-ink-muted">Overall score</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="tabular font-mono text-5xl font-medium tracking-tight">{report.overall_score.toFixed(1)}</span>
                <span className="text-sm text-ink-faint">/ 100</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full" style={{ width: `${report.overall_score}%`, background: g.color }} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-ink-muted">
                <Badge tone={g.tone} dot>
                  {g.label}
                </Badge>
                <span>Checked {formatDate(report.created_at)}</span>
              </div>
            </Card>

            <Card>
              <CardHeader title="What the score means" />
              <CardBody className="grid gap-4 text-[13px] text-ink-soft sm:grid-cols-3">
                <div>
                  <p className="font-medium text-ink">75 and above</p>
                  <p className="mt-1 text-ink-muted">Distributions line up well. Safe to use for model benchmarking.</p>
                </div>
                <div>
                  <p className="font-medium text-ink">50 – 75</p>
                  <p className="mt-1 text-ink-muted">Usable, but some columns drift. Check the weakest ones below.</p>
                </div>
                <div>
                  <p className="font-medium text-ink">Below 50</p>
                  <p className="mt-1 text-ink-muted">Noticeable mismatch. Try another engine or widen the ranges.</p>
                </div>
              </CardBody>
            </Card>
          </div>

          {warnings.length > 0 && (
            <Alert variant="warning" title={`${warnings.length} thing${warnings.length > 1 ? 's' : ''} to look at`}>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </Alert>
          )}

          {chartData.length > 0 && (
            <Card>
              <CardHeader title="Score by column" description="Weakest first." />
              <div className="px-3 pb-4 pt-4">
                <BarChartView
                  horizontal
                  data={chartData}
                  xKey="column"
                  series={[{ key: 'score', label: 'Score' }]}
                  domain={[0, 100]}
                  height={Math.max(200, chartData.length * 28)}
                  colorFor={row => grade(Number(row.score)).color}
                />
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  )
}
