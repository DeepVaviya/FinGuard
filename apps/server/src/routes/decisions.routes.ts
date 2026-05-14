// ─────────────────────────────────────────────────────────────
// decisions.routes.ts — GET /api/decisions, GET /api/decisions/:id
// Fetches historical decision logs with pagination and filters.
// ─────────────────────────────────────────────────────────────

import { Router, type Request, type Response } from 'express';

import type {
  ApiResponse,
  DecisionLog,
  GetDecisionsResponse,
  Verdict,
  WorkflowType,
} from '@finguard/shared';

import { supabase } from '../db/supabase.js';
import type { DecisionLogRow } from '../db/supabase.js';

// Explicit type annotation to avoid TS2742 with pnpm hoisting
export const decisionsRouter: ReturnType<typeof Router> = Router();

// ── Helper: map DB row → DecisionLog ─────────────────────────

function toDecisionLog(row: DecisionLogRow): DecisionLog {
  return {
    id: row.id,
    workflow_type: row.workflow_type,
    input_data: row.input_data,
    advocate_arguments: row.advocate_arguments as DecisionLog['advocate_arguments'],
    challenger_arguments: row.challenger_arguments as DecisionLog['challenger_arguments'],
    confidence_delta: row.confidence_delta,
    arbitrator_decision: row.arbitrator_decision,
    arbitrator_reasoning: row.arbitrator_reasoning,
    final_status: row.final_status,
    hitl_required: row.hitl_required,
    human_decision: row.human_decision,
    human_reviewer: row.human_reviewer,
    human_notes: row.human_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ── GET / — list decisions with filters + pagination ─────────

decisionsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const workflowType = req.query['workflow_type'] as WorkflowType | undefined;
    const verdict = req.query['verdict'] as Verdict | undefined;
    const limit = parseInt(req.query['limit'] as string, 10) || 50;
    const offset = parseInt(req.query['offset'] as string, 10) || 0;

    // Build query with exact count for pagination
    let query = supabase
      .from('decision_logs')
      .select('*', { count: 'exact' });

    // Apply optional filters
    if (workflowType) {
      query = query.eq('workflow_type', workflowType);
    }

    if (verdict) {
      query = query.eq('final_status', verdict);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Supabase Query Error]', error.message);
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
    const decisions: DecisionLog[] = rows.map(toDecisionLog);

    const response: ApiResponse<GetDecisionsResponse> = {
      success: true,
      data: {
        decisions,
        total: count ?? 0,
      },
      error: null,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching decisions';
    console.error('[Decisions Error]', message);

    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      error: message,
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
});

// ── GET /:id — fetch single decision by UUID ─────────────────

decisionsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Missing decision ID parameter',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    const { data, error } = await supabase
      .from('decision_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        data: null,
        error: error?.message ?? `Decision with id '${id}' not found`,
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const row = data as DecisionLogRow;
    const decision = toDecisionLog(row);

    const response: ApiResponse<DecisionLog> = {
      success: true,
      data: decision,
      error: null,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching decision';
    console.error('[Decision By ID Error]', message);

    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      error: message,
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
});
