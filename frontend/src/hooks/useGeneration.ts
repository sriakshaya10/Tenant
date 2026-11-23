import { useCallback, useEffect, useRef, useState } from 'react'
import type { GenerationJob, GenerationRequest } from '@/types'
import { generationService } from '@/services/generation.service'
import { apiError } from '@/lib/format'

const POLL_MS = 1500
const FINISHED = ['completed', 'failed', 'cancelled']

/** Starts a generation job and polls it until it finishes. */
export function useGeneration() {
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval>>()

  const stop = () => {
    if (timer.current) clearInterval(timer.current)
    timer.current = undefined
  }

  useEffect(() => stop, [])

  const poll = useCallback((jobId: string) => {
    stop()
    timer.current = setInterval(async () => {
      try {
        const next = await generationService.getJob(jobId)
        setJob(next)
        if (FINISHED.includes(next.status)) stop()
      } catch {
        stop()
        setError('Lost track of the job. Check the datasets page for its status.')
      }
    }, POLL_MS)
  }, [])

  const generate = useCallback(
    async (req: GenerationRequest) => {
      setSubmitting(true)
      setError(null)
      try {
        const result = await generationService.generate(req)
        setJob({
          id: result.job_id,
          dataset_id: result.dataset_id,
          status: 'pending',
          progress: 0,
          user_id: '',
          created_at: new Date().toISOString(),
        })
        poll(result.job_id)
        return result
      } catch (err) {
        setError(apiError(err, 'Generation could not be started.'))
        return null
      } finally {
        setSubmitting(false)
      }
    },
    [poll],
  )

  const reset = useCallback(() => {
    stop()
    setJob(null)
    setError(null)
  }, [])

  return { job, submitting, error, generate, reset }
}
