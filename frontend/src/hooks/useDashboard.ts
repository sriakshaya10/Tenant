import { useState, useEffect } from 'react'
import type { DashboardStats } from '@/types'
import { dashboardService } from '@/services/dashboard.service'

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<Array<{ date: string; count: number; records: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([dashboardService.getStats(), dashboardService.getActivity()])
      .then(([s, a]) => {
        setStats(s)
        setActivity(a.activity)
      })
      .catch(() => setError('Could not load your stats. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  return { stats, activity, loading, error }
}
