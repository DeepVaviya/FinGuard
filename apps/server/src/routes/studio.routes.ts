import { Router, Request, Response } from 'express';
import { ollamaClient } from '../ai/ollama.client.js';

const router = Router();

const STUDIO_SYSTEM_PROMPT = `
You are a Senior Bank Architect and Compliance Logic Builder. 
Your ONLY purpose is to design strict JSON schemas for banking operations, risk assessment, lending, and anti-fraud workflows.
The user will give you a prompt. If their request is UNRELATED to finance, banking, loans, or fraud, you MUST set "is_banking_related": false and provide a rejection_reason.

If it IS related to banking, design a multi-agent workflow. 
Generate a JSON payload matching this exact schema:
{
  "is_banking_related": true,
  "workflow_id": "string",
  "workflow_name": "string",
  "description": "string",
  "required_inputs": [
    { "field_name": "string", "field_type": "number", "description": "string" }
  ],
  "nodes": [
    {
      "id": "1",
      "type": "input",
      "position": { "x": 250, "y": 50 },
      "data": { "label": "Data Input", "description": "string" }
    },
    {
      "id": "2",
      "type": "advocate",
      "position": { "x": 100, "y": 200 },
      "data": { "label": "Advocate Agent", "rules": ["Argue for X because Y"] }
    },
    {
      "id": "3",
      "type": "challenger",
      "position": { "x": 400, "y": 200 },
      "data": { "label": "Challenger Agent", "rules": ["Argue against X because Z"] }
    },
    {
      "id": "4",
      "type": "arbitrator",
      "position": { "x": 250, "y": 350 },
      "data": { "label": "Final Arbitrator" }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "animated": true },
    { "id": "e1-3", "source": "1", "target": "3", "animated": true },
    { "id": "e2-4", "source": "2", "target": "4", "animated": true },
    { "id": "e3-4", "source": "3", "target": "4", "animated": true }
  ]
}

DO NOT output any markdown. DO NOT output conversational text. ONLY raw JSON. Ensure x and y positions form a pleasing vertical flowchart.
`;

router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  try {
    const rawResponse = await ollamaClient.generate(
      STUDIO_SYSTEM_PROMPT + '\n\nUser Request:\n' + prompt
    );

    if (!rawResponse) {
      res.status(503).json({ error: 'Ollama is unavailable.' });
      return;
    }

    // Try parsing the JSON
    let parsedData;
    try {
      parsedData = JSON.parse(rawResponse);
    } catch {
      // Find JSON block if Qwen accidentally added markdown
      const match = rawResponse.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse JSON from model output');
      }
    }

    if (!parsedData.is_banking_related) {
      res.status(403).json({
        error: 'Guardrail rejected this prompt.',
        reason: parsedData.rejection_reason || 'Not related to banking/finance.',
      });
      return;
    }

    // Return the perfectly formatted workflow blueprint!
    res.status(200).json(parsedData);
  } catch (error: any) {
    console.error('[Studio API] Failed to generate workflow:', error.message);
    res.status(500).json({ error: 'Failed to generate workflow' });
  }
});

// ── NEW: Dynamic Execution Engine ────────────────────────────────
router.post('/run', async (req: Request, res: Response): Promise<void> => {
  const { workflow, inputData } = req.body;

  if (!workflow || !inputData) {
    res.status(400).json({ error: 'Missing workflow or inputData' });
    return;
  }

  try {
    const advocateNode = workflow.nodes?.find((n: any) => n.type === 'advocate');
    const challengerNode = workflow.nodes?.find((n: any) => n.type === 'challenger');

    // 1. Spawning the Meta-Orchestrator (Chief Risk Officer)
    const orchestratorPrompt = `You are the Chief Risk Officer (Orchestrator). 
    Review this workflow intent: ${workflow.workflow_name} - ${workflow.description}.
    Review this unknown, dynamic Input Data: ${JSON.stringify(inputData)}.
    Your job is NOT to make a final decision. Your job is to select the most critical risk vectors from this specific data payload, and supply strict strategic instructions to the Advocate and Challenger.
    Respond ONLY with valid JSON matching this schema: { "focus_areas": ["..."], "critical_vectors_spotted": ["..."], "strict_instructions_for_agents": "..." }`;
    
    const rawOrch = await ollamaClient.generate(
      orchestratorPrompt, 
      process.env.ORCHESTRATOR_MODEL || 'phi4'
    );
    if (!rawOrch) throw new Error('Orchestrator timed out');
    const matchOrch = rawOrch.match(/\{[\s\S]*\}/);
    const orchestratorResult = JSON.parse(matchOrch ? matchOrch[0] : rawOrch || '{}');

    // Helper to spawn a parallel agent
    const runAgent = async (agentName: string, roleInfo: any) => {
      const prompt = `You are a strict financial ${agentName} evaluating a dynamic workflow.
      Evaluate this Input Data: ${JSON.stringify(inputData)}
      Strictly obey these custom agent rules defined by the workflow creator: ${JSON.stringify(roleInfo?.data?.rules || ['Critique the data'])}.
      THE CHIEF RISK OFFICER HAS ORDAINED THIS STRICT INSTRUCTION: "${orchestratorResult.strict_instructions_for_agents}"
      You must factor the CRO's guidance into your arguments.
      Respond ONLY with valid JSON matching this exact schema:
      { "decision": "approve"|"reject"|"escalate", "score": 0.0-1.0, "arguments": ["..."], "risk_factors": ["..."], "confidence": 0.0-1.0 }`;
      
      const raw = await ollamaClient.generate(prompt);
      if (!raw) throw new Error(`${agentName} timed out or failed`);
      
      const match = raw.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : raw);
    };

    // 2. Run Advocate and Challenger exactly in PARALLEL using the CRO's brief
    const [advocateResult, challengerResult] = await Promise.all([
      runAgent('Advocate', advocateNode),
      runAgent('Challenger', challengerNode)
    ]);

    // Feed both results into the Arbitrator Judge
    const arbitratorPrompt = `You are the Arbitrator Judge. 
    The Advocate Agent evaluated the data and resulted in: ${JSON.stringify(advocateResult)}. 
    The Challenger Agent evaluated the data and resulted in: ${JSON.stringify(challengerResult)}. 
    Weigh both objectively. Make a single final decision based on their arguments.
    Respond ONLY with valid JSON matching this exact schema: { "decision": "approve"|"reject"|"escalate", "score": 0.0-1.0, "arguments": ["..."], "risk_factors": ["..."], "confidence": 0.0-1.0 }`;
    
    const rawArb = await ollamaClient.generate(arbitratorPrompt);
    if (!rawArb) throw new Error('Arbitrator timed out');
    const matchArb = rawArb.match(/\{[\s\S]*\}/);
    const arbitratorResult = JSON.parse(matchArb ? matchArb[0] : rawArb || '{}');

    // Return the completed Dynamic Consensus including Orchestrator
    res.status(200).json({
      orchestrator: orchestratorResult,
      advocate: advocateResult,
      challenger: challengerResult,
      arbitrator: arbitratorResult
    });
  } catch (error: any) {
    console.error('[Studio API Run Engine] Execution failed:', error.message);
    res.status(500).json({ error: 'Dynamic execution failed: ' + error.message });
  }
});

export default router;
