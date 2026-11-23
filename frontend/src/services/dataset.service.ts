import api from './api'
import type { Dataset, DatasetPreview, PaginatedResponse } from '@/types'

export type ExportFormat = 'csv' | 'xlsx' | 'json'

export const datasetService = {
  async list(page = 1, limit = 20): Promise<PaginatedResponse<Dataset>> {
    const { data } = await api.get('/datasets', { params: { page, limit } })
    return data
  },

  async get(id: string): Promise<Dataset> {
    const { data } = await api.get(`/datasets/${id}`)
    return data
  },

  async update(id: string, update: { name?: string; description?: string }): Promise<Dataset> {
    const { data } = await api.put(`/datasets/${id}`, update)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/datasets/${id}`)
  },

  async preview(id: string, limit?: number): Promise<DatasetPreview> {
    const { data } = await api.get(`/datasets/${id}/preview`, { params: limit ? { limit } : {} })
    return data
  },

  /** Downloads an export through the authenticated client so the token never ends up in a URL. */
  async download(id: string, format: ExportFormat, filename: string): Promise<void> {
    const { data } = await api.get(`/exports/${id}/${format}`, { responseType: 'blob' })
    const url = URL.createObjectURL(data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename.replace(/[^\w\- ]+/g, '').trim() || 'dataset'}.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
