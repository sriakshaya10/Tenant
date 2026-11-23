import { useState } from 'react'
import { Scale } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import { useCompletedDatasets } from '@/hooks/useDatasets'
import { DatasetPicker, EmptyState, PageHeader, PageLoader } from '@/components/common'
import { BarChartView, ChartLegend, type Series } from '@/components/charts'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { apiError, formatNumber, formatRatio, safeJson } from '@/lib/format'

interface GroupStats {
  count: number
  selection_rate: number
  accuracy: number
  fpr: number
  fnr: number
}

const GROUP_COLUMNS = [
  { value: 'household_size', label: 'Household size' },
  { value: 'employment_type', label: 'Employment type' },
  { value: 'rental_experience_years', label: 'Rental experience (years)' },
]

const SERIES: Series[] = [
  { key: 'selection_rate', label: 'Selection rate' },
  { key: 'accuracy', label: 'Accuracy' },
]

export default function FairnessAnalysis() {
  const { datasets, loading: listLoading } = useCompletedDatasets()
  const [selectedId, setSelectedId] = useState('')
  const [experimentName, setExperimentName] = useState('')
  const [groupColumn, setGroupColumn] = useState('household_size')
  const [running, setRunning] = useState(false)
  const [groups, setGroups] = useState<[string, GroupStats][] | null>(null)

  const run = async (e: React.FormEvent) => {
    e.preventDefault()
    setRunning(true)
    try {
      const label = GROUP_COLUMNS.find(g => g.value === groupColumn)?.label ?? groupColumn
      const r = await api.post('/fairness/analyze', {
        dataset_id: selectedId,
        experiment_name: experimentName.trim() || `${label} breakdown`,
        group_column: groupColumn,
      })
      const parsed = safeJson<{ groups?: Record<string, GroupStats> }>(r.data.results_json, {})
      setGroups(Object.entries(parsed.groups ?? {}))
      toast.success('Analysis finished')
    } catch (err) {
      toast.error(apiError(err, 'The analysis failed.'))
    } finally {
      setRunning(false)
    }
  }

  const rates = groups?.map(([, s]) => s.selection_rate) ?? []
  const maxRate = Math.max(...rates, 0)
  const minRate = Math.min(...rates, 1)
  // Four-fifths rule: the lowest group's selection rate should be at least 80% of the highest.
  const impactRatio = maxRate > 0 ? minRate / maxRate : null
  const chartData = groups?.map(([group, s]) => ({
    group,
    selection_rate: Math.round(s.selection_rate * 1000) / 10,
    accuracy: Math.round(s.accuracy * 1000) / 10,
  }))

  return (
    <>
      <PageHeader
        title="Fairness"
        description="Train a model, then compare its outcomes across groups of applicants."
      />

      <Alert variant="info" className="mb-6">
        Groups are built from proxy attributes such as household size or employment type. Protected characteristics are
        never generated or used.
      </Alert>

      <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader title="Setup" />
          <form onSubmit={run}>
            <CardBody className="space-y-4">
              <DatasetPicker datasets={datasets} loading={listLoading} value={selectedId} onChange={setSelectedId} />
              <Select label="Compare by" options={GROUP_COLUMNS} value={groupColumn} onChange={e => setGroupColumn(e.target.value)} />
              <Input
                label="Name"
                placeholder="Optional"
                hint="Helps you find this run later."
                value={experimentName}
                onChange={e => setExperimentName(e.target.value)}
              />
              <Button type="submit" className="w-full" loading={running} disabled={!selectedId}>
                Run analysis
              </Button>
            </CardBody>
          </form>
        </Card>

        <div className="space-y-6">
          {running ? (
            <Card>
              <PageLoader />
            </Card>
          ) : !groups ? (
            <Card>
              <EmptyState icon={Scale} title="No results yet" description="Choose a dataset and a grouping, then run the analysis." />
            </Card>
          ) : groups.length === 0 ? (
            <Card>
              <EmptyState title="No groups found" description="That column didn’t produce any groups for this dataset." />
            </Card>
          ) : (
            <>
              {impactRatio != null && (
                <Alert
                  variant={impactRatio >= 0.8 ? 'success' : 'warning'}
                  title={`Disparate impact ratio: ${impactRatio.toFixed(2)}`}
                >
                  {impactRatio >= 0.8
                    ? 'The lowest selection rate is within four-fifths of the highest. No strong disparity by this measure.'
                    : 'The lowest selection rate is below four-fifths of the highest. Worth a closer look.'}
                </Alert>
              )}

              <Card>
                <CardHeader title="Selection rate and accuracy" actions={<ChartLegend series={SERIES} />} />
                <div className="px-3 pb-4 pt-5">
                  <BarChartView data={chartData ?? []} xKey="group" series={SERIES} format={v => `${v}%`} domain={[0, 100]} />
                </div>
              </Card>

              <Card className="overflow-hidden">
                <Table>
                  <TableHead>
                    <TableRow className="hover:bg-transparent">
                      <TableHeader>Group</TableHeader>
                      <TableHeader className="text-right">Applicants</TableHeader>
                      <TableHeader className="text-right">Selected</TableHeader>
                      <TableHeader className="text-right">Accuracy</TableHeader>
                      <TableHeader className="text-right">False positive</TableHeader>
                      <TableHeader className="text-right">False negative</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groups.map(([name, s]) => (
                      <TableRow key={name}>
                        <TableCell className="font-medium text-ink">{name}</TableCell>
                        {[formatNumber(s.count), formatRatio(s.selection_rate), formatRatio(s.accuracy), formatRatio(s.fpr), formatRatio(s.fnr)].map((v, i) => (
                          <TableCell key={i} className="tabular text-right font-mono text-xs">
                            {v}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  )
}
