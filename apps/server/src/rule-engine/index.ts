// ─────────────────────────────────────────────────────────────
// rule-engine/index.ts — Routes to workflow-specific rules
// ─────────────────────────────────────────────────────────────

import type {
  RuleResult,
  WorkflowType,
  WorkflowInput,
  FraudInput,
  LoanInput,
  TransactionInput,
  InvestmentInput,
} from '@finguard/shared';
import { runFraudRules } from './rules/fraud.rules.js';
import { runLoanRules } from './rules/loan.rules.js';
import { runTransactionRules } from './rules/transaction.rules.js';
import { runInvestmentRules } from './rules/investment.rules.js';

/** No-op rule result when no rule fires. */
const NO_RULE: RuleResult = {
  triggered: false,
  rule_name: null,
  forced_verdict: null,
  reason: null,
};

/**
 * Run the appropriate rule set for the given workflow type.
 * Returns the first triggered rule, or a no-op if none fire.
 */
export function runRules(
  workflowType: WorkflowType,
  input: WorkflowInput
): RuleResult {
  switch (workflowType) {
    case 'fraud':
      return runFraudRules(input as FraudInput);
    case 'loan':
      return runLoanRules(input as LoanInput);
    case 'transaction':
      return runTransactionRules(input as TransactionInput);
    case 'investment':
      return runInvestmentRules(input as InvestmentInput);
    default: {
      // Exhaustive check — TypeScript will error if a case is missed
      const _exhaustive: never = workflowType;
      return _exhaustive;
    }
  }
}
