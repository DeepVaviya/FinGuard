// ─────────────────────────────────────────────────────────────
// agent.types.ts — Agent roles, branded confidence, outputs
// ─────────────────────────────────────────────────────────────

import type { WorkflowType } from './workflow.types.js';

/** The three agent roles in the Adversarial Consensus Engine. */
export type AgentRole = 'advocate' | 'challenger' | 'arbitrator';

/**
 * Branded number type constrained to [0.0, 1.0].
 * Prevents accidental use of arbitrary numbers as confidence values.
 */
declare const __confidenceBrand: unique symbol;
export type ConfidenceScore = number & { readonly [__confidenceBrand]: true };

/**
 * Validates and constructs a ConfidenceScore.
 * @param n — Raw number to validate
 * @returns Branded ConfidenceScore
 * @throws {RangeError} if value is outside [0.0, 1.0]
 */
export function toConfidenceScore(n: number): ConfidenceScore {
  if (n < 0 || n > 1) {
    throw new RangeError(
      `ConfidenceScore must be between 0.0 and 1.0, received: ${n}`
    );
  }
  return n as ConfidenceScore;
}

/** Structured argument produced by any agent. */
export interface AgentArgument {
  readonly decision: 'approve' | 'reject' | 'escalate';
  readonly score: ConfidenceScore;
  readonly arguments: string[];
  readonly risk_factors: string[];
  readonly confidence: ConfidenceScore;
}

/** Full output envelope from a single agent run. */
export interface AgentOutput {
  readonly role: AgentRole;
  readonly workflow_type: WorkflowType;
  readonly input_hash: string;
  readonly result: AgentArgument;
  readonly processing_time_ms: number;
  readonly model: string;
  readonly is_mock: boolean;
}
