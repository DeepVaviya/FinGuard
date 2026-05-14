'use client'

import React, { useState } from 'react'
import type { PendingReviewItem } from '@finguard/shared'
import { AdvocatePanel } from '@/components/engine/advocate-panel'
import { ChallengerPanel } from '@/components/engine/challenger-panel'

interface HumanReviewCardProps {
  item: PendingReviewItem
  onSubmit: (decisionId: string, verdict: 'approve' | 'reject', notes: string) => Promise<void>
}

export function HumanReviewCard({ item, onSubmit }: HumanReviewCardProps) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Construct fake AgentOutput to satisfy the Panel components, 
  // because PendingReviewItem only contains the `result: AgentArgument` part per the specs.
  // Wait, let's check MEMBER1_EXPORTS.md: 
  // `PendingReviewItem` -> `advocate: AgentArgument`, `challenger: AgentArgument`.
  // Wait! The panels want `AgentOutput`. Member 1 export says pending review item has `advocate`, `challenger` which are `AgentArgument`?
  // Let me mock the outer AgentOutput shell for the components.
  const advocateOutput = {
    role: 'advocate' as const,
    workflow_type: item.workflow_type,
    input_hash: 'N/A',
    result: item.advocate,
    processing_time_ms: 0,
    model: 'human-review',
    is_mock: false,
  }

  const challengerOutput = {
    role: 'challenger' as const,
    workflow_type: item.workflow_type,
    input_hash: 'N/A',
    result: item.challenger,
    processing_time_ms: 0,
    model: 'human-review',
    is_mock: false,
  }

  const handleSubmit = async (verdict: 'approve' | 'reject') => {
    if (!notes.trim()) return
    setIsSubmitting(true)
    await onSubmit(item.decision_id, verdict, notes)
    setIsSubmitting(false)
  }

  return (
    <div className="bg-card border border-border rounded flex flex-col overflow-hidden">
      {/* Card Header */}
      <div className="bg-background border-b border-border p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="font-mono-jetbrains text-muted-foreground text-sm">ID: {item.decision_id}</span>
          <span className="px-2 py-1 bg-finguard-navy-hover border border-border rounded text-xs font-syne uppercase text-foreground">
            {item.workflow_type}
          </span>
          <span className="px-2 py-1 badge-escalated uppercase">
            REASON: {item.escalation_reason?.replace('_', ' ') || 'MANUAL'}
          </span>
        </div>
        <div className="font-mono-jetbrains text-primary font-semibold">
          &#916; {item.confidence_delta.toFixed(2)}
        </div>
      </div>

      {/* Debate Panels */}
      <div className="grid grid-cols-2 gap-px bg-border">
        <AdvocatePanel output={advocateOutput} className="border-0 rounded-none h-full" />
        <ChallengerPanel output={challengerOutput} className="border-0 rounded-none h-full" />
      </div>

      {/* Action Area */}
      <div className="p-6 border-t border-border flex flex-col gap-4">
        <div>
          <label className="block text-sm font-syne text-muted-foreground mb-2">
            Reviewer Notes (Required)
          </label>
          <textarea
            className="w-full bg-background border border-border rounded p-3 text-sm text-foreground font-inter min-h-[100px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
            placeholder="Document your reasoning for the final decision..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handleSubmit('approve')}
            disabled={!notes.trim() || isSubmitting}
            className="flex-1 bg-finguard-green/10 text-finguard-green border border-finguard-green hover:bg-finguard-green hover:text-white font-syne font-bold py-3 rounded transition-colors disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wide"
          >
            Approve Application
          </button>
          <button
            onClick={() => handleSubmit('reject')}
            disabled={!notes.trim() || isSubmitting}
            className="flex-1 bg-finguard-red/10 text-finguard-red border border-finguard-red hover:bg-finguard-red hover:text-white font-syne font-bold py-3 rounded transition-colors disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wide"
          >
            Reject Application
          </button>
        </div>
      </div>
    </div>
  )
}
