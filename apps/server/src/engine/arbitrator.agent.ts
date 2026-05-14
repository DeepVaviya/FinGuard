// ─────────────────────────────────────────────────────────────
// arbitrator.agent.ts — Weighs both sides, makes final call
// ─────────────────────────────────────────────────────────────

import type {
  AgentOutput,
  AgentArgument,
  ConfidenceDelta,
  WorkflowType,
} from '@finguard/shared';
import { toConfidenceScore, OLLAMA_MODEL } from '@finguard/shared';
import { ollamaClient } from '../ai/ollama.client.js';
import { buildArbitratorPrompt } from '../ai/prompts.js';

/**
 * Runs the Arbitrator Agent — weighs advocate and challenger arguments.
 * Only called when confidence delta ≤ 0.4 (no auto-escalation).
 */
export async function runArbitrator(
  advocate: AgentOutput,
  challenger: AgentOutput,
  delta: ConfidenceDelta
): Promise<AgentOutput> {
  const startTime = Date.now();
  const workflowType = advocate.workflow_type as WorkflowType;

  const prompt = buildArbitratorPrompt(
    advocate.result,
    challenger.result,
    delta.delta
  );
  const targetModel = process.env['ARBITRATOR_MODEL'];
  const rawResponse = await ollamaClient.generate(prompt, targetModel);

  if (rawResponse === null) {
    return buildMockOutput(workflowType, startTime);
  }

  try {
    const cleaned = rawResponse.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const result = validateAndBuildArgument(parsed);

    return {
      role: 'arbitrator',
      workflow_type: workflowType,
      input_hash: advocate.input_hash,
      result,
      processing_time_ms: Date.now() - startTime,
      model: targetModel || OLLAMA_MODEL,
      is_mock: false,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Arbitrator] Failed to parse response: ${msg}`);
    return buildMockOutput(workflowType, startTime);
  }
}

function validateAndBuildArgument(raw: Record<string, unknown>): AgentArgument {
  const decision = raw['decision'];
  if (
    decision !== 'approve' &&
    decision !== 'reject' &&
    decision !== 'escalate'
  ) {
    throw new Error(`Invalid decision value: ${String(decision)}`);
  }

  const score = clamp(Number(raw['score']) || 0.5);
  const confidence = clamp(Number(raw['confidence']) || 0.5);

  const args = Array.isArray(raw['arguments'])
    ? (raw['arguments'] as unknown[]).map(String)
    : [];

  const riskFactors = Array.isArray(raw['risk_factors'])
    ? (raw['risk_factors'] as unknown[]).map(String)
    : [];

  return {
    decision,
    score: toConfidenceScore(score),
    arguments: args,
    risk_factors: riskFactors,
    confidence: toConfidenceScore(confidence),
  };
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function buildMockOutput(
  workflowType: WorkflowType,
  startTime: number
): AgentOutput {
  return {
    role: 'arbitrator',
    workflow_type: workflowType,
    input_hash: '',
    result: {
      decision: 'escalate',
      score: toConfidenceScore(0.5),
      arguments: ['Mock response — Ollama unavailable'],
      risk_factors: [],
      confidence: toConfidenceScore(0.5),
    },
    processing_time_ms: Date.now() - startTime,
    model: OLLAMA_MODEL,
    is_mock: true,
  };
}
