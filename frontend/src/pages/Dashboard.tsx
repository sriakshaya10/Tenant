import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Database, Plus, Scale, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDashboard } from '@/hooks/useDashboard'
import { useDatasets } from '@/hooks/useDatasets'
import { EmptyState, PageHeader, PageLoader, Stat, StatGrid } from '@/components/common'
import { BarChartView } from '@/components/charts'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { formatNumber, formatRelative, formatScore, methodLabel } from '@/lib/format'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const nextSteps = [
  { to: '/quality', icon: BarChart3, title: 'Check quality', body: 'Score a dataset against reference distributions.' },
  { to: '/screening', icon: ShieldCheck, title: 'Train a model', body: 'Fit a screening model and inspect what drives it.' },
  { to: '/fairness', icon: Scale, title: 'Audit fairness', body: 'Compare outcomes across applicant groups.' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { stats, activity, loading, error } = useDashboard()
  const { data: recent, loading: recentLoading } = useDatasets(1, 6)
  const navigate = useNavigate()

  if (loading) return <PageLoader />

  const firstName = user?.full_name?.split(' ')[0]
  const chartData = activity.map(a => ({ ...a, date: a.date.slice(5) }))
  const hasActivity = activity.some(a => a.records > 0)

  return (
    <>
      <PageHeader
        title={firstName ? `${greeting()}, ${firstName}` : greeting()}
        description="Here’s what you’ve generated so far."
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

      <StatGrid className="lg:grid-cols-4">
        <Stat label="Datasets" value={formatNumber(stats?.total_datasets ?? 0)} />
        <Stat label="Records generated" value={formatNumber(stats?.total_records ?? 0)} />
        <Stat
          label="Jobs"
          value={formatNumber(stats?.completed_jobs ?? 0)}
          hint={stats?.failed_jobs ? `${stats.failed_jobs} failed` : 'None failed'}
        />
        <Stat
          label="Average quality"
          value={stats?.avg_quality_score != null ? formatScore(stats.avg_quality_score) : '—'}
          hint={stats?.avg_quality_score != null ? 'out of 100' : 'Run a quality check'}
        />
      </StatGrid>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Records per day" description="Last 30 days" />
          <div className="px-3 pb-4 pt-5">
            {hasActivity ? (
              <BarChartView data={chartData} xKey="date" series={[{ key: 'records', label: 'Records' }]} height={240} />
            ) : (
              <EmptyState title="Nothing generated in the last 30 days" className="h-[240px] py-0" />
            )}
          </div>
        </Card>

        <Card className="flex flex-col lg:col-span-2">
          <CardHeader
            title="Recent datasets"
            actions={
              <Link to="/history" className="inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink">
                All <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {recentLoading ? (
            <PageLoader className="h-40" />
          ) : recent && recent.items.length > 0 ? (
            <ul className="divide-y divide-line">
              {recent.items.map(d => (
                <li key={d.id}>
                  <button
                    onClick={() => navigate(`/datasets/${d.id}`)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-canvas/70"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{d.name}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {formatNumber(d.record_count)} rows · {methodLabel(d.generation_method)} · {formatRelative(d.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={d.status} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Database}
              title="No datasets yet"
              description="Your first one takes about ten seconds."
              action={
                <Link to="/generate" className={buttonClass('secondary', 'sm')}>
                  Generate a dataset
                </Link>
              }
            />
          )}
        </Card>
      </div>

      <h2 className="mb-3 mt-10 text-sm font-semibold text-ink">Next steps</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {nextSteps.map(({ to, icon: Icon, title, body }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-lg border border-line bg-white p-4 transition-colors hover:border-line-strong"
          >
            <div className="flex items-center justify-between">
              <Icon className="size-4 text-brand-600" strokeWidth={1.75} />
              <ArrowRight className="size-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
            </div>
            <p className="mt-3 text-sm font-medium text-ink">{title}</p>
            <p className="mt-0.5 text-[13px] text-ink-muted">{body}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
