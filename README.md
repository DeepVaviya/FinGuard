# FinGuard

**Adversarial Consensus Engine for Financial Decision-Making**

FinGuard is an AI-powered financial risk assessment platform that uses an adversarial debate architecture to produce high-confidence decisions. Two AI agents argue opposing sides of every financial case — their disagreement *is* the risk signal.

---

## How It Works

```
Input → Rule Engine (hard rules fire instantly, skip AI)
         │
         ▼ (no rule fired)
   ┌─────────────┐     ┌──────────────────┐
   │  Advocate    │     │   Challenger      │
   │  (argues FOR │     │   (argues AGAINST │
   │   approval)  │     │    approval)      │
   └──────┬───────┘     └────────┬──────────┘
          │    run in parallel   │
          └──────────┬───────────┘
                     ▼
          Confidence Delta Calculator
                     │
          ┌──────────┴──────────┐
          │                     │
     delta > 0.4           delta ≤ 0.4
          │                     │
          ▼                     ▼
   Human-in-the-Loop     Arbitrator Agent
   (mandatory review)    (final decision)
```

### Core Innovation

Traditional AI systems produce a single opinion. FinGuard runs **two adversarial agents in parallel** that never share state. The confidence delta between them quantifies uncertainty — high disagreement automatically escalates to human review, eliminating blind trust in AI outputs.

---

## Financial Workflows

| Workflow | Description | Key Data Points |
|----------|-------------|-----------------|
| **Fraud Detection** | Flag suspicious transactions | Amount, merchant, location, time-of-day, foreign flag |
| **Loan Approval** | Assess creditworthiness | CIBIL score, income, debt ratio, employment stability |
| **Transaction Monitoring** | High-value transfer review | Amount, KYC status, NEFT/RTGS/IMPS type, international flag |
| **Investment Risk** | Portfolio risk assessment | Asset allocation, risk profile, market volatility index |

All workflows use **Indian financial context** — INR amounts, CIBIL scores, RBI guidelines, Indian merchants and cities.

---

## Architecture

```
finguard/                          ← pnpm monorepo (no Turborepo)
├── packages/
│   └── shared/                    ← Types, interfaces, constants
│       └── src/
│           ├── types/             ← agent, workflow, decision, audit, api
│           └── constants/         ← thresholds, agent config
├── apps/
│   └── server/                    ← Core engine + AI client
│       └── src/
│           ├── ai/               ← Ollama client, prompt builders
│           ├── engine/           ← Consensus engine, agents, delta calc
│           └── rule-engine/      ← Hard financial rules per workflow
└── data/                          ← Sample datasets (Indian financial)
```

### Team Ownership

| Member | Scope |
|--------|-------|
| **Member 1** (Tech Lead) | Monorepo, shared types, Ollama client, consensus engine, rule engine, sample data |
| **Member 2** | Express API routes, Supabase persistence |
| **Member 3** | Frontend dashboard |
| **Member 4** | Demo scripts and integration tests |

---

## Tech Stack

- **Runtime:** Node.js ≥ 18
- **Language:** TypeScript 5.4+ (strict mode, zero `any`)
- **Package Manager:** pnpm ≥ 8 with workspaces
- **AI Model:** Ollama + Mistral 7B (local inference)
- **Type Safety:** Branded types, discriminated unions, explicit return types everywhere

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8

```bash
# Install pnpm if needed
npm install -g pnpm
```

### Setup

```bash
# Clone and install
git clone <repo-url> finguard
cd finguard
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your Ollama URL if not localhost
```

### Running

```bash
# Type-check all packages
pnpm typecheck

# Build all packages
pnpm build

# Run tests (once server package is built)
pnpm test

# Clean build artifacts
pnpm clean
```

### Ollama Setup (Optional)

The engine works **without Ollama** — agents return mock responses with `is_mock: true`. To enable live AI:

```bash
# Install Ollama (macOS)
brew install ollama

# Pull the model
ollama pull mistral:7b

# Start Ollama server
ollama serve
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `mistral:7b` | Model identifier |
| `OLLAMA_TIMEOUT_MS` | `30000` | Request timeout in ms |

---

## Key Concepts

### Rule Engine
Hard financial rules that fire **before** any AI agent runs. If a rule triggers, the result is returned immediately — no tokens spent, no latency added.

Example: CIBIL score below 600 → auto-reject. Transaction ≥ ₹10,00,000 → mandatory human review (RBI guideline).

### Confidence Delta
`delta = |advocate.score - challenger.score|`

- **δ > 0.4** → Agents disagree significantly → escalate to human
- **δ ≤ 0.4** → Reasonable consensus → Arbitrator makes final call
- Either agent confidence < 0.3 → also escalates

### Mock Mode
When Ollama is unavailable, all agent outputs have `is_mock: true` with neutral scores (0.5). The system remains fully functional for development and testing without a GPU.

---

## License

Private — not for redistribution.
