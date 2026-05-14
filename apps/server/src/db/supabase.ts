// ─────────────────────────────────────────────────────────────
// supabase.ts — Supabase client wrapper for FinGuard
// Validates env vars at initialization and exports a configured
// Supabase instance using the service-role key.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

// ── Database row type (matches schema.sql) ───────────────────

/** Row shape stored in the `decision_logs` table. */
export interface DecisionLogRow {
  id: string;
  workflow_type: 'fraud' | 'loan' | 'transaction' | 'investment';
  input_data: Record<string, unknown>;
  advocate_arguments: Record<string, unknown> | null;
  challenger_arguments: Record<string, unknown> | null;
  confidence_delta: number | null;
  arbitrator_decision: string | null;
  arbitrator_reasoning: string | null;
  final_status: 'approved' | 'rejected' | 'escalated' | 'pending_review';
  hitl_required: boolean;
  human_decision: string | null;
  human_reviewer: string | null;
  human_notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Insert shape — created_at/updated_at are optional (DB defaults). */
export type DecisionLogInsert = Omit<DecisionLogRow, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

/** Update shape — all fields optional. */
export type DecisionLogUpdate = Partial<DecisionLogRow>;

// ── Environment validation ───────────────────────────────────

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl) {
  throw new Error(
    'Missing SUPABASE_URL environment variable. ' +
    'Set it in your .env file or environment before starting the server.'
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
    'Set it in your .env file or environment before starting the server.'
  );
}

// ── Client instantiation ─────────────────────────────────────
// We intentionally skip the Database generic here. Supabase v2's
// generated-type structure is tightly coupled to its internal
// PostgREST generics and breaks across minor versions in monorepos.
// Type safety is enforced at each query site via DecisionLogRow casts.

export const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
