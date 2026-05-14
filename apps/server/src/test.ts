// ─────────────────────────────────────────────────────────────
// test.ts — Manual test script, run with: npx tsx src/test.ts
// No test framework — plain console.log PASS/FAIL
// ─────────────────────────────────────────────────────────────

import type { LoanInput, TransactionInput, RuleResult } from '@finguard/shared';
import { runRules } from './rule-engine/index.js';
import { runConsensus } from './engine/consensus.engine.js';
import { ollamaClient } from './ai/ollama.client.js';

// ── Sample data inline (mirrors data/ files) ────────────────

const loanCibilReject: LoanInput = {
  application_id: 'LN-TEST-001',
  applicant_name: 'Rajesh Sharma',
  monthly_income: 45000,
  cibil_score: 550,
  loan_amount: 500000,
  loan_tenure_months: 36,
  existing_emis: 5000,
  employer_type: 'salaried',
  employer_age_months: 24,
  loan_applications_last_6mo: 1,
};

const transactionHitl: TransactionInput = {
  transaction_id: 'TXN-TEST-001',
  sender_account: 'HDFC-1234567890',
  receiver_account: 'SBI-9876543210',
  amount: 1500000,
  currency: 'INR',
  transaction_type: 'RTGS',
  is_international: false,
  sender_kyc_status: 'complete',
  receiver_kyc_status: 'complete',
  transaction_note: 'Property advance payment',
};

const loanGoodProfile: LoanInput = {
  application_id: 'LN-TEST-003',
  applicant_name: 'Amit Deshmukh',
  monthly_income: 85000,
  cibil_score: 720,
  loan_amount: 1500000,
  loan_tenure_months: 60,
  existing_emis: 12000,
  employer_type: 'salaried',
  employer_age_months: 48,
  loan_applications_last_6mo: 0,
};

// ── Test runner ──────────────────────────────────────────────

let passed = 0;
let failed = 0;

function logResult(testNum: number, name: string, success: boolean, details: string): void {
  if (success) {
    console.log(`✓ Test ${testNum} PASS — ${name}`);
    passed++;
  } else {
    console.log(`✗ Test ${testNum} FAIL — ${name}`);
    console.log(`  ${details}`);
    failed++;
  }
}

async function runTests(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FinGuard — Member 1 Test Suite');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // ── Test 1: Rule engine loan reject ──────────────────────
  {
    const result: RuleResult = runRules('loan', loanCibilReject);
    const success = result.triggered === true && result.forced_verdict === 'rejected';
    logResult(1, 'Rule engine: loan CIBIL reject', success,
      `Expected triggered=true, forced_verdict='rejected'. Got triggered=${result.triggered}, forced_verdict='${result.forced_verdict}', reason='${result.reason}'`
    );
  }

  // ── Test 2: Rule engine transaction HITL ─────────────────
  {
    const result: RuleResult = runRules('transaction', transactionHitl);
    const success = result.triggered === true && result.forced_verdict === 'escalated';
    logResult(2, 'Rule engine: transaction mandatory HITL', success,
      `Expected triggered=true, forced_verdict='escalated'. Got triggered=${result.triggered}, forced_verdict='${result.forced_verdict}', reason='${result.reason}'`
    );
  }

  // ── Test 3: Full consensus loan ──────────────────────────
  {
    try {
      const result = await runConsensus('loan', loanGoodProfile);
      console.log('');
      console.log('── Test 3: Full ConsensusResult ──────────────────');
      console.log(JSON.stringify(result, null, 2));
      console.log('─────────────────────────────────────────────────');
      console.log('');
      logResult(3, 'Full consensus: loan (good profile)', true, '');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logResult(3, 'Full consensus: loan (good profile)', false, `Error: ${msg}`);
    }
  }

  // ── Test 4: Ollama availability ──────────────────────────
  {
    const available = await ollamaClient.isAvailable();
    console.log(`  Ollama available: ${available}`);
    console.log(`  Mock mode active: ${!available}`);
    logResult(4, 'Ollama availability check', true, '');
  }

  // ── Summary ──────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((error: unknown) => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
