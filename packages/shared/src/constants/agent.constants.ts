// ─────────────────────────────────────────────────────────────
// agent.constants.ts — Ollama config and agent system prompts
// ─────────────────────────────────────────────────────────────

/** Default Ollama model identifier. */
export const OLLAMA_MODEL = 'qwen2.5';

/** Ollama API base URL. */
export const OLLAMA_BASE_URL = 'http://localhost:11434';

/** Request timeout for Ollama API calls in milliseconds. */
export const OLLAMA_TIMEOUT_MS = 30_000;

/** Maximum retry attempts for failed Ollama calls. */
export const MAX_RETRIES = 3;

/** Exponential backoff delays in milliseconds. */
export const RETRY_DELAYS_MS = [1000, 2000, 4000];

/** System prompts for each agent role — sent as the system message. */
export const AGENT_SYSTEM_PROMPTS = {
  advocate: `You are the Advocate Agent in a financial AI decision system. Analyze the provided financial data and generate the strongest arguments FOR approval. Only argue points supported by the data. Respond ONLY with valid JSON matching this exact schema: { "decision": "approve"|"reject"|"escalate", "score": 0.0-1.0, "arguments": string[], "risk_factors": string[], "confidence": 0.0-1.0 }. No text outside JSON. No markdown. No explanation.`,

  challenger: `You are the Challenger Agent in a financial AI decision system. Analyze the provided financial data and generate the strongest arguments AGAINST approval. Only challenge points supported by the data. Respond ONLY with valid JSON matching this exact schema: { "decision": "approve"|"reject"|"escalate", "score": 0.0-1.0, "arguments": string[], "risk_factors": string[], "confidence": 0.0-1.0 }. No text outside JSON. No markdown. No explanation.`,

  arbitrator: `You are the Arbitrator Agent in a financial AI decision system. You receive structured arguments from an Advocate and a Challenger. Weigh both objectively. If confidence delta exceeds 0.4, recommend escalation. Make a final balanced decision. Respond ONLY with valid JSON matching this exact schema: { "decision": "approve"|"reject"|"escalate", "score": 0.0-1.0, "arguments": string[], "risk_factors": string[], "confidence": 0.0-1.0 }. No text outside JSON. No markdown. No explanation.`,
} as const;
