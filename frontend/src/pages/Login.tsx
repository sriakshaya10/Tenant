import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { apiError } from '@/lib/format'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Signed in')
      navigate('/dashboard')
    } catch (err) {
      setError(apiError(err, 'That email and password don’t match.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink-muted">Welcome back. Pick up where you left off.</p>

      {error && (
        <Alert variant="danger" className="mt-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-sm text-ink-muted">
        New here?{' '}
        <Link to="/register" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          Create an account
        </Link>
      </p>
    </div>
  )
}
