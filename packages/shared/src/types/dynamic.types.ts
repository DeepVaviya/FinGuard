// ─────────────────────────────────────────────────────────────
// dynamic.types.ts — Strict schema for AI generated workflows
// ─────────────────────────────────────────────────────────────

export type StudioNodeType = 'input' | 'rule' | 'advocate' | 'challenger' | 'arbitrator' | 'output';

export interface DynamicNode {
  id: string;
  /** React Flow specific type */
  type: StudioNodeType | 'default'; 
  data: {
    label: string;
    description?: string;
    rules?: string[];
  };
  position: {
    x: number;
    y: number;
  };
}

export interface DynamicEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  label?: string;
}

export interface AgenticWorkflowPayload {
  is_banking_related: boolean;
  rejection_reason?: string;
  
  workflow_id: string;
  workflow_name: string;
  description: string;
  
  /** The data fields required to run this workflow (e.g. transfer_amount) */
  required_inputs: Array<{
    field_name: string;
    field_type: 'number' | 'boolean' | 'string';
    description: string;
  }>;

  /** The visual nodes representing the Agents and the Rules */
  nodes: DynamicNode[];
  edges: DynamicEdge[];
}
