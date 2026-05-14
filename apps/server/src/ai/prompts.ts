// ─────────────────────────────────────────────────────────────
// prompts.ts — Prompt builders for all three agent roles
// ─────────────────────────────────────────────────────────────

import type { AgentArgument, WorkflowType, WorkflowInput } from '@finguard/shared';
import { AGENT_SYSTEM_PROMPTS } from '@finguard/shared';

/**
 * Builds the full prompt for the Advocate Agent.
 */
export function buildAdvocatePrompt(
  workflowType: WorkflowType,
  input: WorkflowInput
): string {
  return (
    AGENT_SYSTEM_PROMPTS.advocate +
    '\n\nWorkflow Type: ' +
    workflowType +
    '\n\nInput Data:\n' +
    JSON.stringify(input, null, 2)
  );
}

/**
 * Builds the full prompt for the Challenger Agent.
 */
export function buildChallengerPrompt(
  workflowType: WorkflowType,
  input: WorkflowInput
): string {
  return (
    AGENT_SYSTEM_PROMPTS.challenger +
    '\n\nWorkflow Type: ' +
    workflowType +
    '\n\nInput Data:\n' +
    JSON.stringify(input, null, 2)
  );
}

/**
 * Builds the full prompt for the Arbitrator Agent.
 * Includes both agent outputs and the confidence delta.
 */
export function buildArbitratorPrompt(
  advocate: AgentArgument,
  challenger: AgentArgument,
  delta: number
): string {
  return (
    AGENT_SYSTEM_PROMPTS.arbitrator +
    '\n\nConfidence Delta: ' +
    delta.toFixed(4) +
    '\n\nAdvocate Analysis:\n' +
    JSON.stringify(advocate, null, 2) +
    '\n\nChallenger Analysis:\n' +
    JSON.stringify(challenger, null, 2)
  );
}
