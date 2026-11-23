import { ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

const groups: { name: string; endpoints: [Method, string, string][] }[] = [
  {
    name: 'Auth',
    endpoints: [
      ['POST', '/api/auth/register', 'Create an account'],
      ['POST', '/api/auth/login', 'Exchange credentials for a JWT'],
      ['GET', '/api/auth/me', 'Current user'],
      ['PUT', '/api/auth/me', 'Update name or email'],
    ],
  },
  {
    name: 'Generation',
    endpoints: [
      ['POST', '/api/generation/generate', 'Start a generation job'],
      ['GET', '/api/generation/jobs', 'List jobs'],
      ['GET', '/api/generation/jobs/{id}', 'Job status and progress'],
      ['POST', '/api/generation/jobs/{id}/cancel', 'Cancel a running job'],
    ],
  },
  {
    name: 'Datasets',
    endpoints: [
      ['GET', '/api/datasets', 'List datasets (paginated)'],
      ['GET', '/api/datasets/{id}', 'Dataset metadata'],
      ['PUT', '/api/datasets/{id}', 'Rename or describe'],
      ['DELETE', '/api/datasets/{id}', 'Delete dataset and file'],
      ['GET', '/api/datasets/{id}/preview', 'First n rows and column types'],
    ],
  },
  {
    name: 'Exports',
    endpoints: [
      ['GET', '/api/exports/{id}/csv', 'Download as CSV'],
      ['GET', '/api/exports/{id}/xlsx', 'Download as Excel'],
      ['GET', '/api/exports/{id}/json', 'Download as JSON'],
    ],
  },
  {
    name: 'Scenarios',
    endpoints: [
      ['GET', '/api/scenarios', 'Presets and your own'],
      ['POST', '/api/scenarios', 'Create a scenario'],
      ['GET', '/api/scenarios/{id}', 'Scenario detail'],
      ['PUT', '/api/scenarios/{id}', 'Update a scenario'],
      ['DELETE', '/api/scenarios/{id}', 'Delete a custom scenario'],
    ],
  },
  {
    name: 'Analysis',
    endpoints: [
      ['POST', '/api/quality/analyze/{dataset_id}', 'Run a quality check'],
      ['GET', '/api/quality/reports/{dataset_id}', 'Past quality checks'],
      ['POST', '/api/models/train', 'Train a screening model'],
      ['GET', '/api/models/experiments', 'List model runs'],
      ['GET', '/api/models/experiments/{id}', 'Model run detail'],
      ['POST', '/api/fairness/analyze', 'Run a fairness breakdown'],
      ['GET', '/api/fairness/experiments', 'List fairness runs'],
      ['POST', '/api/anomalies/inject', 'Inject anomalies'],
      ['GET', '/api/anomalies/experiments', 'List anomaly runs'],
      ['POST', '/api/drift/simulate', 'Simulate distribution drift'],
      ['GET', '/api/drift/experiments', 'List drift runs'],
    ],
  },
  {
    name: 'Reports and dashboard',
    endpoints: [
      ['POST', '/api/reports/generate/{dataset_id}', 'Write a report'],
      ['GET', '/api/reports/{id}', 'Report by id'],
      ['GET', '/api/reports/dataset/{dataset_id}', 'Reports for a dataset'],
      ['GET', '/api/dashboard/stats', 'Totals for the overview'],
      ['GET', '/api/dashboard/activity', 'Records per day, last 30 days'],
    ],
  },
]

const methodStyle: Record<Method, string> = {
  GET: 'text-brand-700',
  POST: 'text-sky-700',
  PUT: 'text-amber-700',
  DELETE: 'text-red-700',
}

function Path({ path }: { path: string }) {
  return (
    <>
      {path.split(/(\{[^}]+\})/).map((part, i) =>
        part.startsWith('{') ? (
          <span key={i} className="text-ink-faint">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}

export default function ApiDocs() {
  return (
    <>
      <PageHeader
        title="API reference"
        description="Everything the interface does goes through this REST API."
        actions={
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
            Interactive docs <ExternalLink className="size-3.5" />
          </a>
        }
      />

      <Card className="mb-8 p-5">
        <p className="text-sm text-ink-soft">
          Send the token from <code className="font-mono text-[13px] text-ink">/api/auth/login</code> on every request:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-ink px-4 py-3 font-mono text-xs leading-relaxed text-canvas/90">
{`curl http://localhost:8000/api/datasets \\
  -H "Authorization: Bearer <token>"`}
        </pre>
      </Card>

      <div className="space-y-8">
        {groups.map(group => (
          <section key={group.name}>
            <h2 className="mb-2 text-sm font-semibold text-ink">{group.name}</h2>
            <Card className="divide-y divide-line">
              {group.endpoints.map(([method, path, desc]) => (
                <div key={method + path} className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4">
                  <span className={cn('w-14 shrink-0 font-mono text-xs font-medium', methodStyle[method])}>{method}</span>
                  <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-ink">
                    <Path path={path} />
                  </code>
                  <span className="text-[13px] text-ink-muted">{desc}</span>
                </div>
              ))}
            </Card>
          </section>
        ))}
      </div>
    </>
  )
}
