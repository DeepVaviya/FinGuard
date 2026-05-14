// ─────────────────────────────────────────────────────────────
// consensus.engine.ts — Main orchestrator for the Adversarial
// Consensus Engine. Primary entry point for all workflows.
// ─────────────────────────────────────────────────────────────

import crypto from 'node:crypto';
import type {
  ConsensusResult,
  WorkflowType,
  WorkflowInput,
  Verdict,
} from '@finguard/shared';
import { runRules } from '../rule-engine/index.js';
import { runParallel } from './parallel.runner.js';
import {
  calculateDelta,
  shouldEscalate,
  getEscalationReason,
} from './confidence.delta.js';
import { runArbitrator } from './arbitrator.agent.js';

/**
 * Run the full Adversarial Consensus Engine pipeline.
 *
 * Flow:
 * 1. Hash input for deduplication
 * 2. Run Rule Engine — if rule fires, return immediately
 * 3. Run Advocate + Challenger in parallel
 * 4. Calculate confidence delta
 * 5. If should escalate → return with escalation, skip Arbitrator
 * 6. Run Arbitrator → assemble final result
 *
 * Does NOT call Supabase. Does NOT start an HTTP server.
 */
export async function runConsensus(
  workflowType: WorkflowType,
  input: WorkflowInput
): Promise<ConsensusResult> {
  // Step 1 — record start time
  const startTime = Date.now();

  // Step 2 — hash input
  const inputHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex');

  // Step 3 — run rule engine
  const ruleResult = runRules(workflowType, input);

  if (ruleResult.triggered) {
    return {
      workflow_type: workflowType,
      input_hash: inputHash,
      advocate: null,
      challenger: null,
      confidence_delta: null,
      arbitrator: null,
      final_verdict: ruleResult.forced_verdict ?? 'escalated',
      arbitrator_reasoning: null,
      hitl_required: ruleResult.forced_verdict === 'escalated',
      escalation_reason: 'hard_rule',
      rule_engine_triggered: true,
      rule_engine_result: ruleResult,
      processing_time_ms: Date.now() - startTime,
      created_at: new Date().toISOString(),
    };
  }

  // Step 4 — run parallel agents
  const { advocate, challenger } = await runParallel(workflowType, input);

  // Step 5 — calculate delta
  const delta = calculateDelta(advocate.result, challenger.result);

  // Step 6 — check escalation
  if (shouldEscalate(delta)) {
    const escalationReason = getEscalationReason(delta, false);

    return {
      workflow_type: workflowType,
      input_hash: inputHash,
      advocate,
      challenger,
      confidence_delta: delta,
      arbitrator: null,
      final_verdict: 'escalated',
      arbitrator_reasoning: null,
      hitl_required: true,
      escalation_reason: escalationReason,
      rule_engine_triggered: false,
      rule_engine_result: ruleResult,
      processing_time_ms: Date.now() - startTime,
      created_at: new Date().toISOString(),
    };
  }

  // Step 7 — run arbitrator
  const arbitrator = await runArbitrator(advocate, challenger, delta);

  // Step 8 — assemble final result
  const finalVerdict: Verdict =
    arbitrator.result.decision === 'approve'
      ? 'approved'
      : arbitrator.result.decision === 'reject'
        ? 'rejected'
        : 'escalated';

  const arbitratorReasoning = arbitrator.result.arguments.join('; ');

  return {
    workflow_type: workflowType,
    input_hash: inputHash,
    advocate,
    challenger,
    confidence_delta: delta,
    arbitrator,
    final_verdict: finalVerdict,
    arbitrator_reasoning: arbitratorReasoning,
    hitl_required: finalVerdict === 'escalated',
    escalation_reason:
      finalVerdict === 'escalated'
        ? getEscalationReason(delta, false)
        : null,
    rule_engine_triggered: false,
    rule_engine_result: ruleResult,
    processing_time_ms: Date.now() - startTime,
    created_at: new Date().toISOString(),
  };
}
