import * as React from 'react'
import type { AgentOutput } from '@finguard/shared'
import { cn, getVerdictBadgeClass } from '@/lib/utils'

interface ChallengerPanelProps {
  output: AgentOutput
  className?: string
  compact?: boolean
}

export function ChallengerPanel({ output, className, compact = false }: ChallengerPanelProps) {
  const result = output.result
  const decision = result?.decision || 'escalate'
  const decisionBadgeClass = getVerdictBadgeClass(decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'escalated')

  return (
    <div className={cn('p-4 challenger-card flex flex-col gap-4', className)}>
      {/* Header Row */}
      <div className="flex flex-row justify-between items-start">
        <div className="flex flex-col gap-1 items-start">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold tracking-wider text-finguard-red uppercase">Challenger</span>
            <span className={decisionBadgeClass}>{decision.toUpperCase()}</span>
            {output.is_mock && <span className="badge-mock">MOCK</span>}
          </div>
          <span className="font-mono text-finguard-red text-xs opacity-80 uppercase">
            CONF: {result?.confidence?.toFixed(2) || '0.00'}
          </span>
        </div>
        <div className="text-right">
          <span className="font-mono-jetbrains font-bold text-4xl text-finguard-red">{result?.score ? (result.score * 100).toFixed(0) : '0'}</span>
        </div>
      </div>

      {!compact && (
        <>
          {/* Arguments Section */}
          {(result?.arguments ?? []).length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-display uppercase text-xs tracking-widest text-finguard-slate">
                Arguments Against Approval
              </span>
              <ul className="flex flex-col gap-2">
                {(result?.arguments ?? []).map((arg, idx) => (
                  <li key={idx} className="flex gap-2 items-start text-sm border-l-2 border-finguard-red pl-2 bg-finguard-red/5 py-1">
                    <span className="text-finguard-red font-mono shrink-0 mt-[2px]">▸</span>
                    <span className="text-finguard-slate">{arg}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Factors */}
          {(result?.risk_factors ?? []).length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-display uppercase text-xs tracking-widest text-finguard-slate">
                Risk Factors Identified
              </span>
              <ul className="flex flex-col gap-1">
                {(result?.risk_factors ?? []).map((factor, idx) => (
                  <li key={idx} className="flex gap-2 items-center text-xs">
                    <span className="text-finguard-red font-mono shrink-0 font-bold">✗</span>
                    <span className="text-finguard-slate/80">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-border-finguard flex justify-between items-center text-xs font-mono text-finguard-slate">
        <span>{output.processing_time_ms}ms</span>
        <span>{output.model}</span>
      </div>
    </div>
  )
}
