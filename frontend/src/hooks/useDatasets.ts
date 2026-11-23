import { useCallback, useEffect, useState } from 'react'
import type { Dataset, PaginatedResponse } from '@/types'
import { datasetService } from '@/services/dataset.service'

export function useDatasets(page = 1, limit = 20) {
  const [data, setData] = useState<PaginatedResponse<Dataset> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setData(await datasetService.list(page, limit))
      setError(null)
    } catch {
      setError('Could not load datasets.')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}

/** Datasets that finished generating — the only ones the analysis tools can use. */
export function useCompletedDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    datasetService
      .list(1, 100)
      .then(res => setDatasets(res.items.filter(d => d.status === 'completed')))
      .catch(() => setDatasets([]))
      .finally(() => setLoading(false))
  }, [])

  return { datasets, loading }
}
