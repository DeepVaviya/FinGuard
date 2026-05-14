// ─────────────────────────────────────────────────────────────
// decision.types.ts — Verdicts, deltas, consensus results, logs
// ─────────────────────────────────────────────────────────────

import type { AgentArgument, AgentOutput, ConfidenceScore } from './agent.types.js';
import type { WorkflowType } from './workflow.types.js';

/** Final verdict of a consensus round. */
export type Verdict = 'approved' | 'rejected' | 'escalated' | 'pending_review';

/** Reasons for escalation to Human-in-the-Loop. */
export type EscalationReason =
  | 'high_delta'
  | 'hard_rule'
  | 'low_confidence'
  | 'manual';

/** Result from the Rule Engine — fires before agents. */
export interface RuleResult {
  readonly triggered: boolean;
  readonly rule_name: string | null;
  readonly forced_verdict: Verdict | null;
  readonly reason: string | null;
}

/** Confidence delta between advocate and challenger. */
export interface ConfidenceDelta {
  readonly advocate_score: ConfidenceScore;
  readonly challenger_score: ConfidenceScore;
  readonly delta: number;
  readonly should_escalate: boolean;
}

/** The complete result of a consensus round — the main data structure. */
export interface ConsensusResult {
  readonly workflow_type: WorkflowType;
  readonly input_hash: string;
  readonly advocate: AgentOutput | null;
  readonly challenger: AgentOutput | null;
  readonly confidence_delta: ConfidenceDelta | null;
  readonly arbitrator: AgentOutput | null;
  readonly final_verdict: Verdict;
  readonly arbitrator_reasoning: string | null;
  readonly hitl_required: boolean;
  readonly escalation_reason: EscalationReason | null;
  readonly rule_engine_triggered: boolean;
  readonly rule_engine_result: RuleResult | null;
  readonly processing_time_ms: number;
  readonly created_at: string;
}

/** Full persisted decision log — includes human review fields. */
export interface DecisionLog {
  readonly id: string;
  readonly workflow_type: WorkflowType;
  readonly input_data: Record<string, unknown>;
  readonly advocate_arguments: AgentArgument | null;
  readonly challenger_arguments: AgentArgument | null;
  readonly confidence_delta: number | null;
  readonly arbitrator_decision: string | null;
  readonly arbitrator_reasoning: string | null;
  readonly final_status: Verdict;
  readonly hitl_required: boolean;
  readonly human_decision: string | null;
  readonly human_reviewer: string | null;
  readonly human_notes: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}
