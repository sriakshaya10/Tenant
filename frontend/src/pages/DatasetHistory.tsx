import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Database, Plus, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDatasets } from '@/hooks/useDatasets'
import { datasetService } from '@/services/dataset.service'
import type { Dataset } from '@/types'
import { EmptyState, PageHeader, PageLoader } from '@/components/common'
import { Card } from '@/components/ui/Card'
import { Button, buttonClass } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Alert } from '@/components/ui/Alert'
import { controlClass } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import { formatDate, formatNumber, formatScore, methodLabel } from '@/lib/format'

const LIMIT = 20

export default function DatasetHistory() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState<Dataset | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { data, loading, error, refetch } = useDatasets(page, LIMIT)
  const navigate = useNavigate()

  const items = data?.items ?? []
  const q = search.trim().toLowerCase()
  const filtered = q
    ? items.filter(d => d.name.toLowerCase().includes(q) || methodLabel(d.generation_method).toLowerCase().includes(q))
    : items
  const pages = data?.pages ?? 1

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await datasetService.delete(toDelete.id)
      toast.success('Dataset deleted')
      setToDelete(null)
      refetch()
    } catch {
      toast.error('Could not delete the dataset.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Datasets"
        description={data ? `${formatNumber(data.total)} generated so far.` : 'Everything you’ve generated.'}
        actions={
          <Link to="/generate" className={buttonClass('primary')}>
            <Plus /> New dataset
          </Link>
        }
      />

      {error && (
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      )}

      {loading && !data ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Database}
            title="No datasets yet"
            description="Generate one and it will appear here."
            action={
              <Link to="/generate" className={buttonClass('secondary', 'sm')}>
                Generate a dataset
              </Link>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <input
                className={cn(controlClass, 'h-8 pl-9')}
                placeholder="Filter by name or engine"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHead>
              <TableRow className="hover:bg-transparent">
                <TableHeader>Name</TableHeader>
                <TableHeader className="text-right">Rows</TableHeader>
                <TableHeader>Engine</TableHeader>
                <TableHeader className="text-right">Quality</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(`/datasets/${d.id}`)}>
                  <TableCell className="max-w-[280px] truncate font-medium text-ink">{d.name}</TableCell>
                  <TableCell className="tabular text-right font-mono text-xs">{formatNumber(d.record_count)}</TableCell>
                  <TableCell>{methodLabel(d.generation_method)}</TableCell>
                  <TableCell className="tabular text-right font-mono text-xs">{formatScore(d.quality_score)}</TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                  <TableCell className="text-ink-muted">{formatDate(d.created_at)}</TableCell>
                  <TableCell className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${d.name}`}
                      onClick={e => {
                        e.stopPropagation()
                        setToDelete(d)
                      }}
                      className="px-2 text-ink-faint hover:text-red-700"
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filtered.length === 0 && <EmptyState title="Nothing on this page matches" />}

          {pages > 1 && (
            <div className="flex items-center justify-end gap-1 border-t border-line px-4 py-2.5 text-xs text-ink-muted">
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
          )}
        </Card>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete dataset?"
        message={`“${toDelete?.name}” and its file will be permanently removed. This can’t be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
