// ─────────────────────────────────────────────────────────────
// transaction.rules.ts — Hard rules for transaction monitoring
// ─────────────────────────────────────────────────────────────

import type { TransactionInput, RuleResult } from '@finguard/shared';
import { TRANSACTION_MANDATORY_HITL_INR } from '@finguard/shared';

/**
 * Run transaction monitoring rules. Returns first triggered rule.
 */
export function runTransactionRules(input: TransactionInput): RuleResult {
  // Rule: MANDATORY_HITL
  if (input.amount >= TRANSACTION_MANDATORY_HITL_INR) {
    return {
      triggered: true,
      rule_name: 'MANDATORY_HITL',
      forced_verdict: 'escalated',
      reason: `Mandatory human review required for transactions ≥ ₹10,00,000 (RBI guideline)`,
    };
  }

  // Rule: INTERNATIONAL_KYC
  if (
    input.is_international &&
    (input.sender_kyc_status !== 'complete' ||
      input.receiver_kyc_status !== 'complete')
  ) {
    return {
      triggered: true,
      rule_name: 'INTERNATIONAL_KYC',
      forced_verdict: 'escalated',
      reason: `International transaction with incomplete KYC — FEMA compliance required`,
    };
  }

  // Rule: PENDING_KYC_REJECT
  if (input.sender_kyc_status === 'pending') {
    return {
      triggered: true,
      rule_name: 'PENDING_KYC_REJECT',
      forced_verdict: 'rejected',
      reason: `Sender KYC is pending — transaction cannot be processed`,
    };
  }

  return {
    triggered: false,
    rule_name: null,
    forced_verdict: null,
    reason: null,
  };
}
