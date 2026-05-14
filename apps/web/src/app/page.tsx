'use client'

import React, { useEffect, useState } from 'react'
import { getDecisions } from '@/lib/api-client'
import type { DecisionLog } from '@finguard/shared'
import { getVerdictBadgeClass, formatTimestamp, truncateId } from '@/lib/utils'

export default function DashboardPage() {
  const [decisions, setDecisions] = useState<DecisionLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDecisions()
        setDecisions(data.decisions)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // KPI Calculations
  const total = decisions.length
  const approved = decisions.filter(d => d.final_status === 'approved').length
  const rejected = decisions.filter(d => d.final_status === 'rejected').length
  const pending = decisions.filter(d => d.final_status === 'escalated' || d.final_status === 'pending_review').length

  const kpis = [
    { label: 'Total Decisions', value: total, color: 'text-primary' },
    { label: 'Approved', value: approved, color: 'text-finguard-green' },
    { label: 'Rejected', value: rejected, color: 'text-finguard-red' },
    { label: 'Pending Review', value: pending, color: 'text-finguard-amber' },
  ]

  if (loading) {
    return <div className="text-muted-foreground font-mono-jetbrains animate-pulse">Loading dashboard...</div>
  }

  return (
    <div className="flex flex-col gap-8">
      {/* KPI Section */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-card border border-border rounded p-6 flex flex-col gap-2 relative overflow-hidden group">
            <h3 className="font-syne text-muted-foreground uppercase text-sm tracking-wider">
              {kpi.label}
            </h3>
            <div className={`font-mono-jetbrains text-4xl font-bold ${kpi.color}`}>
              {kpi.value.toString().padStart(2, '0')}
            </div>
            <div className="absolute -bottom-4 -right-4 text-8xl opacity-5 font-mono-jetbrains pointer-events-none group-hover:scale-110 transition-transform">
              {kpi.value.toString().padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-card border border-border rounded flex flex-col">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-syne font-semibold text-foreground uppercase tracking-wide">
            Recent Decision Feed
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-inter text-sm border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border text-muted-foreground">
                <th className="px-6 py-3 font-syne font-medium uppercase text-xs tracking-wider">ID</th>
                <th className="px-6 py-3 font-syne font-medium uppercase text-xs tracking-wider">Workflow</th>
                <th className="px-6 py-3 font-syne font-medium uppercase text-xs tracking-wider">Verdict</th>
                <th className="px-6 py-3 font-syne font-medium uppercase text-xs tracking-wider">Delta</th>
                <th className="px-6 py-3 font-syne font-medium uppercase text-xs tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {decisions.slice(0, 10).map((log) => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                  <td className="px-6 py-3 font-mono-jetbrains text-xs text-muted-foreground">
                    {truncateId(log.id)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="uppercase text-xs font-semibold bg-finguard-navy-hover px-2 py-1 rounded text-foreground">
                      {log.workflow_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex">
                      <span className={getVerdictBadgeClass(log.final_status)}>
                        {log.final_status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-mono-jetbrains text-sm">
                    {log.confidence_delta !== null ? (
                      `Δ ${(log.confidence_delta).toFixed(2)}`
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-3 font-mono-jetbrains text-xs text-muted-foreground">
                    {formatTimestamp(log.created_at)}
                  </td>
                </tr>
              ))}
              {decisions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground font-inter">
                    No decisions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
