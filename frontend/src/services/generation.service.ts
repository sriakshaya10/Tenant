import api from './api'
import type { GenerationJob, GenerationRequest } from '@/types'

export const generationService = {
  async generate(req: GenerationRequest): Promise<{ job_id: string; dataset_id: string; status: string }> {
    const { data } = await api.post('/generation/generate', req)
    return data
  },

  async getJob(jobId: string): Promise<GenerationJob> {
    const { data } = await api.get(`/generation/jobs/${jobId}`)
    return data
  },

  async listJobs(): Promise<{ items: GenerationJob[] }> {
    const { data } = await api.get('/generation/jobs')
    return data
  },

  async cancelJob(jobId: string): Promise<void> {
    await api.post(`/generation/jobs/${jobId}/cancel`)
  }
}
