'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/workflows/')) {
      const type = pathname.split('/').pop()
      return `Workflow: ${type ? type.charAt(0).toUpperCase() + type.slice(1) : ''}`
    }
    if (pathname.startsWith('/workflows')) return 'Workflows Hub'
    if (pathname.startsWith('/decisions')) return 'Decision Log'
    if (pathname.startsWith('/review')) return 'Human Review Queue'
    return 'FinGuard'
  }

  // System is now fully live and connected to backend
  const isMockMode = false 

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-8">
      <div>
        <h2 className="text-xl font-syne font-semibold text-foreground">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-sm">
          <div className={`w-2 h-2 rounded-full ${isMockMode ? 'bg-finguard-red animate-pulse' : 'bg-finguard-green'}`} />
          <span className="text-xs font-mono-jetbrains text-muted-foreground uppercase tracking-wider">
            {isMockMode ? 'MOCK MODE' : 'SYSTEM LIVE'}
          </span>
        </div>

        <div className="font-mono-jetbrains text-sm text-foreground">
          {time ? time.toLocaleTimeString('en-GB', { hour12: false }) : '00:00:00'}
        </div>
      </div>
    </header>
  )
}
