import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { apiError } from '@/lib/format'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Use at least 8 characters for your password.')
    if (password !== confirmPassword) return setError('The two passwords don’t match.')

    setLoading(true)
    try {
      await register(email, password, fullName)
      toast.success('Account created')
      navigate('/dashboard')
    } catch (err) {
      setError(apiError(err, 'We couldn’t create your account.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight text-ink">Create an account</h1>
      <p className="mt-2 text-sm text-ink-muted">It takes a few seconds. No real data required — ever.</p>

      {error && (
        <Alert variant="danger" className="mt-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input label="Full name" value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" autoFocus />
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          error={mismatch ? 'Passwords don’t match.' : undefined}
        />
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          Sign in
        </Link>
      </p>
    </div>
  )
}
