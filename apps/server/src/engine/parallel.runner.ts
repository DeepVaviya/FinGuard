// ─────────────────────────────────────────────────────────────
// parallel.runner.ts — Runs advocate and challenger in parallel
// ─────────────────────────────────────────────────────────────

import type {
  AgentOutput,
  WorkflowType,
  WorkflowInput,
} from '@finguard/shared';
import { toConfidenceScore, OLLAMA_MODEL } from '@finguard/shared';
import { runAdvocate } from './advocate.agent.js';
import { runChallenger } from './challenger.agent.js';

/**
 * Run advocate and challenger in parallel.
 * Uses Promise.allSettled so one failure doesn't kill the other.
 * If one fails, a mock is used. If both fail, throws Error.
 */
export async function runParallel(
  workflowType: WorkflowType,
  input: WorkflowInput
): Promise<{ advocate: AgentOutput; challenger: AgentOutput }> {
  const startTime = Date.now();
  console.log(`[ParallelRunner] Starting advocate + challenger for "${workflowType}"`);

  const [advocateResult, challengerResult] = await Promise.allSettled([
    runAdvocate(workflowType, input),
    runChallenger(workflowType, input),
  ]);

  // If both rejected at the Promise level, throw
  if (
    advocateResult.status === 'rejected' &&
    challengerResult.status === 'rejected'
  ) {
    throw new Error(
      'EngineError: Both agents failed. ' +
        `Advocate: ${String(advocateResult.reason)}. ` +
        `Challenger: ${String(challengerResult.reason)}.`
    );
  }

  const advocate =
    advocateResult.status === 'fulfilled'
      ? advocateResult.value
      : (() => {
          console.warn(`[ParallelRunner] Advocate failed, using mock: ${String((advocateResult as PromiseRejectedResult).reason)}`);
          return buildMockAgent('advocate', workflowType);
        })();

  const challenger =
    challengerResult.status === 'fulfilled'
      ? challengerResult.value
      : (() => {
          console.warn(`[ParallelRunner] Challenger failed, using mock: ${String((challengerResult as PromiseRejectedResult).reason)}`);
          return buildMockAgent('challenger', workflowType);
        })();

  const durationMs = Date.now() - startTime;
  console.log(`[ParallelRunner] Completed in ${durationMs}ms`);

  return { advocate, challenger };
}

function buildMockAgent(
  role: 'advocate' | 'challenger',
  workflowType: WorkflowType
): AgentOutput {
  return {
    role,
    workflow_type: workflowType,
    input_hash: '',
    result: {
      decision: 'escalate',
      score: toConfidenceScore(0.5),
      arguments: [`Mock — ${role} agent failed at Promise level`],
      risk_factors: ['Agent execution failure'],
      confidence: toConfidenceScore(0.5),
    },
    processing_time_ms: 0,
    model: OLLAMA_MODEL,
    is_mock: true,
  };
}
