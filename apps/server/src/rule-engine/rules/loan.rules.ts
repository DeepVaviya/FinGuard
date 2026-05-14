// ─────────────────────────────────────────────────────────────
// loan.rules.ts — Hard rules for loan approval
// ─────────────────────────────────────────────────────────────

import type { LoanInput, RuleResult } from '@finguard/shared';
import {
  LOAN_MIN_CIBIL,
  LOAN_MAX_DEBT_RATIO,
  LOAN_MAX_RECENT_APPLICATIONS,
  LOAN_MIN_EMPLOYER_AGE_MONTHS,
  LOAN_MAX_INCOME_MULTIPLIER,
} from '@finguard/shared';

/**
 * Run loan approval rules. Returns first triggered rule.
 */
export function runLoanRules(input: LoanInput): RuleResult {
  // Rule: CIBIL_MINIMUM
  if (input.cibil_score < LOAN_MIN_CIBIL) {
    return {
      triggered: true,
      rule_name: 'CIBIL_MINIMUM',
      forced_verdict: 'rejected',
      reason: `CIBIL score ${input.cibil_score} is below minimum threshold of ${LOAN_MIN_CIBIL}`,
    };
  }

  // Rule: DEBT_RATIO
  const debtRatio = input.existing_emis / input.monthly_income;
  if (debtRatio > LOAN_MAX_DEBT_RATIO) {
    return {
      triggered: true,
      rule_name: 'DEBT_RATIO',
      forced_verdict: 'escalated',
      reason: `Debt-to-income ratio ${(debtRatio * 100).toFixed(1)}% exceeds 60% threshold`,
    };
  }

  // Rule: MULTIPLE_APPLICATIONS
  if (input.loan_applications_last_6mo > LOAN_MAX_RECENT_APPLICATIONS) {
    return {
      triggered: true,
      rule_name: 'MULTIPLE_APPLICATIONS',
      forced_verdict: 'escalated',
      reason: `${input.loan_applications_last_6mo} loan applications in last 6 months — credit shopping detected`,
    };
  }

  // Rule: NEW_EMPLOYER
  if (input.employer_age_months < LOAN_MIN_EMPLOYER_AGE_MONTHS) {
    return {
      triggered: true,
      rule_name: 'NEW_EMPLOYER',
      forced_verdict: 'escalated',
      reason: `Employer only ${input.employer_age_months} months old — insufficient employment stability`,
    };
  }

  // Rule: EXCESSIVE_LOAN
  if (input.loan_amount > input.monthly_income * LOAN_MAX_INCOME_MULTIPLIER) {
    return {
      triggered: true,
      rule_name: 'EXCESSIVE_LOAN',
      forced_verdict: 'escalated',
      reason: `Loan amount ₹${input.loan_amount.toLocaleString('en-IN')} exceeds 60x monthly income of ₹${input.monthly_income.toLocaleString('en-IN')}`,
    };
  }

  return {
    triggered: false,
    rule_name: null,
    forced_verdict: null,
    reason: null,
  };
}
