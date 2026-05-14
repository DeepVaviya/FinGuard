'use client'

import React, { useEffect, useState } from 'react'
import { getDecisions } from '@/lib/api-client'
import type { DecisionLog, WorkflowType } from '@finguard/shared'
import { getVerdictBadgeClass, formatTimestamp, truncateId } from '@/lib/utils'

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionLog[]>([])
  const [workflowFilter, setWorkflowFilter] = useState<string>('all')
  const [verdictFilter, setVerdictFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      const res = await getDecisions(
        workflowFilter as any,
        verdictFilter as any
      )
      setDecisions(res.decisions)
      setLoading(false)
    }
    fetchLogs()
  }, [workflowFilter, verdictFilter])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-syne font-bold text-foreground">Decision Log</h1>
          <p className="text-muted-foreground font-inter text-sm mt-1">Comprehensive audit trail of all AI consensus runs.</p>
        </div>

        <div className="flex gap-4">
          <select 
            value={workflowFilter} 
            onChange={(e) => setWorkflowFilter(e.target.value)}
            className="bg-card border border-border rounded px-4 py-2 font-syne text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="all">All Workflows</option>
            <option value="loan">Loan</option>
            <option value="fraud">Fraud</option>
            <option value="transaction">Transaction</option>
            <option value="investment">Investment</option>
          </select>
          <select 
            value={verdictFilter} 
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="bg-card border border-border rounded px-4 py-2 font-syne text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="all">All Verdicts</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-inter text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-background/50 border-b border-border text-muted-foreground">
                <th className="px-6 py-4 font-syne font-medium uppercase text-xs tracking-wider">ID</th>
                <th className="px-6 py-4 font-syne font-medium uppercase text-xs tracking-wider">Workflow</th>
                <th className="px-6 py-4 font-syne font-medium uppercase text-xs tracking-wider">Verdict</th>
                <th className="px-6 py-4 font-syne font-medium uppercase text-xs tracking-wider text-right">Delta</th>
                <th className="px-6 py-4 font-syne font-medium uppercase text-xs tracking-wider text-center">Rule Trigger</th>
                <th className="px-6 py-4 font-syne font-medium uppercase text-xs tracking-wider text-center">HITL</th>
                <th className="px-6 py-4 font-syne font-medium uppercase text-xs tracking-wider text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-primary font-mono-jetbrains animate-pulse">
                    Loading records...
                  </td>
                </tr>
              ) : decisions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-inter">
                    No decisions found matching the current filters.
                  </td>
                </tr>
              ) : decisions.map((log) => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4 font-mono-jetbrains text-xs text-muted-foreground">
                    {truncateId(log.id)}
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4 font-mono-jetbrains text-sm text-right">
                    {log.confidence_delta !== null ? (
                      `Δ ${(log.confidence_delta).toFixed(2)}`
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {log.rule_engine_triggered ? (
                      <span className="text-finguard-red font-bold font-mono">Y</span>
                    ) : (
                      <span className="text-muted-foreground font-mono">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {log.hitl_required ? (
                      <span className="text-finguard-amber font-bold font-mono">Y</span>
                    ) : (
                      <span className="text-muted-foreground font-mono">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono-jetbrains text-xs text-muted-foreground text-right whitespace-nowrap">
                    {formatTimestamp(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
