'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { runWorkflow } from '@/lib/api-client'
import type { WorkflowType, RunWorkflowResponse, WorkflowInput } from '@finguard/shared'
import { AdvocatePanel } from '@/components/engine/advocate-panel'
import { ChallengerPanel } from '@/components/engine/challenger-panel'
import { ArbitratorPanel } from '@/components/engine/arbitrator-panel'
import { ConfidenceDeltaMeter } from '@/components/engine/confidence-delta-meter'
import { Loader2 } from 'lucide-react'

export default function WorkflowExecutionPage() {
  const params = useParams()
  const type = (params.type as WorkflowType) || 'loan'

  const [inputData, setInputData] = useState<any>({
    cibil_score: 700, // default good path
    monthly_income_inr: 150000,
    amount: 50000,
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RunWorkflowResponse | null>(null)

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    const res = await runWorkflow(type, inputData as WorkflowInput)
    setResult(res)
    setLoading(false)
  }

  const renderFormFields = () => {
    if (type === 'loan') {
      return (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-syne text-muted-foreground uppercase">Applicant Name</label>
            <input type="text" className="bg-background border border-border p-3 rounded font-inter text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none" defaultValue="John Doe" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-syne text-muted-foreground uppercase">Monthly Income (INR)</label>
            <input type="number" className="bg-background border border-border p-3 rounded font-mono-jetbrains text-foreground focus:border-primary focus:ring-1 outline-none" value={inputData.monthly_income_inr} onChange={e => setInputData({...inputData, monthly_income_inr: Number(e.target.value)})} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-syne text-muted-foreground uppercase">CIBIL Score</label>
            <input 
              type="number" 
              className="bg-background border border-border p-3 rounded font-mono-jetbrains text-foreground focus:border-primary focus:ring-1 outline-none" 
              value={inputData.cibil_score} 
              onChange={e => setInputData({...inputData, cibil_score: Number(e.target.value)})} 
            />
            <p className="text-xs font-inter text-muted-foreground mt-1">Hint: Try &lt; 600 to see Escalation / Rule Trigger mock</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-syne text-muted-foreground uppercase">Loan Amount (INR)</label>
            <input type="number" className="bg-background border border-border p-3 rounded font-mono-jetbrains text-foreground focus:border-primary focus:ring-1 outline-none" value={inputData.amount} onChange={e => setInputData({...inputData, amount: Number(e.target.value)})} />
          </div>
        </>
      )
    }

    if (type === 'fraud') {
      return (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-syne text-muted-foreground uppercase">Transaction Amount (INR)</label>
            <input type="number" className="bg-background border border-border p-3 rounded font-mono-jetbrains text-foreground focus:border-primary outline-none" defaultValue={750000} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-syne text-muted-foreground uppercase">Is Foreign</label>
            <select className="bg-background border border-border p-3 rounded font-inter text-foreground focus:border-primary outline-none">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-syne text-muted-foreground uppercase">Merchant</label>
            <input type="text" className="bg-background border border-border p-3 rounded font-inter text-foreground focus:border-primary outline-none" defaultValue="Unknown Crypto Exchange" />
          </div>
        </>
      )
    }
    
    // Generic fallback for others
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-syne text-muted-foreground uppercase">Test Input Field</label>
        <input type="text" className="bg-background border border-border p-3 rounded font-inter text-foreground focus:border-primary outline-none" defaultValue="Test Value" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-center bg-card border border-border p-4 rounded">
        <div>
          <h2 className="text-lg font-syne font-bold uppercase text-foreground">
            {type} Analysis
          </h2>
          <p className="text-sm text-muted-foreground font-inter">
            Enter parameters to initiate the adversarial consensus run.
          </p>
        </div>
      </div>

      <div className="flex gap-8 h-full">
        {/* Left Column (Input Form) */}
        <div className="w-[350px] shrink-0 bg-card border border-border rounded p-6 flex flex-col gap-6">
          <form onSubmit={handleRun} className="flex flex-col gap-6 h-full">
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {renderFormFields()}
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="mt-autow-full bg-primary text-primary-foreground font-syne font-bold py-3 rounded hover:bg-primary/90 transition-colors uppercase tracking-wide flex items-center justify-center h-12 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Adversarial Analysis'}
            </button>
          </form>
        </div>

        {/* Right Column (Engine Output) */}
        <div className="flex-1 flex flex-col gap-6 pl-4 border-l border-border min-h-0 overflow-y-auto custom-scrollbar overflow-x-hidden p-2">
          {!loading && !result && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
              <div className="w-16 h-16 border-2 border-dashed border-muted-foreground rounded-full" />
              <p className="font-syne uppercase tracking-widest text-sm">Awaiting Execution Trigger</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-primary space-y-4">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-syne font-bold uppercase tracking-widest animate-pulse">Running Agents...</p>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-6 pb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[900px]">
              
              {/* Verdict Header Container */}
              <div className="bg-card border border-border rounded p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-mono-jetbrains text-muted-foreground text-xs">ID: {result.decision_id}</span>
                  <div className={`px-3 py-1 rounded-sm uppercase font-syne tracking-widest text-xs font-bold border ${
                    result.result.final_verdict === 'approved' ? 'bg-finguard-green/10 text-finguard-green border-finguard-green' :
                    result.result.final_verdict === 'rejected' ? 'bg-finguard-red/10 text-finguard-red border-finguard-red' :
                    'bg-finguard-amber/10 text-finguard-amber border-finguard-amber'
                  }`}>
                    {result.result.final_verdict}
                  </div>
                </div>
                <div className="font-mono-jetbrains text-sm text-foreground">
                  {result.result.processing_time_ms}ms
                </div>
              </div>

              {/* Engine Panels */}
              {result.result.rule_engine_triggered ? (
                <div className="bg-finguard-red/10 border border-finguard-red rounded p-6">
                  <h3 className="font-syne text-finguard-red font-bold uppercase mb-2 text-lg">Hard Rule Triggered</h3>
                  <p className="font-mono-jetbrains text-sm text-finguard-red/80 mb-1">Rule: {result.result.rule_engine_result?.rule_name}</p>
                  <p className="font-inter text-muted-foreground">{result.result.rule_engine_result?.reason}</p>
                </div>
              ) : (
                <>
                  <div className="bg-card border border-border px-8 py-6 rounded">
                    <ConfidenceDeltaMeter 
                      advocate_score={result.result.confidence_delta?.advocate_score ?? 0}
                      challenger_score={result.result.confidence_delta?.challenger_score ?? 0}
                      delta={result.result.confidence_delta?.delta ?? 0}
                      should_escalate={result.result.confidence_delta?.should_escalate ?? false}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full h-[400px]">
                    <div className="h-full overflow-y-auto custom-scrollbar pr-2 border-r border-border">
                      {result.result.advocate && <AdvocatePanel output={result.result.advocate} />}
                    </div>
                    <div className="h-full overflow-y-auto custom-scrollbar pl-2">
                       {result.result.challenger && <ChallengerPanel output={result.result.challenger} />}
                    </div>
                  </div>

                  {result.result.arbitrator && (
                     <ArbitratorPanel output={result.result.arbitrator} />
                  )}

                  {result.result.hitl_required && (
                    <div className="bg-finguard-amber/10 border border-finguard-amber rounded p-6">
                      <h3 className="font-syne text-finguard-amber font-bold uppercase mb-2 text-lg">Human Review Required</h3>
                      <p className="font-mono-jetbrains text-sm text-finguard-amber/80 mb-1">Reason: {result.result.escalation_reason}</p>
                      <p className="font-inter text-muted-foreground">This decision has been escalated to the Human Review Queue.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
