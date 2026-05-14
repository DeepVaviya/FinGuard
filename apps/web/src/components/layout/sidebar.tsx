'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, GitMerge, FileText, UserCheck, Activity, Wand2 } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Workflows', href: '/workflows', icon: GitMerge },
  { name: 'Decision Log', href: '/decisions', icon: FileText },
  { name: 'Human Review', href: '/review', icon: UserCheck },
  { name: 'Workflow Studio', href: '/studio', icon: Wand2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex bg-card border-r border-border w-64 min-h-screen flex-col">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <Activity className="text-primary w-6 h-6" />
        <h1 className="text-xl font-syne font-bold text-foreground">
          FinGuard
        </h1>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(item.href) && item.href !== '/')

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-sm font-inter text-sm transition-colors ${
                isActive
                  ? 'bg-finguard-navy-hover border-l-4 border-l-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-finguard-navy-hover hover:text-foreground border-l-4 border-l-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              {item.name}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-border">
        <div className="bg-background rounded-sm p-3 border border-border">
          <p className="text-xs text-muted-foreground font-mono-jetbrains">ENGINE VERSION</p>
          <p className="text-sm font-mono-jetbrains font-medium text-foreground mt-1">v2.1.0-rc</p>
        </div>
      </div>
    </div>
  )
}
