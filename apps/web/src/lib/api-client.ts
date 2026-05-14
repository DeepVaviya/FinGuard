import {
  type WorkflowType,
  type WorkflowInput,
  type RunWorkflowResponse,
  type GetDecisionsResponse,
  type PendingReviewItem,
  type SubmitHumanReviewRequest,
  type SubmitHumanReviewResponse,
  type DecisionLog
} from '@finguard/shared'

import {
  mockLoanApproved,
  mockLoanEscalated,
  mockFraudEscalated,
  mockDecisionLogs,
  mockPendingReviews
} from './mock-data'

// Helper to simulate network latency
const delay = (ms: number = 1500) => new Promise((resolve) => setTimeout(resolve, ms))

export async function runWorkflow(
  workflowType: WorkflowType,
  input: WorkflowInput
): Promise<RunWorkflowResponse> {
  const res = await fetch('http://localhost:4000/api/workflow/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow_type: workflowType, input: input })
  });
  
  if (!res.ok) {
    throw new Error('Failed to run workflow on backend');
  }

  const payload = await res.json();
  const decision_id = payload.data?.decision_id || `dec-${Math.random().toString(36).substr(2, 9)}`;
  const result = payload.data?.result || payload.data;

  return { decision_id, result };
}

export async function getDecisions(
  workflowType?: WorkflowType,
  verdict?: string
): Promise<GetDecisionsResponse> {
  const url = new URL('http://localhost:4000/api/decisions');
  if (workflowType && workflowType !== 'all') {
    url.searchParams.append('workflow_type', workflowType);
  }
  if (verdict && verdict !== 'all') {
    url.searchParams.append('verdict', verdict);
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch decisions');
  }

  const payload = await res.json();
  return payload.data;
}

export async function getPendingReviews(): Promise<PendingReviewItem[]> {
  const res = await fetch('http://localhost:4000/api/review/pending', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch pending reviews');
  }

  const payload = await res.json();
  return payload.data;
}

export async function submitHumanReview(
  req: SubmitHumanReviewRequest
): Promise<SubmitHumanReviewResponse> {
  const res = await fetch('http://localhost:4000/api/review/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    throw new Error('Failed to submit review');
  }

  const payload = await res.json();
  return payload.data;
}
