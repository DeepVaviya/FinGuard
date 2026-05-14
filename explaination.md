# FinGuard Project Explanation

FinGuard is an **Adversarial Consensus Engine for Financial Decision-Making**. It is an AI-powered financial risk assessment platform designed to eliminate blind trust in single LLM outputs by employing a multi-agent debate architecture. For any given decision (e.g., loan approval or fraud detection), two agents argue opposing sides, and a mathematically calculated disagreement score determines if a human needs to intervene.

---

## 1. Project Structure

The project is structured as a **pnpm monorepo** divided into three main logical parts:

*   **`packages/shared/`**: Contains common definitions used across both frontend and backend.
    *   Shared TypeScript discriminated unions, interfaces, and types representing workflows, AI outputs, and decisions.
    *   Hardcoded configuration constants (thresholds, AI model variables).
*   **`apps/server/`**: The core AI Engine and API Backend.
    *   Built with Node.js and Express.
    *   Connects to an external local LLM (Ollama).
    *   Connects to Supabase for data persistence.
*   **`apps/web/`**: The Frontend Dashboard.
    *   Built with Next.js 15, React 18, and Tailwind CSS.
    *   Displays aggregated Key Performance Indicators (KPIs) and recent decision feeds in a beautiful interface.
*   **`data/`**: Contains sample JSON payload datasets with Indian financial contexts to perform testing (e.g., CIBIL scores, RUPEE values).

---

## 2. Core Business Flow (Adversarial Consensus logic)

When a financial payload is submitted for evaluation, the system executes the following deterministic flow within `consensus.engine.ts`:

### Step 1. Input Processing
A client sends a `POST` request to the backend with payload data tailored to a specific **workflow** (fraud, loan, transaction, or investment). The request hits `/api/workflow/run`.

### Step 2. Rule Engine (Hard Constraints)
Before burning any LLM tokens, the payload passes through the **Rule Engine**. This validates hard constraints immediately.
*   *Example:* If a CIBIL score is under 600, automatically 'Reject'.
*   If a rule triggers, the flow terminates, returning the decision, saving it to Supabase immediately.

### Step 3. Parallel Agents (Debate Phase)
If no hard rules are violated, two identical Local LLM (Mistral 7B via Ollama) agents analyze the same case concurrently:
*   **The Advocate:** Strictly instructed to argue **FOR** approval.
*   **The Challenger:** Strictly instructed to argue **AGAINST** approval.
Both yield arguments and a confidence score.

### Step 4. Confidence Delta Calculation
The system calculates a `Confidence Delta` taking the absolute difference between the Advocate's and Challenger's scores: `|advocate.score - challenger.score|`.

### Step 5. Arbitrator vs HitL Escalation
*   **Escalation Threshold (High Delta > 0.4):** The AI agents fundamentally disagree. The system considers this too risky and forces **Human-in-the-Loop (HitL)**, throwing an `"escalated"` status.
*   **Arbitration (Low Delta ≤ 0.4):** A consensus is forming. The system activates a third agent, **The Arbitrator**, which analyzes the arguments produced by the first two, forming a final reasoned response inside a single JSON verdict.

### Step 6. Persistence & Response
The final status, the confidence delta, and all the arguments generated are structured into a `DecisionLog` and inserted as a new row into the **Supabase** PostgreSQL database. The backend ultimately returns a `201 Created` with the JSON result back to the frontend.

---

## 3. Storage and APIs

The data is saved into **Supabase** using a centralized enum-enabled PostgreSQL schema structure (`schema.sql`). 

The standard exposed application API routes are:
| Route | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Validates if the local Express service is operational. |
| `/api/workflow/run` | POST | Triggers the consensus engine pipeline given a specific payload. |
| `/api/decisions` | GET | Extracts historic and parsed `DecisionLog`s (used by frontend table). |
| `/api/decisions/:id` | GET | Extracts details around an individual decision record. |
| `/api/review/` | GET/POST | Dedicated routes for the Human-in-the-Loop feature (requires an audit footprint). |

The Frontend Dashboard uses standard `fetch()` API calls against these routes.

---

## 4. How To Run Everything

### Prerequisites
*   **Node.js:** version 18.0.0 or higher.
*   **pnpm:** version 8.0.0 or higher.
*   **Ollama (optional, required for actual AI inference):**
    Ensure it is installed from [ollama.com](https://ollama.com/).
    Pull the core model: `ollama pull mistral:7b`.

### Step 1: Install Dependencies
Open your terminal in the root directory:
```bash
# Installs packages intelligently using pnpm workspaces
pnpm install
```

### Step 2: Environment Variables
Duplicate the `.env.example` file and rename it to `.env`:
```bash
cp .env.example .env
```
Ensure that configurations are correct (Supabase project URLs, API keys, and Ollama endpoint).

### Step 3: Local Supabase Database Setup
Ensure your Supabase project contains the `decision_logs` table. You can run the raw SQL from `apps/server/src/db/schema.sql` inside the Supabase query editor.

### Step 4: Run the Backend Server
```bash
# Will spawn the Express server over port 4000
pnpm dev:server
```
Alternatively, build and test:
```bash
# Type-checks workspaces
pnpm typecheck
# Compiles TS to JS
pnpm build
```

### Step 5: Run the Frontend Application
Open a separate terminal window and execute:
```bash
cd apps/web
# Start Next.js development workflow on default port 3000
pnpm dev
```

### Step 6: Test Workflows (Optional)
Once all sub-services run, either submit test datasets to the `POST /api/workflow/run` endpoint using tools like cURL/Postman, or use built-in tests:
```bash
pnpm test
```
This triggers sample workflows natively mapped in the application codebase. Look under `apps/web` on `http://localhost:3000` to review the rendered decisions!
