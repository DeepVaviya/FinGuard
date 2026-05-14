// ─────────────────────────────────────────────────────────────
// investment.rules.ts — Hard rules for investment risk assessment
// ─────────────────────────────────────────────────────────────

import type { InvestmentInput, RuleResult } from '@finguard/shared';
import {
  INVESTMENT_MAX_CRYPTO_CONSERVATIVE,
  INVESTMENT_HIGH_VOLATILITY_INDEX,
} from '@finguard/shared';

/**
 * Run investment risk assessment rules. Returns first triggered rule.
 */
export function runInvestmentRules(input: InvestmentInput): RuleResult {
  // Rule: PORTFOLIO_SUM
  const total =
    input.equity_percent +
    input.debt_percent +
    input.crypto_percent +
    input.gold_percent;

  if (total !== 100) {
    return {
      triggered: true,
      rule_name: 'PORTFOLIO_SUM',
      forced_verdict: 'rejected',
      reason: `Portfolio allocation sums to ${total}% — must equal exactly 100%`,
    };
  }

  // Rule: CRYPTO_CONSERVATIVE
  if (
    input.crypto_percent > INVESTMENT_MAX_CRYPTO_CONSERVATIVE &&
    input.risk_profile === 'conservative'
  ) {
    return {
      triggered: true,
      rule_name: 'CRYPTO_CONSERVATIVE',
      forced_verdict: 'escalated',
      reason: `${input.crypto_percent}% crypto allocation is excessive for a conservative risk profile`,
    };
  }

  // Rule: HIGH_VOLATILITY_CONSERVATIVE
  if (
    input.market_volatility_index > INVESTMENT_HIGH_VOLATILITY_INDEX &&
    input.risk_profile === 'conservative'
  ) {
    return {
      triggered: true,
      rule_name: 'HIGH_VOLATILITY_CONSERVATIVE',
      forced_verdict: 'escalated',
      reason: `Market volatility index ${input.market_volatility_index} is dangerously high for a conservative investor`,
    };
  }

  return {
    triggered: false,
    rule_name: null,
    forced_verdict: null,
    reason: null,
  };
}
