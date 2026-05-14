/**
 * simulate_batch.js
 * 
 * This script simulates a "Midnight Cron Job" run by a bank's internal servers.
 * It grabs 5 random un-processed transactions and programmatically BLASTS them
 * into the FinGuard engine without any human UI interaction.
 * 
 * To run this demo, open a new terminal and run:
 * node simulate_batch.js
 */

const transactions = [
    {
        workflow_type: 'loan',
        input: {
            applicant_name: "John Doe",
            loan_amount: 1200000,
            credit_score: 750,
            annual_income: 150000,
            debt_to_income_ratio: 0.25
        }
    },
    {
        workflow_type: 'fraud',
        input: {
            merchant: "High-Risk Crypto Exchange",
            transaction_amount: 45000,
            ip_country: "RU",
            card_country: "US",
            time_since_last_purchase_minutes: 2
        }
    },
    {
        workflow_type: 'investment',
        input: {
            fund_name: "Stable Growth IRA",
            deposit_amount: 5000,
            investor_risk_tolerance: "low",
            age: 65
        }
    },
    {
        workflow_type: 'loan',
        input: {
            applicant_name: "Suspicious LLC",
            loan_amount: 5000000,
            credit_score: 550,
            annual_income: 40000,
            debt_to_income_ratio: 0.85
        }
    },
    {
        workflow_type: 'fraud',
        input: {
            merchant: "Local Coffee Shop",
            transaction_amount: 4.50,
            ip_country: "US",
            card_country: "US",
            time_since_last_purchase_minutes: 1440
        }
    }
];

async function runBatch() {
    console.log("=====================================");
    console.log("🚀 STARTING AUTOMATED BATCH RUN: 5 TRANSACTIONS");
    console.log("=====================================\n");

    let processedIdx = 1;
    for (const tx of transactions) {
        console.log(`[Transaction ${processedIdx}/5] -> Sending ${tx.workflow_type.toUpperCase()} request...`);
        console.log(`Payload: ${JSON.stringify(tx.input)}`);
        
        try {
            const start = Date.now();
            
            // This is the EXACT API call the bank's backend makes to FinGuard
            const res = await fetch('http://localhost:4000/api/workflow/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tx)
            });
            
            const result = await res.json();
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);

            if (result.success) {
                const verdict = result.data.result.final_verdict;
                console.log(`✅ [Finished in ${elapsed}s] -> AI Engine Verdict: ${verdict.toUpperCase()}`);
                
                if (verdict === 'pending_review') {
                    console.log(`   ⚠️ This was a close call. Flagged to Human Veto Queue!`);
                }
            } else {
                console.error(`❌ [Error]: ${result.error}`);
            }
        } catch (err) {
            console.error(`❌ [Critical Error] Is your Express server running on port 4000?`, err.message);
        }
        console.log("-------------------------------------");
        processedIdx++;
    }

    console.log("🎉 BATCH COMPLETE! Open your FinGuard Dashboard -> Decision Logs to see the saved results.");
}

runBatch();
