-- ─────────────────────────────────────────────────────────────
-- schema.sql — FinGuard Decision Log persistence schema
-- Maps ConsensusResult → DecisionLog for Supabase (PostgreSQL)
-- ─────────────────────────────────────────────────────────────

-- Create enum types
CREATE TYPE workflow_type AS ENUM ('fraud', 'loan', 'transaction', 'investment');
CREATE TYPE final_status AS ENUM ('approved', 'rejected', 'escalated', 'pending_review');

-- Decision logs (main table)
CREATE TABLE decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type workflow_type NOT NULL,
  input_data JSONB NOT NULL,
  advocate_arguments JSONB,          -- Nullable in case rule engine triggers early
  challenger_arguments JSONB,        -- Nullable in case rule engine triggers early
  confidence_delta FLOAT,            -- Nullable
  arbitrator_decision TEXT,          -- Nullable
  arbitrator_reasoning TEXT,         -- Nullable
  final_status final_status NOT NULL DEFAULT 'pending_review',
  hitl_required BOOLEAN NOT NULL DEFAULT false,
  human_decision TEXT,
  human_reviewer TEXT,
  human_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for route performance
CREATE INDEX idx_decision_logs_workflow ON decision_logs(workflow_type);
CREATE INDEX idx_decision_logs_status ON decision_logs(final_status);
CREATE INDEX idx_decision_logs_hitl ON decision_logs(hitl_required) WHERE hitl_required = true;
CREATE INDEX idx_decision_logs_created ON decision_logs(created_at DESC);
