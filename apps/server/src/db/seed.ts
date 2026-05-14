import { supabase, type DecisionLogInsert } from './supabase.js';

// Random IDs for the mock data since UUID generation is supported by Supabase (gen_random_uuid()) automatically.
// We just insert specific JSON data to populate the dashboards.
const mockData: DecisionLogInsert[] = [
  {
    workflow_type: 'fraud',
    input_data: { user: 'Alice', amount: 50000, country_from: 'US', country_to: 'Syria' },
    advocate_arguments: { arguments: ['Proceed with caution', 'Valid account standing'] },
    challenger_arguments: { arguments: ['Highly sanctioned country', 'Amount over 10k threshold'] },
    confidence_delta: 0.1,
    arbitrator_decision: 'reject',
    arbitrator_reasoning: 'Violation of international wire protocols regarding sanctioned locations',
    final_status: 'rejected',
    hitl_required: false
  },
  {
    workflow_type: 'loan',
    input_data: { user: 'Bob', credit_score: 750, requested_amount: 150000 },
    advocate_arguments: { arguments: ['High credit score', 'Good payment history'] },
    challenger_arguments: { arguments: ['High requested amount without adequate collateral'] },
    confidence_delta: 0.8,
    arbitrator_decision: 'escalate',
    arbitrator_reasoning: 'Arguments are both valid, requires human intervention for manual override.',
    final_status: 'pending_review',
    hitl_required: true
  },
  {
    workflow_type: 'transaction',
    input_data: { user: 'Charlie', item: 'Rolex Watch', amount: 15000 },
    advocate_arguments: { arguments: ['Known wealthy client', 'Matching IP address'] },
    challenger_arguments: { arguments: ['Slight mismatch in billing vs shipping'] },
    confidence_delta: 0.95,
    arbitrator_decision: 'approve',
    arbitrator_reasoning: 'IP matches and standard deviation acceptable for wealthy client portfolio.',
    final_status: 'approved',
    hitl_required: false
  }
];

export async function seedDatabase() {
  console.log('Seeding Supabase database with sample data...');

  const { data, error } = await supabase
    .from('decision_logs')
    .insert(mockData)
    .select();

  if (error) {
    console.error('Failed to seed database:', error.message);
    process.exit(1);
  }

  console.log('Seeding successful! Inserted rows:', data.length);
  process.exit(0);
}

seedDatabase();
