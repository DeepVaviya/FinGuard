// ─────────────────────────────────────────────────────────────
// ollama.client.ts — HTTP client for Ollama API with retries
// ─────────────────────────────────────────────────────────────

import {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  OLLAMA_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_DELAYS_MS,
} from '@finguard/shared';

/** Custom error for Ollama communication failures. */
export class OllamaError extends Error {
  public readonly statusCode: number | null;
  public readonly attempt: number;

  constructor(message: string, statusCode: number | null, attempt: number) {
    super(message);
    this.name = 'OllamaError';
    this.statusCode = statusCode;
    this.attempt = attempt;
  }
}

/**
 * HTTP client for the Ollama REST API.
 * Handles retries with exponential backoff and structured logging.
 */
export class OllamaClient {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(baseUrl: string, model: string, timeoutMs: number) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Generate a completion from Ollama.
   * Retries up to MAX_RETRIES times with exponential backoff.
   * @returns The generated text, or null if all retries fail.
   */
  async generate(prompt: string, overrideModel?: string): Promise<string | null> {
    const targetModel = overrideModel || this.model;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: targetModel,
            prompt,
            stream: false,
            format: 'json',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;

        if (!response.ok) {
          console.error(
            `[Ollama] Attempt ${attempt}/${MAX_RETRIES} FAIL — HTTP ${response.status} (${durationMs}ms)`
          );
          if (attempt < MAX_RETRIES) {
            await this.sleep(RETRY_DELAYS_MS[attempt - 1] ?? 4000);
            continue;
          }
          return null;
        }

        const data = (await response.json()) as { response?: string };
        const text = data.response ?? null;

        console.log(
          `[Ollama] Attempt ${attempt}/${MAX_RETRIES} SUCCESS (${durationMs}ms)`
        );
        return text;
      } catch (error: unknown) {
        const durationMs = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        console.error(
          `[Ollama] Attempt ${attempt}/${MAX_RETRIES} FAIL — ${errorMessage} (${durationMs}ms)`
        );

        if (attempt < MAX_RETRIES) {
          await this.sleep(RETRY_DELAYS_MS[attempt - 1] ?? 4000);
        }
      }
    }

    console.error(
      `[Ollama] All ${MAX_RETRIES} retries exhausted. Returning null.`
    );
    return null;
  }

  /**
   * Check if Ollama is reachable and has models available.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5_000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/** Singleton Ollama client instance. */
export const ollamaClient = new OllamaClient(
  process.env['OLLAMA_BASE_URL'] || OLLAMA_BASE_URL,
  process.env['OLLAMA_MODEL'] || OLLAMA_MODEL,
  parseInt(process.env['OLLAMA_TIMEOUT_MS'] || '120000', 10) // Give Qwen 2 minutes to generate complex workflows
);
