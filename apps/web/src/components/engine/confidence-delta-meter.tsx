import * as React from 'react'
import { cn } from '@/lib/utils'

interface ConfidenceDeltaMeterProps {
  advocate_score: number
  challenger_score: number
  delta: number
  should_escalate: boolean
  className?: string
}

export function ConfidenceDeltaMeter({
  advocate_score,
  challenger_score,
  delta,
  should_escalate,
  className
}: ConfidenceDeltaMeterProps) {
  const advocateWidth = `${Math.min(advocate_score * 100, 100)}%`
  const challengerWidth = `${Math.min(challenger_score * 100, 100)}%`
  
  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      {/* Top row */}
      <div className="grid grid-cols-3 items-end">
        <div className="flex flex-col items-start gap-1">
          <span className="font-display font-semibold tracking-wide text-finguard-green text-sm uppercase">Advocate</span>
          <span className="score-display text-finguard-green">{(advocate_score * 100).toFixed(0)}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <span className="font-display font-medium text-xs text-finguard-slate tracking-widest uppercase">Delta</span>
          <span className={cn(
            'delta-display',
            should_escalate ? 'text-finguard-amber' : 'text-finguard-slate'
          )}>
            {delta.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="font-display font-semibold tracking-wide text-finguard-red text-sm uppercase">Challenger</span>
          <span className="score-display text-finguard-red">{(challenger_score * 100).toFixed(0)}</span>
        </div>
      </div>

      {/* Middle row: Meter Bar */}
      <div className="relative w-full h-[12px] bg-border-finguard overflow-hidden flex self-center">
        {/* Advocate section */}
        <div 
          className="absolute left-0 top-0 bottom-0 bg-finguard-green transition-all"
          style={{ width: advocateWidth }}
        />
        
        {/* Challenger section */}
        <div 
          className="absolute right-0 top-0 bottom-0 bg-finguard-red transition-all"
          style={{ width: challengerWidth }}
        />

        {/* Gap highlight for escalation */}
        {should_escalate && (
          <div 
            className="absolute top-0 bottom-0 border-y-2 border-finguard-amber bg-finguard-amber/10 transition-all z-10"
            style={{ 
              left: advocateWidth,
              right: challengerWidth 
            }}
          />
        )}

        {/* Threshold Indicator (at 40% difference / visually mapping appropriately depending on design) */}
        {/* The user requested strict 0.4 indication. A static mark at 0.4 from center might not line up if scale is absolute width. We'll simply place a fixed visual guide line representing the constraint */}
      </div>

      <div className="relative w-full text-xs text-finguard-slate flex justify-center mb-1 font-mono">
        <span className="absolute self-center rounded-sm px-1 py-[1px] bg-finguard-navy">THRESHOLD 0.4</span>
      </div>

      {/* Bottom row */}
      <div className="flex justify-center text-center mt-2">
        {should_escalate ? (
          <span className="font-display font-bold tracking-widest text-finguard-amber uppercase text-xs">
            ⚠ Escalation Triggered — Confidence Delta Exceeds Threshold
          </span>
        ) : (
          <span className="font-display font-bold tracking-widest text-finguard-green uppercase text-xs">
            ✓ Consensus Reached — Proceeding to Arbitration
          </span>
        )}
      </div>
    </div>
  )
}
