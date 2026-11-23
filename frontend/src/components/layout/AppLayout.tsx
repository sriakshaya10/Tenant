import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'
import { Logo } from './Logo'

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Each page starts at the top, and the mobile drawer closes on navigation.
  useEffect(() => {
    setMenuOpen(false)
    document.getElementById('main')?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-canvas">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-canvas-deep lg:block">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-line bg-canvas-deep shadow-pop">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-5 rounded-md p-1 text-ink-muted hover:bg-ink/5"
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-canvas px-4 lg:hidden">
          <Logo to="/dashboard" />
          <button onClick={() => setMenuOpen(true)} className="rounded-md p-2 text-ink-soft hover:bg-ink/5" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
        </header>

        <main id="main" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
