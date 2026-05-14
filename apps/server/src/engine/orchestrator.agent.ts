import { OllamaClient } from '../ai/ollama.client.js';

export interface OrchestrationBrief {
  focus_areas: string[];
  recommended_severity: 'low' | 'medium' | 'high';
  strategic_guidance: string;
}

export async function runOrchestrator(
  workflowType: string,
  input: any
): Promise<{ result: OrchestrationBrief; metadata: any }> {
  const systemPrompt = `You are the Supreme Orchestrator (Chief Risk Officer).
Your job is to read raw financial input data and provide a strategic debate brief for your sub-agents (Advocate and Challenger).
You will not make the final decision. You will direct the sub-agents on what EXACTLY to investigate and argue over.

You must reply with ONLY a strictly valid JSON object matching this schema:
{
  "focus_areas": ["area 1", "area 2"],
  "recommended_severity": "low" | "medium" | "high",
  "strategic_guidance": "Instructions for the sub-agents"
}`;

  const prompt = `Workflow Type: ${workflowType}\nInput Data: ${JSON.stringify(input, null, 2)}`;

  // Use the strongest local model available for orchestration (usually Deepseek or Llama)
  const client = new OllamaClient(process.env.OLLAMA_MODEL_CHALLENGER || 'llama3.2');

  const { json, metadata } = await client.generateJson<OrchestrationBrief>(
    systemPrompt,
    prompt
  );

  return { result: json, metadata };
}
