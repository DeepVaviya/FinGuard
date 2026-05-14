// ─────────────────────────────────────────────────────────────
// workflow.types.ts — Financial workflow input schemas
// ─────────────────────────────────────────────────────────────

/** The four financial workflows supported by FinGuard. */
export type WorkflowType = 'fraud' | 'loan' | 'transaction' | 'investment';

/** Fraud detection input — Indian financial context. */
export interface FraudInput {
  readonly transaction_id: string;
  /** Amount in INR */
  readonly amount: number;
  readonly merchant: string;
  readonly location: string;
  /** ISO 8601 timestamp */
  readonly timestamp: string;
  readonly user_id: string;
  readonly device_ip: string;
  readonly is_foreign: boolean;
  /** Hour of day, 0–23 */
  readonly hour_of_day: number;
  /** Average transaction amount in INR */
  readonly previous_avg_transaction: number;
}

/** Loan approval input — Indian banking context. */
export interface LoanInput {
  readonly application_id: string;
  readonly applicant_name: string;
  /** Monthly income in INR */
  readonly monthly_income: number;
  /** CIBIL score 300–900 */
  readonly cibil_score: number;
  /** Requested loan amount in INR */
  readonly loan_amount: number;
  readonly loan_tenure_months: number;
  /** Existing EMI obligations in INR/month */
  readonly existing_emis: number;
  readonly employer_type: 'salaried' | 'self-employed' | 'business';
  /** Months with current employer */
  readonly employer_age_months: number;
  readonly loan_applications_last_6mo: number;
}

/** High-value transaction monitoring input. */
export interface TransactionInput {
  readonly transaction_id: string;
  readonly sender_account: string;
  readonly receiver_account: string;
  /** Amount in INR */
  readonly amount: number;
  readonly currency: 'INR' | 'USD' | 'EUR';
  readonly transaction_type: 'NEFT' | 'RTGS' | 'IMPS' | 'wire';
  readonly is_international: boolean;
  readonly sender_kyc_status: 'complete' | 'partial' | 'pending';
  readonly receiver_kyc_status: 'complete' | 'partial' | 'pending';
  readonly transaction_note: string;
}

/** Investment risk assessment input. */
export interface InvestmentInput {
  readonly portfolio_id: string;
  readonly investor_id: string;
  readonly risk_profile: 'conservative' | 'moderate' | 'aggressive';
  /** Total portfolio value in INR */
  readonly total_value: number;
  /** Percentage allocation 0–100 */
  readonly equity_percent: number;
  readonly debt_percent: number;
  readonly crypto_percent: number;
  readonly gold_percent: number;
  readonly expected_return_percent: number;
  /** Market volatility index 0–100 */
  readonly market_volatility_index: number;
}

/** Discriminated union of all workflow inputs. */
export type WorkflowInput =
  | FraudInput
  | LoanInput
  | TransactionInput
  | InvestmentInput;
