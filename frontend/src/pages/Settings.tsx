import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import { PageHeader, PageLoader } from '@/components/common'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { apiError } from '@/lib/format'

interface UserSettings {
  theme: string
  notifications_enabled: boolean
  default_generation_method: string
  default_record_count: number
}

const DEFAULTS: UserSettings = {
  theme: 'light',
  notifications_enabled: true,
  default_generation_method: 'faker',
  default_record_count: 1000,
}

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get('/settings')
      .then(r => setSettings({ ...DEFAULTS, ...r.data }))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => setSettings(s => ({ ...s, [key]: value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/settings', settings)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(apiError(err, 'Could not save settings.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" />

      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader title="Notifications" />
          <CardBody>
            <Switch
              label="Job notifications"
              description="Show a message when a generation job finishes or fails."
              checked={settings.notifications_enabled}
              onCheckedChange={v => update('notifications_enabled', v)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Generation defaults" description="Used as starting values on the generate page." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Engine"
              value={settings.default_generation_method}
              onChange={e => update('default_generation_method', e.target.value)}
              options={[
                { value: 'faker', label: 'Faker baseline' },
                { value: 'gaussian_copula', label: 'Gaussian copula' },
                { value: 'ctgan', label: 'CTGAN' },
              ]}
            />
            <Input
              label="Records"
              type="number"
              min={1}
              max={50000}
              value={settings.default_record_count}
              onChange={e => update('default_record_count', Number(e.target.value) || 1000)}
              className="font-mono"
            />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save settings
          </Button>
        </div>
      </form>
    </div>
  )
}
