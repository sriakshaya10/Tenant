import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, FlaskConical, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCompletedDatasets } from '@/hooks/useDatasets'
import { datasetService } from '@/services/dataset.service'
import type { DatasetPreview } from '@/types'
import { DatasetPicker, EmptyState, PageHeader, PageLoader } from '@/components/common'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { controlClass } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { formatNumber, humanize } from '@/lib/format'

const PAGE_SIZE = 25

function isNumeric(dtype: string) {
  return /int|float|double|number/i.test(dtype)
}

function summarize(preview: DatasetPreview) {
  return preview.columns.map(col => {
    const values = preview.rows.map(r => r[col])
    const present = values.filter(v => v !== null && v !== undefined && v !== '')
    const missing = values.length - present.length
    if (isNumeric(preview.dtypes[col])) {
      const nums = present.map(Number).filter(n => !Number.isNaN(n))
      const mean = nums.reduce((a, b) => a + b, 0) / (nums.length || 1)
      return {
        col,
        type: preview.dtypes[col],
        missing,
        detail: nums.length ? `${Math.min(...nums).toLocaleString()} – ${Math.max(...nums).toLocaleString()}` : '—',
        extra: nums.length ? `mean ${mean.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : '',
      }
    }
    const unique = new Set(present.map(String)).size
    return { col, type: preview.dtypes[col], missing, detail: `${unique} distinct`, extra: String(present[0] ?? '') }
  })
}

export default function DataLaboratory() {
  const [params, setParams] = useSearchParams()
  const { datasets, loading: listLoading } = useCompletedDatasets()
  const selectedId = params.get('dataset') ?? ''
  const [limit, setLimit] = useState(1000)
  const [preview, setPreview] = useState<DatasetPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState(false)

  const selected = datasets.find(d => d.id === selectedId)

  useEffect(() => {
    if (!selectedId) return setPreview(null)
    setLoading(true)
    setPage(1)
    datasetService
      .preview(selectedId, limit)
      .then(setPreview)
      .catch(() => toast.error('Could not load that dataset.'))
      .finally(() => setLoading(false))
  }, [selectedId, limit])

  const filtered = useMemo(() => {
    if (!preview) return []
    const q = search.trim().toLowerCase()
    if (!q) return preview.rows
    return preview.rows.filter(row => Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q)))
  }, [preview, search])

  const columns = useMemo(() => (preview ? summarize(preview) : []), [preview])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const download = async () => {
    if (!selected) return
    setDownloading(true)
    try {
      await datasetService.download(selected.id, 'csv', selected.name)
    } catch {
      toast.error('Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <PageHeader title="Explore" description="Browse the rows and columns of a generated dataset." />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <DatasetPicker
          className="w-full sm:w-80"
          datasets={datasets}
          loading={listLoading}
          value={selectedId}
          onChange={id => setParams(id ? { dataset: id } : {})}
        />
        {selected && (
          <Button variant="secondary" onClick={download} loading={downloading}>
            <Download /> Full CSV
          </Button>
        )}
      </div>

      {!selectedId ? (
        <Card>
          <EmptyState icon={FlaskConical} title="Choose a dataset to start" description="Only datasets that finished generating are listed." />
        </Card>
      ) : loading || !preview ? (
        <PageLoader />
      ) : (
        <Tabs
          tabs={[
            {
              id: 'rows',
              label: 'Rows',
              content: (
                <Card className="overflow-hidden">
                  <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
                    <div className="relative min-w-[200px] flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                      <input
                        className={cn(controlClass, 'h-8 pl-9')}
                        placeholder="Filter rows"
                        value={search}
                        onChange={e => {
                          setSearch(e.target.value)
                          setPage(1)
                        }}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-ink-muted">
                      Load
                      <select
                        value={limit}
                        onChange={e => setLimit(Number(e.target.value))}
                        className="h-8 rounded-md border border-line-strong bg-white px-2 text-xs text-ink"
                      >
                        {[100, 500, 1000, 5000].map(n => (
                          <option key={n} value={n}>
                            {formatNumber(n)} rows
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <Table>
                    <TableHead>
                      <TableRow className="hover:bg-transparent">
                        <TableHeader className="w-12 text-right">#</TableHeader>
                        {preview.columns.map(c => (
                          <TableHeader key={c} className={cn(isNumeric(preview.dtypes[c]) && 'text-right')}>
                            {humanize(c)}
                          </TableHeader>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visible.map((row, i) => (
                        <TableRow key={(page - 1) * PAGE_SIZE + i}>
                          <TableCell className="tabular text-right font-mono text-xs text-ink-faint">
                            {(page - 1) * PAGE_SIZE + i + 1}
                          </TableCell>
                          {preview.columns.map(c => {
                            const v = row[c]
                            const empty = v === null || v === undefined || v === ''
                            return (
                              <TableCell
                                key={c}
                                className={cn(isNumeric(preview.dtypes[c]) && 'tabular text-right font-mono text-xs', empty && 'text-ink-faint')}
                              >
                                {empty ? '—' : String(v)}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {visible.length === 0 && <EmptyState title="No rows match that filter" />}

                  <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-ink-muted">
                    <span>
                      {formatNumber(filtered.length)} of {formatNumber(preview.preview_count ?? preview.rows.length)} loaded ·{' '}
                      {formatNumber(preview.total_rows)} in dataset
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">
                        <ChevronLeft />
                      </Button>
                      <span className="tabular px-1 font-mono">
                        {page} / {pages}
                      </span>
                      <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)} aria-label="Next page">
                        <ChevronRight />
                      </Button>
                    </div>
                  </div>
                </Card>
              ),
            },
            {
              id: 'columns',
              label: `Columns (${preview.columns.length})`,
              content: (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHead>
                      <TableRow className="hover:bg-transparent">
                        <TableHeader>Column</TableHeader>
                        <TableHeader>Type</TableHeader>
                        <TableHeader>Range / values</TableHeader>
                        <TableHeader>Detail</TableHeader>
                        <TableHeader className="text-right">Missing</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {columns.map(c => (
                        <TableRow key={c.col}>
                          <TableCell className="font-mono text-xs text-ink">{c.col}</TableCell>
                          <TableCell>
                            <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-2xs text-ink-muted">{c.type}</span>
                          </TableCell>
                          <TableCell className="tabular font-mono text-xs">{c.detail}</TableCell>
                          <TableCell className="max-w-[220px] truncate text-xs text-ink-muted">{c.extra}</TableCell>
                          <TableCell className="tabular text-right font-mono text-xs">
                            {c.missing ? formatNumber(c.missing) : <span className="text-ink-faint">0</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="border-t border-line px-4 py-2.5 text-xs text-ink-muted">
                    Computed from the {formatNumber(preview.rows.length)} loaded rows.
                  </p>
                </Card>
              ),
            },
          ]}
        />
      )}
    </>
  )
}
