import { useEffect, useState } from 'react'
import { Copy, Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import { useCompletedDatasets } from '@/hooks/useDatasets'
import type { AIReport } from '@/types'
import { DatasetPicker, EmptyState, PageHeader, Spinner } from '@/components/common'
import { Markdown } from '@/components/common/Markdown'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiError, formatDate } from '@/lib/format'

export default function ReportGenerator() {
  const { datasets, loading: listLoading } = useCompletedDatasets()
  const [selectedId, setSelectedId] = useState('')
  const [reports, setReports] = useState<AIReport[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loadingReports, setLoadingReports] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    setReports([])
    setActiveId(null)
    if (!selectedId) return
    setLoadingReports(true)
    api
      .get(`/reports/dataset/${selectedId}`)
      .then(r => {
        const items: AIReport[] = r.data.items ?? []
        setReports(items)
        setActiveId(items[0]?.id ?? null)
      })
      .catch(() => setReports([]))
      .finally(() => setLoadingReports(false))
  }, [selectedId])

  const generate = async () => {
    setGenerating(true)
    try {
      const r = await api.post(`/reports/generate/${selectedId}`, { report_type: 'comprehensive' })
      setReports(prev => [r.data, ...prev])
      setActiveId(r.data.id)
      toast.success('Report written')
    } catch (err) {
      toast.error(apiError(err, 'The report could not be generated.'))
    } finally {
      setGenerating(false)
    }
  }

  const report = reports.find(r => r.id === activeId) ?? null
  const datasetName = datasets.find(d => d.id === selectedId)?.name ?? 'dataset'

  const download = () => {
    if (!report) return
    const url = URL.createObjectURL(new Blob([report.content], { type: 'text/markdown' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${datasetName} report.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copy = async () => {
    if (!report) return
    await navigator.clipboard.writeText(report.content)
    toast.success('Copied to clipboard')
  }

  return (
    <>
      <PageHeader title="Reports" description="A written summary of a dataset’s quality and characteristics." />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <DatasetPicker className="w-full sm:w-80" datasets={datasets} loading={listLoading} value={selectedId} onChange={setSelectedId} />
        <Button onClick={generate} loading={generating} disabled={!selectedId}>
          <FileText /> {reports.length ? 'Write another' : 'Write report'}
        </Button>
      </div>

      {!selectedId ? (
        <Card>
          <EmptyState icon={FileText} title="Choose a dataset" description="Reports use Gemini or OpenAI when a key is configured, and a template otherwise." />
        </Card>
      ) : loadingReports || generating ? (
        <Card className="flex h-64 flex-col items-center justify-center gap-3">
          <Spinner />
          {generating && <p className="text-xs text-ink-muted">Writing — this can take up to a minute.</p>}
        </Card>
      ) : !report ? (
        <Card>
          <EmptyState title="No reports for this dataset yet" />
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_220px]">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Badge>{report.model_used}</Badge>
                <span>{formatDate(report.created_at)}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={copy}>
                  <Copy /> Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={download}>
                  <Download /> .md
                </Button>
              </div>
            </div>
            <article className="px-6 py-6 sm:px-10 sm:py-8">
              <Markdown source={report.content} />
            </article>
          </Card>

          {reports.length > 1 && (
            <nav>
              <p className="eyebrow mb-2">Earlier reports</p>
              <ul className="space-y-0.5">
                {reports.map(r => (
                  <li key={r.id}>
                    <button
                      onClick={() => setActiveId(r.id)}
                      className={
                        'w-full rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors ' +
                        (r.id === activeId ? 'bg-white font-medium text-ink shadow-[0_0_0_1px_#ebe1dd]' : 'text-ink-muted hover:text-ink')
                      }
                    >
                      {formatDate(r.created_at)} <span className="text-ink-faint">· {r.model_used}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      )}
    </>
  )
}
