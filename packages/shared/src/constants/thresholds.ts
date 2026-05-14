// ─────────────────────────────────────────────────────────────
// thresholds.ts — Financial decision thresholds
// ─────────────────────────────────────────────────────────────

/** Confidence delta above which Human-in-the-Loop is mandatory. */
export const HITL_DELTA_THRESHOLD = 0.4;

/** Minimum acceptable confidence from any agent. Below this → escalate. */
export const MIN_CONFIDENCE_THRESHOLD = 0.3;

/** Score above which a case is considered high risk. */
export const HIGH_RISK_SCORE = 0.8;

// ── Fraud Thresholds ─────────────────────────────────────────

/** INR amount threshold for high-value fraud flag. */
export const FRAUD_HIGH_AMOUNT_INR = 500_000;

/** Multiplier over avg transaction that triggers escalation. */
export const FRAUD_MULTIPLIER_THRESHOLD = 5;

/** Late-night cutoff hour (0–4 inclusive). */
export const FRAUD_LATE_NIGHT_HOUR_END = 4;

/** INR amount threshold for late-night transaction flag. */
export const FRAUD_LATE_NIGHT_AMOUNT_THRESHOLD = 100_000;

// ── Loan Thresholds ──────────────────────────────────────────

/** CIBIL score below which loan is auto-rejected. */
export const LOAN_MIN_CIBIL = 600;

/** Max ratio of existing EMIs to monthly income. */
export const LOAN_MAX_DEBT_RATIO = 0.6;

/** Max loan applications in last 6 months before escalation. */
export const LOAN_MAX_RECENT_APPLICATIONS = 3;

/** Minimum months with current employer. */
export const LOAN_MIN_EMPLOYER_AGE_MONTHS = 6;

/** Max loan amount as multiple of monthly income. */
export const LOAN_MAX_INCOME_MULTIPLIER = 60;

// ── Transaction Thresholds ───────────────────────────────────

/** INR amount at which mandatory HITL is required (RBI guideline). */
export const TRANSACTION_MANDATORY_HITL_INR = 1_000_000;

/** INR threshold for international transaction flag. */
export const TRANSACTION_INTERNATIONAL_THRESHOLD_INR = 500_000;

// ── Investment Thresholds ────────────────────────────────────

/** Max crypto allocation % for conservative risk profile. */
export const INVESTMENT_MAX_CRYPTO_CONSERVATIVE = 40;

/** Volatility index above which conservative profiles escalate. */
export const INVESTMENT_HIGH_VOLATILITY_INDEX = 80;
