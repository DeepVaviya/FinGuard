// ─────────────────────────────────────────────────────────────
// confidence.delta.ts — Pure functions for delta calculation
// ─────────────────────────────────────────────────────────────

import type {
  ConfidenceDelta,
  EscalationReason,
  AgentArgument,
  ConfidenceScore,
} from '@finguard/shared';
import {
  HITL_DELTA_THRESHOLD,
  MIN_CONFIDENCE_THRESHOLD,
} from '@finguard/shared';

/**
 * Calculate the confidence delta between advocate and challenger.
 * Pure function — no side effects.
 */
export function calculateDelta(
  advocate: AgentArgument,
  challenger: AgentArgument
): ConfidenceDelta {
  const advocateScore = advocate.score as number;
  const challengerScore = challenger.score as number;
  const delta = Math.abs(advocateScore - challengerScore);

  const advocateConfidence = advocate.confidence as number;
  const challengerConfidence = challenger.confidence as number;

  const shouldEsc =
    delta > HITL_DELTA_THRESHOLD ||
    advocateConfidence < MIN_CONFIDENCE_THRESHOLD ||
    challengerConfidence < MIN_CONFIDENCE_THRESHOLD;

  return {
    advocate_score: advocate.score,
    challenger_score: challenger.score,
    delta,
    should_escalate: shouldEsc,
  };
}

/**
 * Determine if the delta warrants escalation.
 */
export function shouldEscalate(delta: ConfidenceDelta): boolean {
  return delta.should_escalate;
}

/**
 * Determine the escalation reason, if any.
 * Priority order: hard_rule > high_delta > low_confidence > null
 */
export function getEscalationReason(
  delta: ConfidenceDelta,
  ruleTriggered: boolean
): EscalationReason | null {
  if (ruleTriggered) {
    return 'hard_rule';
  }

  if (delta.delta > HITL_DELTA_THRESHOLD) {
    return 'high_delta';
  }

  const advocateScore = delta.advocate_score as number;
  const challengerScore = delta.challenger_score as number;

  if (
    advocateScore < MIN_CONFIDENCE_THRESHOLD ||
    challengerScore < MIN_CONFIDENCE_THRESHOLD
  ) {
    return 'low_confidence';
  }

  return null;
}
