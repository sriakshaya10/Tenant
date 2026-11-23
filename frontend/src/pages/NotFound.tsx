import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/ui/Button'
import { Logo } from '@/components/layout/Logo'

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas px-6 py-8">
      <Logo />
      <div className="flex flex-1 flex-col items-start justify-center sm:mx-auto sm:w-full sm:max-w-md">
        <p className="font-mono text-sm text-ink-faint">404</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-ink">This page doesn’t exist.</h1>
        <p className="mt-3 text-sm text-ink-muted">The link may be old, or the address mistyped.</p>
        <Link to="/dashboard" className={buttonClass('primary', 'md', 'mt-8')}>
          Go to overview
        </Link>
      </div>
    </div>
  )
}
