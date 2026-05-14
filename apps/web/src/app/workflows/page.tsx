'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, FileText, Activity, TrendingUp, ArrowRight, Zap } from 'lucide-react'

// Hardcoded logic
const standardWorkflows = [
  {
    id: 'fraud',
    title: 'Fraud Detection',
    description: 'Analyze transactions for anomalous patterns, high-value foreign flags, and sudden spikes compared to historical averages.',
    icon: AlertCircle,
    color: 'text-finguard-red',
    bg: 'bg-finguard-red/10',
    border: 'border-finguard-red/20',
  },
  {
    id: 'loan',
    title: 'Origination & Underwriting',
    description: 'Evaluate loan applications combining hard rules (CIBIL > 600) and adversarial analysis of financials vs risk factors.',
    icon: FileText,
    color: 'text-finguard-green',
    bg: 'bg-finguard-green/10',
    border: 'border-finguard-green/20',
  },
  {
    id: 'transaction',
    title: 'Transaction Monitoring',
    description: 'Real-time clearing analysis. Enforces KYC verification, mandatory review thresholds, and cross-border risk checks.',
    icon: Activity,
    color: 'text-finguard-blue',
    bg: 'bg-finguard-blue/10',
    border: 'border-finguard-blue/20',
  },
  {
    id: 'investment',
    title: 'Investment Risk Assessment',
    description: 'Stress-test portfolios against volatility indices, ensuring adherence to the client\'s risk profile (crypto/equity ratios).',
    icon: TrendingUp,
    color: 'text-finguard-amber',
    bg: 'bg-finguard-amber/10',
    border: 'border-finguard-amber/20',
  }
]

export default function WorkflowsHubPage() {
  const [customWorkflows, setCustomWorkflows] = useState<any[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('finguard_custom_workflows')
    if (saved) {
      setCustomWorkflows(JSON.parse(saved))
    }
  }, [])

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-syne font-bold text-foreground mb-2">Available Workflows</h1>
        <p className="text-muted-foreground font-inter">
          Select an adversarial workflow to initialize. Each workflow runs the Advocate and Challenger agents via the consensus engine.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-4">
        {/* Core Workflows */}
        {standardWorkflows.map((wf) => (
          <div key={wf.id} className="bg-card border border-border hover:border-primary/50 transition-colors rounded-sm flex flex-col items-start p-6 relative group overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full ${wf.bg} -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            <div className={`w-12 h-12 rounded ${wf.bg} ${wf.border} border flex items-center justify-center mb-6`}>
              <wf.icon className={`w-6 h-6 ${wf.color}`} />
            </div>
            <h3 className="text-xl font-syne font-semibold text-foreground mb-3">{wf.title}</h3>
            <p className="text-sm font-inter text-muted-foreground flex-1 mb-8 leading-relaxed">{wf.description}</p>
            <div className="mt-auto w-full flex flex-col gap-2">
              <Link href={`/workflows/${wf.id}`} className="w-full group/btn relative overflow-hidden bg-background border border-border hover:border-primary py-3 px-4 rounded flex items-center justify-between transition-all">
                <span className="font-syne font-medium text-foreground tracking-wide text-sm relative z-10">RUN WORKFLOW</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/btn:text-primary transition-colors relative z-10 group-hover/btn:translate-x-1" />
                <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover/btn:translate-y-0 transition-transform z-0" />
              </Link>
            </div>
          </div>
        ))}

        {/* Dynamic Studio Workflows */}
        {customWorkflows.map((wf, idx) => (
          <div key={`custom-${idx}`} className="bg-card border-2 border-blue-500/20 hover:border-blue-500 transition-colors rounded-sm flex flex-col items-start p-6 relative group overflow-hidden">
            <div className={`w-12 h-12 rounded bg-blue-500/10 border-blue-500/20 border flex items-center justify-center mb-6`}>
              <Zap className={`w-6 h-6 text-blue-500`} />
            </div>
            <h3 className="text-xl font-syne font-semibold text-foreground mb-3 flex items-center gap-2">
              {wf.workflow_name || 'Custom Workflow'} <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded">STUDIO AI</span>
            </h3>
            <p className="text-sm font-inter text-muted-foreground flex-1 mb-8 leading-relaxed">
              {wf.description || 'Dynamically generated AI architectural logic.'}
            </p>
            <div className="mt-auto w-full flex flex-col gap-2">
              <Link href={`/workflows/custom-${wf.workflow_id || wf.id || Math.random().toString(36).substring(7)}`} className="w-full group/btn relative overflow-hidden bg-background border border-border hover:border-blue-500 py-3 px-4 rounded flex items-center justify-between transition-all">
                <span className="font-syne font-medium text-foreground tracking-wide text-sm relative z-10">RUN CUSTOM WORKFLOW</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/btn:text-blue-500 transition-colors relative z-10 group-hover/btn:translate-x-1" />
                <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover/btn:translate-y-0 transition-transform z-0" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
