import {
  toConfidenceScore,
  type ConsensusResult,
  type DecisionLog,
  type PendingReviewItem
} from '@finguard/shared'

const NOW = new Date().toISOString()

export const mockLoanApproved: ConsensusResult = {
  workflow_type: 'loan',
  input_hash: 'abc123hash',
  advocate: {
    role: 'advocate',
    workflow_type: 'loan',
    input_hash: 'abc123hash',
    result: {
      decision: 'approve',
      score: toConfidenceScore(0.85),
      arguments: ['Stable employment > 48 months', 'High CIBIL score (780)', 'Low EMI to income ratio (25%)'],
      risk_factors: ['Minor dip in bank balance last month'],
      confidence: toConfidenceScore(0.92)
    },
    processing_time_ms: 2450,
    model: 'mistral:7b',
    is_mock: false
  },
  challenger: {
    role: 'challenger',
    workflow_type: 'loan',
    input_hash: 'abc123hash',
    result: {
      decision: 'reject',
      score: toConfidenceScore(0.20),
      arguments: ['Loan amount is large in absolute terms'],
      risk_factors: ['Tech industry layoffs recently'],
      confidence: toConfidenceScore(0.80)
    },
    processing_time_ms: 2600,
    model: 'mistral:7b',
    is_mock: false
  },
  confidence_delta: {
    advocate_score: toConfidenceScore(0.85),
    challenger_score: toConfidenceScore(0.20),
    delta: 0.65,
    should_escalate: false // Forced false for mock purposes to show arbitrator
  },
  arbitrator: {
    role: 'arbitrator',
    workflow_type: 'loan',
    input_hash: 'abc123hash',
    result: {
      decision: 'approve',
      score: toConfidenceScore(0.80),
      arguments: ['Advocate points on stability and CIBIL outweigh challenger macroeconomic concerns'],
      risk_factors: ['Tech sector volatility'],
      confidence: toConfidenceScore(0.88)
    },
    processing_time_ms: 1800,
    model: 'mistral:7b',
    is_mock: false
  },
  final_verdict: 'approved',
  arbitrator_reasoning: 'Advocate points on stability and CIBIL outweigh challenger macroeconomic concerns',
  hitl_required: false,
  escalation_reason: null,
  rule_engine_triggered: false,
  rule_engine_result: null,
  processing_time_ms: 6850,
  created_at: NOW
}

export const mockLoanEscalated: ConsensusResult = {
...mockLoanApproved,
  confidence_delta: {
    advocate_score: toConfidenceScore(0.60),
    challenger_score: toConfidenceScore(0.40),
    delta: 0.20,
    should_escalate: true // Escalated due to whatever reason
  },
  arbitrator: null,
  final_verdict: 'escalated',
  hitl_required: true,
  escalation_reason: 'low_confidence',
  arbitrator_reasoning: null
}
// Adjusted advocate/challenger scores to match the escalated delta
if (mockLoanEscalated.advocate) {
    mockLoanEscalated.advocate.result.score = toConfidenceScore(0.60)
    mockLoanEscalated.advocate.result.confidence = toConfidenceScore(0.25)
}
if (mockLoanEscalated.challenger) {
    mockLoanEscalated.challenger.result.score = toConfidenceScore(0.40)
}

export const mockLoanRejected: ConsensusResult = {
  workflow_type: 'loan',
  input_hash: 'def456hash',
  advocate: null,
  challenger: null,
  confidence_delta: null,
  arbitrator: null,
  final_verdict: 'rejected',
  arbitrator_reasoning: null,
  hitl_required: false,
  escalation_reason: 'hard_rule',
  rule_engine_triggered: true,
  rule_engine_result: {
    triggered: true,
    rule_name: 'CIBIL_MINIMUM',
    forced_verdict: 'rejected',
    reason: 'CIBIL score 550 is below minimum threshold of 600'
  },
  processing_time_ms: 15,
  created_at: NOW
}

export const mockFraudEscalated: ConsensusResult = {
  ...mockLoanRejected,
  workflow_type: 'fraud',
  final_verdict: 'escalated',
  hitl_required: true,
  rule_engine_result: {
    triggered: true,
    rule_name: 'FOREIGN_HIGH_VALUE',
    forced_verdict: 'escalated',
    reason: 'High-value foreign transaction of ₹7,50,000 flagged for review'
  }
}

export const mockDecisionLogs: DecisionLog[] = [
  {
    id: 'dec-1111',
    workflow_type: 'loan',
    input_data: { loan_amount: 500000 },
    advocate_arguments: mockLoanApproved.advocate!.result,
    challenger_arguments: mockLoanApproved.challenger!.result,
    confidence_delta: 0.65,
    arbitrator_decision: 'approve',
    arbitrator_reasoning: 'Strong financials',
    final_status: 'approved',
    hitl_required: false,
    human_decision: null,
    human_reviewer: null,
    human_notes: null,
    created_at: NOW,
    updated_at: NOW
  }
]

export const mockPendingReviews: PendingReviewItem[] = [
  {
    decision_id: 'dec-2222',
    workflow_type: 'loan',
    created_at: NOW,
    advocate: mockLoanEscalated.advocate!.result,
    challenger: mockLoanEscalated.challenger!.result,
    confidence_delta: 0.20,
    escalation_reason: 'low_confidence'
  }
]
