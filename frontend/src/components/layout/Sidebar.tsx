import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Database,
  FileText,
  FlaskConical,
  Gauge,
  Layers,
  LogOut,
  Plus,
  Scale,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'
import { Logo } from './Logo'

const sections = [
  {
    title: 'Data',
    items: [
      { to: '/dashboard', icon: Gauge, label: 'Overview' },
      { to: '/generate', icon: Plus, label: 'Generate' },
      { to: '/scenarios', icon: Layers, label: 'Scenarios' },
      { to: '/history', icon: Database, label: 'Datasets' },
    ],
  },
  {
    title: 'Analysis',
    items: [
      { to: '/laboratory', icon: FlaskConical, label: 'Explore' },
      { to: '/quality', icon: BarChart3, label: 'Quality' },
      { to: '/screening', icon: ShieldCheck, label: 'Screening model' },
      { to: '/fairness', icon: Scale, label: 'Fairness' },
      { to: '/reports', icon: FileText, label: 'Reports' },
    ],
  },
]

function Item({ to, icon: Icon, label, onNavigate }: { to: string; icon: React.ElementType; label: string; onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
          isActive ? 'bg-white font-medium text-ink shadow-[0_0_0_1px_#ebe1dd]' : 'text-ink-soft hover:bg-ink/[0.04] hover:text-ink',
        )
      }
    >
      <Icon className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
      {label}
    </NavLink>
  )
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Account'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-5">
        <Logo to="/dashboard" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {sections.map(section => (
          <div key={section.title}>
            <p className="eyebrow mb-1.5 px-2.5">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <Item key={item.to} {...item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-line px-3 py-3">
        <Item to="/api-docs" icon={BookOpen} label="API reference" onNavigate={onNavigate} />
        <Item to="/settings" icon={Settings} label="Settings" onNavigate={onNavigate} />
      </div>

      <div className="flex items-center gap-2.5 border-t border-line px-4 py-3">
        <NavLink to="/profile" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md">
          <Avatar name={user?.full_name || user?.email} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink">{displayName}</p>
            <p className="truncate text-xs text-ink-muted">{user?.email}</p>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
