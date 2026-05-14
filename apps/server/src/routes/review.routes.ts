// ─────────────────────────────────────────────────────────────
// review.routes.ts — GET /api/review/pending, POST /api/review/submit
// Handles Human-in-the-Loop (HITL) review queue and verdicts.
// ─────────────────────────────────────────────────────────────

import { Router, type Request, type Response } from 'express';

import type {
  ApiResponse,
  PendingReviewItem,
  SubmitHumanReviewRequest,
  SubmitHumanReviewResponse,
  EscalationReason,
  AgentArgument,
} from '@finguard/shared';

import { supabase } from '../db/supabase.js';
import type { DecisionLogRow, DecisionLogUpdate } from '../db/supabase.js';

// Explicit type annotation to avoid TS2742 with pnpm hoisting
export const reviewRouter: ReturnType<typeof Router> = Router();

// ── Default AgentArgument for rule-engine-only decisions ──────

const defaultAgentArgument: AgentArgument = {
  decision: 'escalate',
  score: 0.5 as AgentArgument['score'],
  arguments: ['No agent analysis available — rule engine triggered'],
  risk_factors: [],
  confidence: 0.5 as AgentArgument['confidence'],
};

// ── GET /pending — fetch all decisions awaiting human review ──

reviewRouter.get('/pending', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('decision_logs')
      .select('*')
      .eq('hitl_required', true)
      .or('final_status.eq.escalated,final_status.eq.pending_review')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Supabase Pending Query Error]', error.message);
      const errorResponse: ApiResponse<null> = {
        success: false,
        data: null,
        error: `Database error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(errorResponse);
      return;
    }

    const rows = (data ?? []) as DecisionLogRow[];

    // Map rows to PendingReviewItem
    const pendingItems: PendingReviewItem[] = rows.map((row) => ({
      decision_id: row.id,
      workflow_type: row.workflow_type,
      created_at: row.created_at,
      advocate: row.advocate_arguments
        ? (row.advocate_arguments as unknown as AgentArgument)
        : defaultAgentArgument,
      challenger: row.challenger_arguments
        ? (row.challenger_arguments as unknown as AgentArgument)
        : defaultAgentArgument,
      confidence_delta: row.confidence_delta ?? 0,
      escalation_reason: 'high_delta' as EscalationReason,
    }));

    const response: ApiResponse<PendingReviewItem[]> = {
      success: true,
      data: pendingItems,
      error: null,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching pending reviews';
    console.error('[Pending Review Error]', message);

    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      error: message,
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
});

// ── POST /submit — apply a human verdict to a decision ───────

reviewRouter.post('/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as SubmitHumanReviewRequest;
    const { decision_id, human_verdict, reviewer_name, notes } = body;

    // Validate required fields
    if (!decision_id || !human_verdict || !reviewer_name) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Missing required fields: decision_id, human_verdict, and reviewer_name',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Validate human_verdict
    if (human_verdict !== 'approved' && human_verdict !== 'rejected') {
      const errorResponse: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'human_verdict must be either "approved" or "rejected"',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Build the update payload with explicit typing
    const updatePayload: DecisionLogUpdate = {
      human_decision: human_verdict,
      human_reviewer: reviewer_name,
      human_notes: notes ?? null,
      final_status: human_verdict,
      updated_at: new Date().toISOString(),
    };

    // Update the decision record in Supabase
    const { data, error } = await supabase
      .from('decision_logs')
      .update(updatePayload)
      .eq('id', decision_id)
      .select('id, final_status');

    if (error) {
      console.error('[Supabase Update Error]', error.message);
      const errorResponse: ApiResponse<null> = {
        success: false,
        data: null,
        error: `Database error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(errorResponse);
      return;
    }

    if (!data || data.length === 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        data: null,
        error: `Decision with id '${decision_id}' not found`,
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const updatedRow = data[0] as Pick<DecisionLogRow, 'id' | 'final_status'> | undefined;

    if (!updatedRow) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        data: null,
        error: `Decision with id '${decision_id}' not found`,
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiResponse<SubmitHumanReviewResponse> = {
      success: true,
      data: {
        decision_id: updatedRow.id,
        updated_status: updatedRow.final_status,
      },
      error: null,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error submitting review';
    console.error('[Submit Review Error]', message);

    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      error: message,
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
});
