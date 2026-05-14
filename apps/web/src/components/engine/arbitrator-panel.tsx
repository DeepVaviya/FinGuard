import * as React from 'react'
import type { AgentOutput } from '@finguard/shared'
import { cn, getVerdictBadgeClass } from '@/lib/utils'

interface ArbitratorPanelProps {
  output: AgentOutput | null
  reasoning: string | null
  is_escalated: boolean
  escalation_reason: string | null
  delta: number
  className?: string
}

export function ArbitratorPanel({
  output,
  reasoning,
  is_escalated,
  escalation_reason,
  delta,
  className
}: ArbitratorPanelProps) {

  // State 1: Escalated
  if (is_escalated) {
    return (
      <div className={cn('p-5 escalation-card flex flex-col gap-4', className)}>
        <div className="flex flex-col gap-1">
          <span className="font-display font-bold tracking-widest text-finguard-amber uppercase text-lg">
            ⚠ Escalated To Human Review
          </span>
          <span className="font-mono text-finguard-slate text-sm">
            DELTA EXCEEDED: <span className="text-finguard-amber">{delta.toFixed(3)}</span>
          </span>
        </div>
        
        {escalation_reason && (
          <div className="text-finguard-slate text-sm mt-2">
            Reason: <span className="text-finguard-amber/90">{escalation_reason}</span>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-border-finguard/50 text-finguard-amber text-sm font-mono animate-pulse">
          Awaiting human decision...
        </div>
      </div>
    )
  }

  // Fallback (should have output if not escalated)
  if (!output) {
    return null
  }

  const result = output.result
  const decisionBadgeClass = getVerdictBadgeClass(result.decision === 'approve' ? 'approved' : result.decision === 'reject' ? 'rejected' : 'escalated')

  // State 2: Resolved
  return (
    <div className={cn('p-5 arbitrator-card flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex flex-row justify-between items-start">
        <div className="flex flex-col gap-2 items-start">
          <span className="font-display font-bold tracking-widest text-finguard-blue uppercase">Arbitrator</span>
          <div className="flex items-center gap-3">
            <span className={cn('text-lg shadow-sm', decisionBadgeClass)}>
              {result.decision.toUpperCase()}
            </span>
            {output.is_mock && <span className="badge-mock">MOCK</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="score-display text-finguard-blue">{result.score.toFixed(3)}</span>
          <span className="font-mono text-finguard-blue text-xs opacity-80 uppercase">
            CONF: {result.confidence.toFixed(2)}
          </span>
        </div>
      </div>

      {reasoning && (
        <div className="mt-2 text-sm text-finguard-primary leading-relaxed bg-black/40 p-3 border border-border-finguard rounded">
          {reasoning}
        </div>
      )}

      {/* Arguments */}
      {result.arguments.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <span className="font-display uppercase text-xs tracking-widest text-finguard-slate">
            Verdict Reasoning
          </span>
          <ul className="flex flex-col gap-2">
            {result.arguments.map((arg, i) => (
              <li key={i} className="flex gap-2 items-start text-sm border-l-2 border-finguard-blue pl-2 bg-finguard-blue/5 py-1">
                <span className="text-finguard-blue font-mono shrink-0 mt-[2px]">▸</span>
                <span className="text-finguard-slate">{arg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 mt-2 border-t border-border-finguard flex justify-between items-center text-xs font-mono text-finguard-slate">
        <span>{output.processing_time_ms}ms</span>
        <span>{output.model}</span>
      </div>
    </div>
  )
}
