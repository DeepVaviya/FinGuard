// ─────────────────────────────────────────────────────────────
// api.types.ts — API contracts for Member 2 to implement exactly
// ─────────────────────────────────────────────────────────────

import type { AgentArgument } from './agent.types.js';
import type {
  ConsensusResult,
  DecisionLog,
  EscalationReason,
  Verdict,
} from './decision.types.js';
import type { WorkflowInput, WorkflowType } from './workflow.types.js';

/** Standard API response envelope. */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly error: string | null;
  readonly timestamp: string;
}

/** Structured API error payload. */
export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/** Request body to run a workflow. */
export interface RunWorkflowRequest {
  readonly workflow_type: WorkflowType;
  readonly input: WorkflowInput;
}

/** Response after running a workflow. */
export interface RunWorkflowResponse {
  readonly decision_id: string;
  readonly result: ConsensusResult;
}

/** Query params for fetching past decisions. */
export interface GetDecisionsRequest {
  readonly workflow_type?: WorkflowType;
  readonly verdict?: Verdict;
  readonly limit?: number;
  readonly offset?: number;
}

/** Paginated response for decision history. */
export interface GetDecisionsResponse {
  readonly decisions: DecisionLog[];
  readonly total: number;
}

/** A pending HITL review item. */
export interface PendingReviewItem {
  readonly decision_id: string;
  readonly workflow_type: WorkflowType;
  readonly created_at: string;
  readonly advocate: AgentArgument;
  readonly challenger: AgentArgument;
  readonly confidence_delta: number;
  readonly escalation_reason: EscalationReason;
}

/** Request body for submitting a human review. */
export interface SubmitHumanReviewRequest {
  readonly decision_id: string;
  readonly human_verdict: 'approved' | 'rejected';
  readonly reviewer_name: string;
  readonly notes: string;
}

/** Response after submitting a human review. */
export interface SubmitHumanReviewResponse {
  readonly decision_id: string;
  readonly updated_status: Verdict;
}
