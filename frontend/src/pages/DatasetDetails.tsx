import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, Download, FileText, FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'
import { datasetService, type ExportFormat } from '@/services/dataset.service'
import type { Dataset, DatasetPreview } from '@/types'
import { EmptyState, KeyValue, PageHeader, PageLoader, Stat, StatGrid } from '@/components/common'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button, buttonClass } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { formatDate, formatNumber, formatScore, humanize, methodLabel } from '@/lib/format'

const PREVIEW_ROWS = 15

export default function DatasetDetails() {
  const { id } = useParams<{ id: string }>()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [preview, setPreview] = useState<DatasetPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<ExportFormat | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      datasetService.get(id).then(setDataset).catch(() => setDataset(null)),
      datasetService.preview(id, PREVIEW_ROWS).then(setPreview).catch(() => setPreview(null)),
    ]).finally(() => setLoading(false))
  }, [id])

  const download = async (format: ExportFormat) => {
    if (!dataset) return
    setDownloading(format)
    try {
      await datasetService.download(dataset.id, format, dataset.name)
    } catch {
      toast.error('Download failed.')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <PageLoader />
  if (!dataset)
    return (
      <Card>
        <EmptyState
          title="Dataset not found"
          description="It may have been deleted."
          action={
            <Link to="/history" className={buttonClass('secondary', 'sm')}>
              Back to datasets
            </Link>
          }
        />
      </Card>
    )

  const ready = dataset.status === 'completed'

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/history" className="inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink">
            <ArrowLeft className="size-3.5" /> Datasets
          </Link>
        }
        title={dataset.name}
        description={dataset.description}
        actions={
          ready && (
            <>
              {(['csv', 'xlsx', 'json'] as ExportFormat[]).map(f => (
                <Button key={f} variant={f === 'csv' ? 'primary' : 'secondary'} size="sm" loading={downloading === f} onClick={() => download(f)}>
                  {f === 'csv' && <Download />}
                  {f.toUpperCase()}
                </Button>
              ))}
            </>
          )
        }
      />

      <StatGrid className="lg:grid-cols-4">
        <Stat label="Rows" value={formatNumber(dataset.record_count)} />
        <Stat label="Columns" value={preview ? preview.columns.length : '—'} />
        <Stat label="Quality" value={formatScore(dataset.quality_score)} hint={dataset.quality_score == null ? 'Not checked' : 'out of 100'} />
        <div className="flex flex-col justify-center bg-white px-5 py-4">
          <p className="text-[13px] text-ink-muted">Status</p>
          <div className="mt-2">
            <StatusBadge status={dataset.status} />
          </div>
        </div>
      </StatGrid>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader
            title="Preview"
            description={preview ? `First ${Math.min(PREVIEW_ROWS, preview.rows.length)} of ${formatNumber(preview.total_rows)} rows` : undefined}
            actions={
              ready && (
                <Link to={`/laboratory?dataset=${dataset.id}`} className="text-[13px] text-ink-muted hover:text-ink">
                  Open in explorer →
                </Link>
              )
            }
          />
          {preview ? (
            <Table>
              <TableHead>
                <TableRow className="hover:bg-transparent">
                  {preview.columns.map(c => (
                    <TableHeader key={c}>{humanize(c)}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {preview.rows.map((row, i) => (
                  <TableRow key={i}>
                    {preview.columns.map(c => (
                      <TableCell key={c} className="text-xs">
                        {row[c] === null || row[c] === '' || row[c] === undefined ? <span className="text-ink-faint">—</span> : String(row[c])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title={ready ? 'Preview unavailable' : 'Preview appears once generation finishes'} />
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Details" />
            <CardBody className="py-2">
              <dl className="divide-y divide-line">
                <KeyValue label="Engine">{methodLabel(dataset.generation_method)}</KeyValue>
                <KeyValue label="Seed">
                  <span className="font-mono">{dataset.seed ?? 'Random'}</span>
                </KeyValue>
                <KeyValue label="Version">{dataset.version}</KeyValue>
                <KeyValue label="Created">{formatDate(dataset.created_at)}</KeyValue>
              </dl>
            </CardBody>
          </Card>

          {ready && (
            <Card>
              <CardHeader title="Analyse" />
              <div className="divide-y divide-line">
                {[
                  { to: '/quality', icon: BarChart3, label: 'Check quality' },
                  { to: `/laboratory?dataset=${dataset.id}`, icon: FlaskConical, label: 'Explore rows' },
                  { to: '/reports', icon: FileText, label: 'Write a report' },
                ].map(({ to, icon: Icon, label }) => (
                  <Link key={label} to={to} className="flex items-center gap-2.5 px-5 py-2.5 text-[13px] text-ink-soft hover:bg-canvas/70 hover:text-ink">
                    <Icon className="size-4 text-ink-muted" strokeWidth={1.75} />
                    {label}
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
