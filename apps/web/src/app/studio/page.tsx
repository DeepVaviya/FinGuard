'use client';

import React, { useState, useCallback } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DynamicNode, DynamicEdge } from '@finguard/shared';
import { Activity, Bot, ShieldAlert, Zap } from 'lucide-react';

// Bloomberg/Cyberpunk Theme Tokens for the Canvas
const finguardTheme = {
  bg: '#0a0a0a',
  nodeBg: '#0f1629',
  border: '#1e293b',
  text: '#f8fafc',
  accent: '#2563eb',
};

// Initial welcome node on the canvas
const initialNodes = [
  {
    id: 'welcome',
    position: { x: 250, y: 150 },
    data: { label: 'Ask Qwen to generate a workflow...' },
    style: {
      background: finguardTheme.nodeBg,
      color: finguardTheme.text,
      border: `1px solid ${finguardTheme.border}`,
      borderRadius: '4px',
      padding: '16px',
      fontFamily: 'JetBrains Mono',
    },
  },
];

export default function WorkflowStudio() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Try taking ?prompt from URL
  const [prompt, setPrompt] = useState<string>('');
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const p = urlParams.get('prompt');
    if (p) setPrompt(p);
  }, []);

  const [isBuilding, setIsBuilding] = useState(false);
  
  // New States for Execution
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [inputData, setInputData] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any>(null);

  // Hits the Express Backend which proxies the prompt to Qwen 2.5
  const handleGenerate = async () => {
    setIsBuilding(true);
    try {
      const res = await fetch('http://localhost:4000/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const payload = await res.json();
      
      if (!res.ok) {
        alert(payload.error + (payload.reason ? ': ' + payload.reason : ''));
        setIsBuilding(false);
        return;
      }

      // Convert normal styling to Bloomberg/Cyberpunk styling for each node
      const styledNodes = payload.nodes.map((n: any) => {
        let accentColor = finguardTheme.border;
        if (n.type === 'advocate') accentColor = finguardTheme.accent;
        if (n.type === 'challenger') accentColor = '#ef4444'; // Red
        if (n.type === 'arbitrator') accentColor = '#a855f7'; // Purple
        if (n.type === 'input') accentColor = '#10b981'; // Green

        return {
          id: n.id,
          position: n.position,
          data: n.data,
          style: { 
            background: finguardTheme.nodeBg, 
            color: finguardTheme.text, 
            border: `1px solid ${accentColor}`, 
            borderRadius: '4px', 
            padding: '16px', 
            fontFamily: 'JetBrains Mono',
            minWidth: '200px'
          }
        };
      });

      setNodes(styledNodes);
      setEdges(payload.edges);
      setWorkflowData(payload); // Store for execution
      setTestResult(null); // Reset prev runs
    } catch (err) {
      alert('Failed to connect to Studio API. Is your Express server running?');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleRunExecution = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('http://localhost:4000/api/studio/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: workflowData, inputData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTestResult(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-slate-100 font-sans">
      
      {/* Left Sidebar Panel - Prompt Input */}
      <div className="w-80 border-r border-slate-800 bg-[#0f1629] p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <Zap className="text-blue-500" size={24} />
          <h1 className="text-xl font-bold tracking-tight">Workflow Studio</h1>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-2">
            <Bot size={14}/> Agentic Generation
          </label>
          <p className="text-sm text-slate-500 mb-2">
            Describe the banking workflow you want to build. Qwen 2.5 will design the data nodes and wire the LLM agents automatically.
          </p>
          <textarea 
            className="w-full h-32 bg-[#0a0a0a] border border-slate-800 rounded-md p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            placeholder="e.g. Create a workflow verifying international wire transfers greater than $10,000 for AML compliance..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button 
            onClick={handleGenerate}
            disabled={isBuilding || prompt.length < 5}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-md py-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isBuilding ? <Activity className="animate-spin" size={16} /> : <Zap size={16} />}
            {isBuilding ? 'Designing Architecture...' : 'Generate Workflow'}
          </button>
        </div>

        {/* Security Guardrail Disclaimer */}
        <div className="mt-auto p-4 bg-red-950/20 border border-red-900/50 rounded-md flex items-start gap-3">
          <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-red-400 font-semibold">Guardrail Active:</span> AI generation is strictly restricted to valid banking, FinTech, and risk assessment topologies.
          </p>
        </div>
      </div>

      {/* Right Canvas Panel - React Flow */}
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          className="bg-black"
        >
          <Background color="#1e293b" gap={16} />
          <Controls className="bg-slate-900 border-slate-800 fill-white" />
        </ReactFlow>
        
        {/* Overlay Badges and Actions */}
        <div className="absolute top-4 right-4 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-mono text-slate-400 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Studio Canvas Mode
        </div>

        {/* Dynamic Execution Panel Overlay */}
        {workflowData && (
          <div className="absolute bottom-6 right-6 w-96 bg-[#0f1629] border border-slate-700 shadow-2xl rounded-lg p-4 flex flex-col gap-4 font-mono z-50 overflow-y-auto max-h-[80vh]">
            <h3 className="text-white text-sm font-bold flex items-center gap-2"><Zap className="text-yellow-400" size={16}/> Test The Configuration</h3>
            <div className="flex flex-col gap-3">
              {workflowData.required_inputs?.map((input: any) => (
                <div key={input.field_name} className="flex flex-col gap-1">
                  <label className="text-xs text-blue-400">{input.field_name} <span className="text-slate-500">({input.field_type})</span></label>
                  <input 
                    type={input.field_type === 'number' ? 'number' : 'text'}
                    className="bg-[#0a0a0a] border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder={`Enter ${input.field_name}`}
                    value={inputData[input.field_name] || ''}
                    onChange={e => setInputData({...inputData, [input.field_name]: e.target.value})}
                  />
                </div>
              ))}
              
              <button 
                onClick={handleRunExecution}
                disabled={isTesting}
                className="mt-2 w-full bg-green-600 hover:bg-green-500 text-white rounded py-2 text-xs font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isTesting ? <Activity className="animate-spin" size={14} /> : null}
                {isTesting ? 'AI Models Conversing...' : 'Deploy & Run AI Consensus'}
              </button>

              <button 
                onClick={() => {
                  const saved = JSON.parse(localStorage.getItem('finguard_custom_workflows') || '[]');
                  if (!workflowData.workflow_id && !workflowData.id) {
                    workflowData.id = Math.random().toString(36).substring(7);
                  }
                  saved.push(workflowData);
                  localStorage.setItem('finguard_custom_workflows', JSON.stringify(saved));
                  alert('Successfully Published! Check the Workflows Hub tab.');
                }}
                className="w-full bg-blue-600/20 hover:bg-blue-600 border border-blue-500 text-blue-300 hover:text-white rounded py-2 text-xs font-bold transition-all flex justify-center items-center gap-2"
              >
                Publish to Workspace Hub
              </button>
            </div>

            {/* Test Results View */}
            {testResult && (
              <div className="mt-4 border-t border-slate-800 pt-4 flex flex-col gap-2">
                <h4 className="text-xs text-purple-400 font-bold mb-1">Arbitrator Final Verdict:</h4>
                <div className="bg-[#0a0a0a] p-3 rounded border border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/50">
                    <span className="uppercase font-bold tracking-widest text-slate-500">Decision</span>
                    <span className={testResult.arbitrator.decision === 'approve' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                      {testResult.arbitrator.decision.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-slate-400 leading-relaxed max-w-full whitespace-pre-wrap breakdown-words">
                    {testResult.arbitrator.arguments[0]}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
