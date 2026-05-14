'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ShieldCheck, Loader2, Zap } from 'lucide-react'
import { AdvocatePanel } from '@/components/engine/advocate-panel'
import { ChallengerPanel } from '@/components/engine/challenger-panel'
import { ArbitratorPanel } from '@/components/engine/arbitrator-panel'
import { ConfidenceDeltaMeter } from '@/components/engine/confidence-delta-meter'

export default function CustomWorkflowExecutionPage() {
  const params = useParams()
  const customId = params.id as string

  const [workflow, setWorkflow] = useState<any>(null)
  const [inputData, setInputData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('finguard_custom_workflows')
    if (saved) {
      const parsed = JSON.parse(saved)
      const found = parsed.find((w: any) => w.workflow_id === customId || w.id === customId)
      if (found) {
        setWorkflow(found)
        // Initialize inputs
        const initial: Record<string, string> = {}
        found.required_inputs?.forEach((req: any) => {
          initial[req.field_name] = ''
        })
        setInputData(initial)
      }
    }
  }, [customId])

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    
    try {
      const res = await fetch('http://localhost:4000/api/studio/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow, inputData })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!workflow) return <div className="p-8 text-white">Loading custom AI workflow...</div>

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-center bg-card border border-border p-4 rounded">
        <div>
          <h2 className="text-lg font-syne font-bold uppercase text-foreground flex items-center gap-2">
             <Zap size={20} className="text-blue-500" /> {workflow.workflow_name || 'Custom AI Workflow'}
          </h2>
          <p className="text-sm text-muted-foreground font-inter">
            {workflow.description}
          </p>
        </div>
      </div>

      <div className="flex gap-8 h-full">
        {/* Left Column (Dynamic Input Form) */}
        <div className="w-[350px] shrink-0 bg-card border border-border rounded p-6 flex flex-col gap-6">
          <form onSubmit={handleRun} className="flex flex-col gap-6 h-full">
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {workflow.required_inputs?.map((input: any) => (
                <div key={input.field_name} className="flex flex-col gap-2">
                  <label className="text-sm font-syne text-muted-foreground uppercase">{input.field_name}</label>
                  <input 
                    required
                    type={input.field_type === 'number' ? 'number' : 'text'} 
                     className="bg-background border border-border p-3 rounded font-mono-jetbrains text-foreground focus:border-primary focus:ring-1 outline-none" 
                    value={inputData[input.field_name] || ''} 
                    onChange={e => setInputData({...inputData, [input.field_name]: input.field_type === 'number' ? Number(e.target.value) : e.target.value})} 
                  />
                </div>
              ))}
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="mt-auto w-full bg-primary text-primary-foreground font-syne font-bold py-3 rounded hover:bg-primary/90 transition-colors uppercase tracking-wide flex items-center justify-center h-12 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Adversarial Engine'}
            </button>
          </form>
        </div>

        {/* Right Column (Engine Output) */}
        <div className="flex-1 flex flex-col gap-6 pl-4 border-l border-border min-h-0 overflow-y-auto custom-scrollbar overflow-x-hidden p-2">
          {!loading && !result && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
              <div className="w-16 h-16 border-2 border-dashed border-muted-foreground rounded-full" />
              <p className="font-syne uppercase tracking-widest text-sm">Awaiting Dynamic Data</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-primary space-y-4">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-syne font-bold uppercase tracking-widest animate-pulse">Running Parallel AI Models...</p>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-6 pb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[900px]">
              
              <div className="bg-card border border-border rounded p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-sm uppercase font-syne tracking-widest text-xs font-bold border ${
                    result.arbitrator.decision === 'approve' ? 'bg-finguard-green/10 text-finguard-green border-finguard-green' :
                    result.arbitrator.decision === 'reject' ? 'bg-finguard-red/10 text-finguard-red border-finguard-red' :
                    'bg-finguard-amber/10 text-finguard-amber border-finguard-amber'
                  }`}>
                    {result.arbitrator.decision}
                  </div>
                </div>
              </div>

              {result.orchestrator && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4 flex flex-col gap-2">
                  <h3 className="text-sm font-syne font-bold uppercase text-blue-500 flex items-center gap-2">
                    <Zap size={16} /> Meta-Orchestrator (Chief Risk Officer)
                  </h3>
                  <p className="text-sm text-blue-400/80 font-inter">
                    <strong>Critical Focus Areas:</strong> {result.orchestrator.focus_areas?.join(', ')}
                  </p>
                  <p className="text-sm text-blue-300 font-inter mt-1 italic border-l-2 border-blue-500/50 pl-2">
                    "{result.orchestrator.strict_instructions_for_agents}"
                  </p>
                </div>
              )}
              
              
              <div className="grid grid-cols-2 gap-4 w-full h-[400px]">
                <div className="h-full overflow-y-auto custom-scrollbar pr-2 border-r border-border">
                  <AdvocatePanel output={{ role: 'advocate', result: result.advocate } as any} />
                </div>
                <div className="h-full overflow-y-auto custom-scrollbar pl-2">
                   <ChallengerPanel output={{ role: 'challenger', result: result.challenger } as any} />
                </div>
              </div>

               <ArbitratorPanel output={{ role: 'arbitrator', result: result.arbitrator } as any} />
               
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
