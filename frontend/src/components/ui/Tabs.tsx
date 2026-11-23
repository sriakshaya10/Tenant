import React, { useState } from 'react'
import { cn } from '@/lib/cn'

interface Tab {
  id: string
  label: React.ReactNode
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
}

export function Tabs({ tabs, defaultTab, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id)
  const current = tabs.find(t => t.id === active)

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-5 overflow-x-auto overflow-y-hidden border-b border-line [scrollbar-width:none]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 pb-2.5 text-sm font-medium transition-colors',
              active === tab.id ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-5">
        {current?.content}
      </div>
    </div>
  )
}
