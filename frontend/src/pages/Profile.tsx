import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/auth.service'
import { PageHeader } from '@/components/common'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { apiError, formatDate } from '@/lib/format'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFullName(user?.full_name ?? '')
    setEmail(user?.email ?? '')
  }, [user])

  const dirty = fullName !== (user?.full_name ?? '') || email !== (user?.email ?? '')

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authService.updateMe({ full_name: fullName.trim(), email: email.trim() })
      await refreshUser()
      toast.success('Profile saved')
    } catch (err) {
      toast.error(apiError(err, 'Could not save your profile.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile" />

      <Card className="mb-6 flex items-center gap-4 p-5">
        <Avatar name={user?.full_name || user?.email} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-ink">{user?.full_name || 'Unnamed'}</p>
          <p className="truncate text-[13px] text-ink-muted">{user?.email}</p>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-faint">
            <Badge className="capitalize">{user?.role}</Badge>
            {user?.created_at && <span>Member since {formatDate(user.created_at)}</span>}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Account details" />
        <form onSubmit={save}>
          <CardBody className="space-y-4">
            <Input label="Full name" value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </CardBody>
          <div className="flex justify-end border-t border-line px-5 py-3">
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
