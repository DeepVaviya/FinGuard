// ─────────────────────────────────────────────────────────────
// audit.types.ts — Discriminated union audit trail events
// ─────────────────────────────────────────────────────────────

import type { AgentRole, ConfidenceScore } from './agent.types.js';
import type { EscalationReason, Verdict } from './decision.types.js';
import type { WorkflowType } from './workflow.types.js';

/**
 * Discriminated union of audit events.
 * Each variant carries only the payload relevant to its event type.
 * Discriminant field: 'type'
 */
export type AuditEventType =
  | {
      readonly type: 'workflow_started';
      readonly workflow_type: WorkflowType;
      readonly input_hash: string;
    }
  | {
      readonly type: 'rule_engine_triggered';
      readonly rule_name: string;
      readonly forced_verdict: Verdict;
      readonly reason: string;
    }
  | {
      readonly type: 'agent_started';
      readonly role: AgentRole;
    }
  | {
      readonly type: 'agent_completed';
      readonly role: AgentRole;
      readonly score: ConfidenceScore;
      readonly is_mock: boolean;
    }
  | {
      readonly type: 'delta_calculated';
      readonly delta: number;
      readonly threshold: number;
      readonly should_escalate: boolean;
    }
  | {
      readonly type: 'escalated';
      readonly reason: EscalationReason;
    }
  | {
      readonly type: 'decision_finalized';
      readonly verdict: Verdict;
    }
  | {
      readonly type: 'human_reviewed';
      readonly reviewer: string;
      readonly human_verdict: Verdict;
      readonly notes: string;
    };

/** A single immutable audit log entry. */
export interface AuditEntry {
  readonly id: string;
  readonly decision_id: string;
  readonly event: AuditEventType;
  readonly timestamp: string;
  readonly metadata: Record<string, unknown>;
}
