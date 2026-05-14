// ─────────────────────────────────────────────────────────────
// advocate.agent.ts — Argues FOR approval
// ─────────────────────────────────────────────────────────────

import type {
  AgentOutput,
  AgentArgument,
  WorkflowType,
  WorkflowInput,
} from '@finguard/shared';
import { toConfidenceScore, OLLAMA_MODEL } from '@finguard/shared';
import { ollamaClient } from '../ai/ollama.client.js';
import { buildAdvocatePrompt } from '../ai/prompts.js';

/**
 * Runs the Advocate Agent — generates arguments FOR approval.
 * Falls back to mock output if Ollama is unavailable or returns invalid JSON.
 */
export async function runAdvocate(
  workflowType: WorkflowType,
  input: WorkflowInput
): Promise<AgentOutput> {
  const startTime = Date.now();

  const prompt = buildAdvocatePrompt(workflowType, input);
  const targetModel = process.env['ADVOCATE_MODEL'];
  const rawResponse = await ollamaClient.generate(prompt, targetModel);

  if (rawResponse === null) {
    return buildMockOutput(workflowType, startTime);
  }

  try {
    const cleaned = rawResponse.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const result = validateAndBuildArgument(parsed);

    return {
      role: 'advocate',
      workflow_type: workflowType,
      input_hash: '',
      result,
      processing_time_ms: Date.now() - startTime,
      model: targetModel || OLLAMA_MODEL,
      is_mock: false,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Advocate] Failed to parse response: ${msg}`);
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
    role: 'advocate',
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
