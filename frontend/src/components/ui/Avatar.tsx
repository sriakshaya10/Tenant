import { cn } from '@/lib/cn'

interface AvatarProps {
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-14 text-base' }

export function initials(name?: string) {
  if (!name) return '?'
  const base = name.includes('@') ? name.split('@')[0] : name
  return (
    base
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase() || '?'
  )
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-medium text-brand-800',
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  )
}
