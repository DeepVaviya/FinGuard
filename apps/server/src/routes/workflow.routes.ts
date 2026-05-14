// ─────────────────────────────────────────────────────────────
// workflow.routes.ts — POST /api/workflow/run
// Triggers the Adversarial Consensus Engine, persists the
// DecisionLog to Supabase, and returns the result.
// ─────────────────────────────────────────────────────────────

import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import type {
  ApiResponse,
  RunWorkflowRequest,
  RunWorkflowResponse,
  WorkflowType,
} from '@finguard/shared';

import { runConsensus } from '../engine/consensus.engine.js';
import { supabase } from '../db/supabase.js';
import type { DecisionLogInsert } from '../db/supabase.js';

// Explicit type annotation to avoid TS2742 with pnpm hoisting
export const workflowRouter: ReturnType<typeof Router> = Router();

// ── POST /run ────────────────────────────────────────────────

workflowRouter.post('/run', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as RunWorkflowRequest;
    const { workflow_type, input } = body;

    // Validate required fields
    if (!workflow_type || !input) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Missing required fields: workflow_type and input',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Validate workflow_type
    const validTypes: ReadonlyArray<WorkflowType> = ['fraud', 'loan', 'transaction', 'investment'];
    if (!validTypes.includes(workflow_type)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        data: null,
        error: `Invalid workflow_type: ${workflow_type}. Must be one of: ${validTypes.join(', ')}`,
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 1. Run the consensus engine
    const result = await runConsensus(workflow_type, input);

    // 2. Generate a UUID for this decision
    const decisionId = uuidv4();

    // 3. Map ConsensusResult → DecisionLogInsert for Supabase
    const row: DecisionLogInsert = {
      id: decisionId,
      workflow_type: result.workflow_type,
      input_data: input as unknown as Record<string, unknown>,
      advocate_arguments: result.advocate?.result
        ? (result.advocate.result as unknown as Record<string, unknown>)
        : null,
      challenger_arguments: result.challenger?.result
        ? (result.challenger.result as unknown as Record<string, unknown>)
        : null,
      confidence_delta: result.confidence_delta?.delta ?? null,
      arbitrator_decision: result.arbitrator?.result.decision ?? null,
      arbitrator_reasoning: result.arbitrator_reasoning ?? null,
      final_status: result.final_verdict,
      hitl_required: result.hitl_required,
      human_decision: null,
      human_reviewer: null,
      human_notes: null,
      created_at: result.created_at,
      updated_at: result.created_at,
    };

    // 4. Insert into Supabase
    const { error: dbError } = await supabase
      .from('decision_logs')
      .insert(row);

    if (dbError) {
      console.error('[Supabase Insert Error]', dbError.message);
      const errorResponse: ApiResponse<null> = {
        success: false,
        data: null,
        error: `Database error: ${dbError.message}`,
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(errorResponse);
      return;
    }

    // 5. Return response
    const response: ApiResponse<RunWorkflowResponse> = {
      success: true,
      data: {
        decision_id: decisionId,
        result,
      },
      error: null,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during workflow execution';
    console.error('[Workflow Error]', message);

    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      error: message,
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
});
