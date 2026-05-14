// ─────────────────────────────────────────────────────────────
// fraud.rules.ts — Hard rules for fraud detection
// ─────────────────────────────────────────────────────────────

import type { FraudInput, RuleResult } from '@finguard/shared';
import {
  FRAUD_HIGH_AMOUNT_INR,
  FRAUD_MULTIPLIER_THRESHOLD,
  FRAUD_LATE_NIGHT_HOUR_END,
  FRAUD_LATE_NIGHT_AMOUNT_THRESHOLD,
} from '@finguard/shared';

/**
 * Run fraud detection rules. Returns first triggered rule.
 */
export function runFraudRules(input: FraudInput): RuleResult {
  // Rule: FOREIGN_HIGH_VALUE
  if (input.amount > FRAUD_HIGH_AMOUNT_INR && input.is_foreign) {
    return {
      triggered: true,
      rule_name: 'FOREIGN_HIGH_VALUE',
      forced_verdict: 'escalated',
      reason: `High-value foreign transaction of ₹${input.amount.toLocaleString('en-IN')} flagged for review`,
    };
  }

  // Rule: AMOUNT_SPIKE
  if (input.amount > input.previous_avg_transaction * FRAUD_MULTIPLIER_THRESHOLD) {
    return {
      triggered: true,
      rule_name: 'AMOUNT_SPIKE',
      forced_verdict: 'escalated',
      reason: `Amount ₹${input.amount.toLocaleString('en-IN')} is ${(input.amount / input.previous_avg_transaction).toFixed(1)}x above user average of ₹${input.previous_avg_transaction.toLocaleString('en-IN')}`,
    };
  }

  // Rule: LATE_NIGHT_LARGE
  if (
    input.hour_of_day >= 0 &&
    input.hour_of_day <= FRAUD_LATE_NIGHT_HOUR_END &&
    input.amount > FRAUD_LATE_NIGHT_AMOUNT_THRESHOLD
  ) {
    return {
      triggered: true,
      rule_name: 'LATE_NIGHT_LARGE',
      forced_verdict: 'escalated',
      reason: `Large transaction of ₹${input.amount.toLocaleString('en-IN')} at ${input.hour_of_day}:00 — suspicious hours`,
    };
  }

  return {
    triggered: false,
    rule_name: null,
    forced_verdict: null,
    reason: null,
  };
}
