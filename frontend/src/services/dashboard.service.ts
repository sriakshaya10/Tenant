import api from './api'
import type { DashboardStats } from '@/types'

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get('/dashboard/stats')
    return data
  },

  async getActivity(): Promise<{ activity: Array<{ date: string; count: number; records: number }> }> {
    const { data } = await api.get('/dashboard/activity')
    return data
  }
}
