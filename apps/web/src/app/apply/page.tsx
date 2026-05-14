'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertTriangle, XCircle, CheckCircle2, CreditCard, Landmark, TrendingUp, Zap } from 'lucide-react';

export default function ConsumerApplicationPortal() {
  const [activeTab, setActiveTab] = useState<string>('loan');
  const [customWorkflows, setCustomWorkflows] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('finguard_custom_workflows');
    if (saved) {
      setCustomWorkflows(JSON.parse(saved));
    }
  }, []);

  // Unified Form State for all types
  const [formData, setFormData] = useState<any>({
    // Loan
    applicant_name: '', loan_amount: '', credit_score: '', annual_income: '', debt_to_income_ratio: '0.3',
    // Fraud
    merchant: '', transaction_amount: '', ip_country: 'US', card_country: 'US', time_since_last_purchase_minutes: '120',
    // Investment
    fund_name: 'S&P 500 Index', deposit_amount: '', investor_risk_tolerance: 'medium', age: '35'
  });

  const [status, setStatus] = useState<'idle' | 'processing' | 'approved' | 'rejected' | 'escalated'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('processing');
    setErrorMessage('');
    
    // Core Workflow vs Custom Workflow Logic
    const isCustom = customWorkflows.find(w => w.workflow_id === activeTab || w.id === activeTab);
    
    try {
      if (isCustom) {
        // Send Custom AI Workflow directly to the Studio Execution Endpoint
        const res = await fetch('http://localhost:4000/api/studio/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow: isCustom, inputData: formData })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const verdict = data.arbitrator.decision;
        const reasoning = data.arbitrator.reasoning;
        
        if (verdict === 'approve') setStatus('approved');
        else if (verdict === 'reject') setStatus('rejected');
        else setStatus('escalated');
        
        setAiFeedback(reasoning || 'Application processed.');

      } else {
        // Send Core Workflow to the Engine Endpoint
        let inputPayload = {};
        if (activeTab === 'loan') {
          inputPayload = {
            applicant_name: formData.applicant_name,
            loan_amount: Number(formData.loan_amount),
            credit_score: Number(formData.credit_score),
            annual_income: Number(formData.annual_income),
            debt_to_income_ratio: Number(formData.debt_to_income_ratio)
          };
        } else if (activeTab === 'fraud') {
          inputPayload = {
            merchant: formData.merchant,
            transaction_amount: Number(formData.transaction_amount),
            ip_country: formData.ip_country,
            card_country: formData.card_country,
            time_since_last_purchase_minutes: Number(formData.time_since_last_purchase_minutes)
          };
        } else if (activeTab === 'investment') {
          inputPayload = {
            fund_name: formData.fund_name,
            deposit_amount: Number(formData.deposit_amount),
            investor_risk_tolerance: formData.investor_risk_tolerance,
            age: Number(formData.age)
          };
        }

        const response = await fetch('http://localhost:4000/api/workflow/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow_type: activeTab, input: inputPayload })
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to process application');

        const verdict = data.data.result.final_verdict;
        const reasoning = data.data.result.arbitrator_reasoning || data.data.result.arbitrator?.result.arguments[0];

        if (verdict === 'approved') setStatus('approved');
        else if (verdict === 'rejected') setStatus('rejected');
        else setStatus('escalated');

        setAiFeedback(reasoning || 'Application processed.');
      }
    } catch (err: any) {
      setStatus('idle');
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-100">
        
        {/* Branding Header */}
        <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-8">
            <ShieldCheck size={120} />
          </div>
          <ShieldCheck className="text-white mx-auto mb-4" size={48} />
          <h1 className="text-3xl font-bold text-white tracking-tight">FinGuard Bank</h1>
          <p className="text-blue-100 mt-2 text-sm font-medium">Public Consumer Portal</p>
        </div>

        {/* Tab Navigation */}
        {status === 'idle' && (
          <div className="flex border-b border-slate-200 overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => setActiveTab('loan')}
              className={`flex-none px-6 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'loan' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Landmark size={18} /> Loan
            </button>
            <button 
              onClick={() => setActiveTab('fraud')}
              className={`flex-none px-6 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'fraud' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <CreditCard size={18} /> Card Transaction
            </button>
            <button 
              onClick={() => setActiveTab('investment')}
              className={`flex-none px-6 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'investment' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <TrendingUp size={18} /> Investment
            </button>
            {customWorkflows.map((wf) => {
               const id = wf.workflow_id || wf.id;
               return (
                <button 
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-none px-6 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Zap size={18} className="text-blue-500" /> {wf.workflow_name || 'Custom AI Workflow'}
                </button>
               )
            })}
          </div>
        )}

        <div className="p-8">
          {status === 'idle' && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
              
              {/* LOAN FORM */}
              {activeTab === 'loan' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Legal Name</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="John Doe" value={formData.applicant_name} onChange={e => setFormData({...formData, applicant_name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Loan Amount ($)</label>
                      <input required type="number" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="50000" value={formData.loan_amount} onChange={e => setFormData({...formData, loan_amount: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Credit Score</label>
                      <input required max="850" min="300" type="number" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="720" value={formData.credit_score} onChange={e => setFormData({...formData, credit_score: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Annual Income ($)</label>
                    <input required type="number" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="85000" value={formData.annual_income} onChange={e => setFormData({...formData, annual_income: e.target.value})} />
                  </div>
                </div>
              )}

              {/* FRAUD/TRANSACTION FORM */}
              {activeTab === 'fraud' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Merchant Name</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="BuyNLarge Electronics" value={formData.merchant} onChange={e => setFormData({...formData, merchant: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Transaction Amount ($)</label>
                    <input required type="number" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="1250" value={formData.transaction_amount} onChange={e => setFormData({...formData, transaction_amount: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">IP Country</label>
                      <input required type="text" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="US" value={formData.ip_country} onChange={e => setFormData({...formData, ip_country: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Mins since last swipe</label>
                      <input required type="number" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="5" value={formData.time_since_last_purchase_minutes} onChange={e => setFormData({...formData, time_since_last_purchase_minutes: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              {/* INVESTMENT FORM */}
              {activeTab === 'investment' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Target IRA Fund</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="S&P 500 Index" value={formData.fund_name} onChange={e => setFormData({...formData, fund_name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Deposit Amount ($)</label>
                      <input required type="number" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="15000" value={formData.deposit_amount} onChange={e => setFormData({...formData, deposit_amount: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Investor Age</label>
                      <input required type="number" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="35" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Risk Tolerance (low/medium/high)</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" placeholder="high" value={formData.investor_risk_tolerance} onChange={e => setFormData({...formData, investor_risk_tolerance: e.target.value})} />
                  </div>
                </div>
              )}

              {/* CUSTOM DYNAMIC FORMS */}
              {customWorkflows.find(w => w.workflow_id === activeTab || w.id === activeTab) && (
                <div className="space-y-4">
                  <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm mb-4 border border-blue-100 flex items-center gap-2">
                    <Zap size={16} /> <strong>AI STUDIO:</strong> This form was dynamically generated.
                  </div>
                  {customWorkflows.find(w => w.workflow_id === activeTab || w.id === activeTab).required_inputs?.map((input: any) => (
                    <div key={input.field_name}>
                      <label className="block text-sm font-bold text-slate-700 mb-1 capitalize">{input.field_name.replace(/_/g, ' ')}</label>
                      <input 
                        required 
                        type={input.field_type === 'number' ? 'number' : 'text'} 
                        className="w-full border border-slate-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-black" 
                        placeholder={`Enter ${input.field_type}`} 
                        value={formData[input.field_name] || ''} 
                        onChange={e => setFormData({...formData, [input.field_name]: input.field_type === 'number' ? Number(e.target.value) : e.target.value})} 
                      />
                    </div>
                  ))}
                </div>
              )}

              {errorMessage && (
                <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertTriangle size={16} /> {errorMessage}
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform active:scale-95 text-lg">
                Submit Application
              </button>
            </form>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
              <Loader2 className="animate-spin text-blue-600" size={64} />
              <div>
                <h3 className="text-xl font-bold text-slate-800">Analyzing Profile...</h3>
                <p className="text-slate-500 mt-2 leading-relaxed">Our Secure AI Engine is running deep cross-checks.<br/>Please do not close this window.</p>
              </div>
            </div>
          )}

          {status === 'approved' && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">Approved!</h3>
                <p className="text-slate-500 mt-2 text-lg">Your funds are ready for disbursement.</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left w-full">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Automated AI Feedback</p>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{aiFeedback}</p>
              </div>
              <button onClick={() => setStatus('idle')} className="text-blue-600 font-bold hover:underline">Start New Application</button>
            </div>
          )}

          {status === 'rejected' && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <XCircle size={48} />
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">Application Declined</h3>
                <p className="text-slate-500 mt-2 text-lg">We cannot instantly approve this request.</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left w-full">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Automated AI Feedback</p>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{aiFeedback}</p>
              </div>
              <button onClick={() => setStatus('idle')} className="text-blue-600 font-bold hover:underline">Start New Application</button>
            </div>
          )}

          {status === 'escalated' && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                <AlertTriangle size={48} />
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">Under Manual Review</h3>
                <p className="text-slate-500 mt-2 text-lg">Your profile requires human verification.</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left w-full">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Our automated systems detected complex variables in your profile. Your application has been securely queued for one of our human loan officers to review within 24 hours.
                </p>
              </div>
              <button onClick={() => setStatus('idle')} className="text-blue-600 font-bold hover:underline">Start New Application</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
