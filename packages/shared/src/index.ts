// ─────────────────────────────────────────────────────────────
// index.ts — Barrel export for @finguard/shared
// Other members import ONLY from '@finguard/shared', never deep paths.
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

export type {
  AgentRole,
  ConfidenceScore,
  AgentArgument,
  AgentOutput,
} from './types/agent.types.js';

export { toConfidenceScore } from './types/agent.types.js';

export * from './types/dynamic.types.js';

export type {
  WorkflowType,
  FraudInput,
  LoanInput,
  TransactionInput,
  InvestmentInput,
  WorkflowInput,
} from './types/workflow.types.js';

export type {
  Verdict,
  EscalationReason,
  RuleResult,
  ConfidenceDelta,
  ConsensusResult,
  DecisionLog,
} from './types/decision.types.js';

export type {
  AuditEventType,
  AuditEntry,
} from './types/audit.types.js';

export type {
  ApiResponse,
  ApiError,
  RunWorkflowRequest,
  RunWorkflowResponse,
  GetDecisionsRequest,
  GetDecisionsResponse,
  PendingReviewItem,
  SubmitHumanReviewRequest,
  SubmitHumanReviewResponse,
} from './types/api.types.js';

// ── Constants ────────────────────────────────────────────────

export {
  HITL_DELTA_THRESHOLD,
  MIN_CONFIDENCE_THRESHOLD,
  HIGH_RISK_SCORE,
  FRAUD_HIGH_AMOUNT_INR,
  FRAUD_MULTIPLIER_THRESHOLD,
  FRAUD_LATE_NIGHT_HOUR_END,
  FRAUD_LATE_NIGHT_AMOUNT_THRESHOLD,
  LOAN_MIN_CIBIL,
  LOAN_MAX_DEBT_RATIO,
  LOAN_MAX_RECENT_APPLICATIONS,
  LOAN_MIN_EMPLOYER_AGE_MONTHS,
  LOAN_MAX_INCOME_MULTIPLIER,
  TRANSACTION_MANDATORY_HITL_INR,
  TRANSACTION_INTERNATIONAL_THRESHOLD_INR,
  INVESTMENT_MAX_CRYPTO_CONSERVATIVE,
  INVESTMENT_HIGH_VOLATILITY_INDEX,
} from './constants/thresholds.js';

export {
  OLLAMA_MODEL,
  OLLAMA_BASE_URL,
  OLLAMA_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_DELAYS_MS,
  AGENT_SYSTEM_PROMPTS,
} from './constants/agent.constants.js';
