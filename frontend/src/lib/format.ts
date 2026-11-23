const METHOD_LABELS: Record<string, string> = {
  faker: 'Faker baseline',
  gaussian_copula: 'Gaussian copula',
  ctgan: 'CTGAN',
}

export function methodLabel(method: string) {
  return METHOD_LABELS[method] ?? method
}

export function formatNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toLocaleString('en-US')
}

/** Formats a 0–1 ratio as a percentage. */
export function formatRatio(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

/** Formats a value that is already on a 0–100 scale. */
export function formatScore(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

function toDate(value: string) {
  // The API returns naive UTC timestamps; treat them as UTC.
  return new Date(/Z|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`)
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const d = toDate(value)
  return Number.isNaN(d.getTime()) ? '—' : dateFormat.format(d)
}

export function formatRelative(value: string | null | undefined) {
  if (!value) return '—'
  const d = toDate(value)
  if (Number.isNaN(d.getTime())) return '—'
  const seconds = Math.round((d.getTime() - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export function humanize(key: string) {
  const text = key.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function apiError(err: unknown, fallback: string) {
  const e = err as { response?: { data?: { detail?: unknown } } }
  const detail = e.response?.data?.detail
  if (typeof detail === 'string') return detail
  // FastAPI validation errors: [{ loc: ['body', 'email'], msg: '...' }, ...]
  if (Array.isArray(detail) && detail[0]?.msg) {
    const { loc, msg } = detail[0] as { loc?: unknown[]; msg: string }
    const field = Array.isArray(loc) ? loc[loc.length - 1] : undefined
    const text = String(msg).replace(/^value error, /i, '')
    return typeof field === 'string' ? `${humanize(field)}: ${text}` : text
  }
  if (!e.response) return 'Could not reach the API. Is the backend running on port 8000?'
  return fallback
}

export function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
