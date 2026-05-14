# MEMBER1_EXPORTS.md — FinGuard Foundation Contract

> **This document is the single source of truth for Members 2, 3, and 4.**
> If something is not documented here, ask Member 1 before assuming.

---

## Section 1 — How to Add @finguard/shared as a Dependency

In any workspace package (`apps/server`, `apps/web`, etc.):

```bash
# The dependency is already declared via workspace protocol
# In your package.json:
{
  "dependencies": {
    "@finguard/shared": "workspace:*"
  }
}

# Then run:
pnpm install
```

**Import everything from the barrel:**
```typescript
import type { ConsensusResult, WorkflowType, AgentOutput } from '@finguard/shared';
import { toConfidenceScore, HITL_DELTA_THRESHOLD } from '@finguard/shared';
```

**Never import from deep paths.** This will break:
```typescript
// ❌ WRONG — never do this
import type { AgentOutput } from '@finguard/shared/src/types/agent.types';
```

---

## Section 2 — Every Exported Type

### Types from `agent.types.ts`

| Type | Description |
|------|-------------|
| `AgentRole` | `'advocate' \| 'challenger' \| 'arbitrator'` — the three agent roles |
| `ConfidenceScore` | Branded number type, valid range 0.0–1.0 only |
| `AgentArgument` | Structured argument: decision, score, arguments[], risk_factors[], confidence |
| `AgentOutput` | Full agent output envelope: role, workflow_type, input_hash, result, processing_time_ms, model, is_mock |

### Types from `workflow.types.ts`

| Type | Description |
|------|-------------|
| `WorkflowType` | `'fraud' \| 'loan' \| 'transaction' \| 'investment'` |
| `FraudInput` | Fraud detection input — transaction_id, amount (INR), merchant, location, timestamp, etc. |
| `LoanInput` | Loan approval input — applicant_name, monthly_income (INR), cibil_score, loan_amount, etc. |
| `TransactionInput` | Transaction monitoring input — sender/receiver accounts, amount, KYC status, etc. |
| `InvestmentInput` | Investment risk input — portfolio allocation percentages, risk_profile, volatility index |
| `WorkflowInput` | Union of all 4 input types |

### Types from `decision.types.ts`

| Type | Description |
|------|-------------|
| `Verdict` | `'approved' \| 'rejected' \| 'escalated' \| 'pending_review'` |
| `EscalationReason` | `'high_delta' \| 'hard_rule' \| 'low_confidence' \| 'manual'` |
| `RuleResult` | Rule engine output: triggered, rule_name, forced_verdict, reason |
| `ConfidenceDelta` | Delta between advocate/challenger: advocate_score, challenger_score, delta, should_escalate |
| `ConsensusResult` | **The main data structure** — full result of a consensus round |
| `DecisionLog` | Full persisted record for Supabase — includes human review fields |

### Types from `audit.types.ts`

| Type | Description |
|------|-------------|
| `AuditEventType` | Discriminated union (8 variants): workflow_started, rule_engine_triggered, agent_started, agent_completed, delta_calculated, escalated, decision_finalized, human_reviewed |
| `AuditEntry` | Audit log entry: id, decision_id, event, timestamp, metadata |

### Types from `api.types.ts`

| Type | Description |
|------|-------------|
| `ApiResponse<T>` | Standard response envelope: success, data, error, timestamp |
| `ApiError` | Error payload: code, message, details |
| `RunWorkflowRequest` | POST body: workflow_type + input |
| `RunWorkflowResponse` | Response: decision_id + ConsensusResult |
| `GetDecisionsRequest` | Query params: workflow_type?, verdict?, limit?, offset? |
| `GetDecisionsResponse` | Paginated response: decisions[] + total |
| `PendingReviewItem` | HITL queue item: decision_id, advocate, challenger, delta, reason |
| `SubmitHumanReviewRequest` | Human review body: decision_id, human_verdict, reviewer_name, notes |
| `SubmitHumanReviewResponse` | Response: decision_id + updated_status |

### Value Exports

| Export | Description |
|--------|-------------|
| `toConfidenceScore(n)` | Validates and brands a number as ConfidenceScore. Throws RangeError if outside 0–1. |

---

## Section 3 — runConsensus()

```typescript
import { runConsensus } from './engine/consensus.engine.js';

async function runConsensus(
  workflowType: WorkflowType,
  input: WorkflowInput
): Promise<ConsensusResult>
```

### Return Shape — ConsensusResult

```typescript
{
  workflow_type: WorkflowType,         // which workflow ran
  input_hash: string,                  // SHA256 of JSON.stringify(input)
  advocate: AgentOutput | null,        // null if rule triggered
  challenger: AgentOutput | null,      // null if rule triggered
  confidence_delta: ConfidenceDelta | null, // null if rule triggered
  arbitrator: AgentOutput | null,      // null if escalated or rule triggered
  final_verdict: Verdict,              // 'approved' | 'rejected' | 'escalated'
  arbitrator_reasoning: string | null, // arbitrator's arguments joined with '; '
  hitl_required: boolean,              // true if escalated
  escalation_reason: EscalationReason | null,
  rule_engine_triggered: boolean,      // true if a hard rule fired
  rule_engine_result: RuleResult | null,
  processing_time_ms: number,          // total wall-clock time
  created_at: string                   // ISO 8601
}
```

### Errors Thrown

| Error | When |
|-------|------|
| `Error('EngineError: Both agents failed...')` | Both advocate and challenger Promise.allSettled rejected |
| `RangeError('ConfidenceScore must be...')` | Agent returned score outside 0–1 and clamp failed (shouldn't happen) |

### Execution Flow

1. SHA256 hash input
2. Run rule engine → if triggered, return immediately (no agents run)
3. Run advocate + challenger **in parallel** via Promise.allSettled
4. Calculate confidence delta
5. If delta > 0.4 OR any confidence < 0.3 → escalate, skip arbitrator
6. Run arbitrator → map decision to Verdict
7. Return full ConsensusResult

---

## Section 4 — runRules()

```typescript
import { runRules } from './rule-engine/index.js';

function runRules(
  workflowType: WorkflowType,
  input: WorkflowInput
): RuleResult
```

### Return Shape — RuleResult

```typescript
{
  triggered: boolean,           // true if a rule fired
  rule_name: string | null,     // e.g. 'CIBIL_MINIMUM', 'MANDATORY_HITL'
  forced_verdict: Verdict | null, // 'rejected' or 'escalated'
  reason: string | null         // human-readable, interpolates actual values
}
```

### All Rules by Workflow

**Loan Rules** (checked in order, first match wins):
| Rule | Condition | Verdict |
|------|-----------|---------|
| CIBIL_MINIMUM | cibil_score < 600 | rejected |
| DEBT_RATIO | existing_emis / monthly_income > 0.6 | escalated |
| MULTIPLE_APPLICATIONS | loan_applications_last_6mo > 3 | escalated |
| NEW_EMPLOYER | employer_age_months < 6 | escalated |
| EXCESSIVE_LOAN | loan_amount > monthly_income × 60 | escalated |

**Fraud Rules:**
| Rule | Condition | Verdict |
|------|-----------|---------|
| FOREIGN_HIGH_VALUE | amount > ₹5,00,000 AND is_foreign | escalated |
| AMOUNT_SPIKE | amount > previous_avg × 5 | escalated |
| LATE_NIGHT_LARGE | hour 0–4 AND amount > ₹1,00,000 | escalated |

**Transaction Rules:**
| Rule | Condition | Verdict |
|------|-----------|---------|
| MANDATORY_HITL | amount ≥ ₹10,00,000 | escalated |
| INTERNATIONAL_KYC | is_international AND any KYC not complete | escalated |
| PENDING_KYC_REJECT | sender_kyc_status = 'pending' | rejected |

**Investment Rules:**
| Rule | Condition | Verdict |
|------|-----------|---------|
| PORTFOLIO_SUM | equity + debt + crypto + gold ≠ 100 | rejected |
| CRYPTO_CONSERVATIVE | crypto > 40% AND risk_profile = 'conservative' | escalated |
| HIGH_VOLATILITY_CONSERVATIVE | volatility_index > 80 AND risk_profile = 'conservative' | escalated |

---

## Section 5 — All Threshold Constants

```typescript
// Core thresholds
HITL_DELTA_THRESHOLD          = 0.4      // delta above this → Human-in-the-Loop
MIN_CONFIDENCE_THRESHOLD      = 0.3      // confidence below this → escalate
HIGH_RISK_SCORE               = 0.8      // score above this → high risk flag

// Fraud
FRAUD_HIGH_AMOUNT_INR         = 500_000  // ₹5,00,000
FRAUD_MULTIPLIER_THRESHOLD    = 5        // 5x average
FRAUD_LATE_NIGHT_HOUR_END     = 4        // hours 0–4
FRAUD_LATE_NIGHT_AMOUNT_THRESHOLD = 100_000  // ₹1,00,000

// Loan
LOAN_MIN_CIBIL                = 600
LOAN_MAX_DEBT_RATIO           = 0.6      // 60%
LOAN_MAX_RECENT_APPLICATIONS  = 3
LOAN_MIN_EMPLOYER_AGE_MONTHS  = 6
LOAN_MAX_INCOME_MULTIPLIER    = 60       // 60x monthly income

// Transaction
TRANSACTION_MANDATORY_HITL_INR = 1_000_000  // ₹10,00,000
TRANSACTION_INTERNATIONAL_THRESHOLD_INR = 500_000  // ₹5,00,000

// Investment
INVESTMENT_MAX_CRYPTO_CONSERVATIVE = 40  // 40%
INVESTMENT_HIGH_VOLATILITY_INDEX   = 80
```

---

## Section 6 — How to Run apps/server Locally

### With Ollama (live AI)

```bash
# 1. Install and start Ollama
brew install ollama
ollama pull mistral:7b
ollama serve

# 2. Install dependencies
pnpm install

# 3. Build shared package first
pnpm --filter @finguard/shared build

# 4. Run tests
cd apps/server
npx tsx src/test.ts
```

### Without Ollama (mock mode)

```bash
# Same steps, just skip Ollama install/serve
pnpm install
pnpm --filter @finguard/shared build
cd apps/server
npx tsx src/test.ts

# All agents will return mock responses with is_mock: true
# The system is fully functional — rules fire, consensus runs, deltas calculate
```

### Build all packages

```bash
pnpm build      # builds shared then server
pnpm typecheck  # type-checks everything
```

---

## Section 7 — What is_mock: true Means

Every `AgentOutput` has an `is_mock: boolean` field.

**`is_mock: true`** means:
- Ollama was unreachable or returned unparseable JSON
- The agent returned a **neutral mock response**: decision='escalate', score=0.5, confidence=0.5
- Arguments will be `['Mock response — Ollama unavailable']`
- The consensus engine still completed — rules, deltas, and arbitration all ran normally
- **This is expected during development without a GPU**

**`is_mock: false`** means:
- Ollama returned valid JSON
- The response was parsed, validated, and scores clamped to 0–1
- This is a real AI-generated analysis

**Check Ollama availability at runtime:**
```typescript
import { ollamaClient } from './ai/ollama.client.js';
const isLive = await ollamaClient.isAvailable(); // true = live, false = mock mode
```

---

## Section 8 — Instructions for Member 2 (API Routes + Supabase)

### Route → Type Mapping

| Route | Method | Request Type | Response Type |
|-------|--------|-------------|---------------|
| `/api/workflow/run` | POST | `RunWorkflowRequest` | `ApiResponse<RunWorkflowResponse>` |
| `/api/decisions` | GET | `GetDecisionsRequest` (query params) | `ApiResponse<GetDecisionsResponse>` |
| `/api/decisions/:id` | GET | — | `ApiResponse<DecisionLog>` |
| `/api/review/pending` | GET | — | `ApiResponse<PendingReviewItem[]>` |
| `/api/review/submit` | POST | `SubmitHumanReviewRequest` | `ApiResponse<SubmitHumanReviewResponse>` |

### How to Call runConsensus

```typescript
import { runConsensus } from '../engine/consensus.engine.js';
import type { RunWorkflowRequest, ConsensusResult } from '@finguard/shared';

// In your Express route handler:
app.post('/api/workflow/run', async (req, res) => {
  const { workflow_type, input } = req.body as RunWorkflowRequest;
  
  const result: ConsensusResult = await runConsensus(workflow_type, input);
  
  // Generate decision_id (UUID), persist to Supabase, return response
  // Member 1 does NOT handle persistence — that's your job
});
```

### Supabase Persistence

Map `ConsensusResult` to `DecisionLog` for storage:
- `id` → UUID you generate
- `workflow_type` → from result
- `input_data` → the original input object
- `advocate_arguments` → result.advocate?.result ?? null
- `challenger_arguments` → result.challenger?.result ?? null
- `confidence_delta` → result.confidence_delta?.delta ?? null
- `arbitrator_decision` → result.arbitrator?.result.decision ?? null
- `arbitrator_reasoning` → result.arbitrator_reasoning
- `final_status` → result.final_verdict
- `hitl_required` → result.hitl_required
- `human_decision`, `human_reviewer`, `human_notes` → null initially
- `created_at` → result.created_at
- `updated_at` → result.created_at

### Wrap all responses in ApiResponse<T>

```typescript
const response: ApiResponse<RunWorkflowResponse> = {
  success: true,
  data: { decision_id: id, result },
  error: null,
  timestamp: new Date().toISOString(),
};
```

---

## Section 9 — Instructions for Member 3 (Frontend)

### Types for UI Components

| Component | Types to Import |
|-----------|----------------|
| Workflow form | `WorkflowType`, `FraudInput`, `LoanInput`, `TransactionInput`, `InvestmentInput` |
| Result display | `ConsensusResult`, `Verdict`, `AgentOutput`, `AgentArgument` |
| Debate panel | `AgentOutput` (advocate + challenger), `ConfidenceDelta` |
| Review queue | `PendingReviewItem`, `EscalationReason` |
| Review form | `SubmitHumanReviewRequest` |
| Decision history | `DecisionLog`, `GetDecisionsResponse` |

### What ConsensusResult Looks Like (Rendered)

```
┌─────────────────────────────────────────────┐
│ Workflow: loan          Verdict: APPROVED    │
│ Processing: 4523ms      HITL: No            │
├─────────────────────────────────────────────┤
│ ADVOCATE (score: 0.82)  │ CHALLENGER (0.61)  │
│ ✓ Strong CIBIL score    │ ✗ High loan amount │
│ ✓ Low debt ratio        │ ✗ Self-employed    │
│ ✓ Stable employment     │                    │
├─────────────────────────────────────────────┤
│ ARBITRATOR: approve (confidence: 0.78)       │
│ Reasoning: Strong financials outweigh risks  │
├─────────────────────────────────────────────┤
│ Delta: 0.21 (below 0.4 threshold)           │
│ Rule Engine: No rules triggered              │
│ Mock Mode: false                             │
└─────────────────────────────────────────────┘
```

**Key rendering logic:**
- If `rule_engine_triggered === true` → show rule banner, hide agent panels
- If `hitl_required === true` → show "Awaiting Human Review" badge
- If `is_mock === true` on any agent → show "⚠ Mock Mode" warning
- Color code verdict: approved=green, rejected=red, escalated=amber, pending_review=blue

---

## Section 10 — Instructions for Member 4 (Demo + Sample Data)

### Sample Data Location

```
data/
├── fraud_samples.json       — 5 records
├── loan_samples.json        — 5 records
├── transaction_samples.json — 5 records
└── investment_samples.json  — 5 records
```

### Dataset Formats

**fraud_samples.json** — Each record:
```typescript
{ transaction_id, amount (INR), merchant, location, timestamp (ISO8601),
  user_id, device_ip, is_foreign, hour_of_day (0-23), previous_avg_transaction (INR) }
```
Records: #1 triggers FOREIGN_HIGH_VALUE, #2 triggers AMOUNT_SPIKE, #3-4 normal, #5 borderline

**loan_samples.json** — Each record:
```typescript
{ application_id, applicant_name, monthly_income (INR), cibil_score (300-900),
  loan_amount (INR), loan_tenure_months, existing_emis (INR), employer_type,
  employer_age_months, loan_applications_last_6mo }
```
Records: #1 triggers CIBIL_MINIMUM (auto-reject), #2 triggers DEBT_RATIO, #3-5 agent-evaluated

**transaction_samples.json** — Each record:
```typescript
{ transaction_id, sender_account, receiver_account, amount (INR), currency,
  transaction_type ('NEFT'|'RTGS'|'IMPS'|'wire'), is_international,
  sender_kyc_status, receiver_kyc_status, transaction_note }
```
Records: #1 triggers MANDATORY_HITL (₹15L), #2 triggers PENDING_KYC_REJECT, #3-5 agent-evaluated

**investment_samples.json** — Each record:
```typescript
{ portfolio_id, investor_id, risk_profile, total_value (INR),
  equity_percent, debt_percent, crypto_percent, gold_percent,
  expected_return_percent, market_volatility_index (0-100) }
```
Records: #1 triggers PORTFOLIO_SUM (sums to 105%), #2 triggers CRYPTO_CONSERVATIVE, #3-5 agent-evaluated

### How to Load and Use

```typescript
import { readFileSync } from 'node:fs';
import type { LoanInput } from '@finguard/shared';

const loanSamples = JSON.parse(
  readFileSync('../../data/loan_samples.json', 'utf-8')
) as LoanInput[];

// Use sample[0] for auto-reject demo
// Use sample[2] for full consensus flow demo
```

### Seeding Supabase

After Member 2 has the DB schema ready, run each sample through the API:

```typescript
for (const sample of loanSamples) {
  const response = await fetch('http://localhost:3000/api/workflow/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow_type: 'loan', input: sample }),
  });
  const result = await response.json();
  console.log(result);
}
```

This will populate the decisions table with a mix of rejected, escalated, and approved/agent-evaluated results.
