'use client'

import React, { useEffect, useState } from 'react'
import { getPendingReviews, submitHumanReview } from '@/lib/api-client'
import type { PendingReviewItem } from '@finguard/shared'
import { HumanReviewCard } from '@/components/review/human-review-card'
import { Loader2 } from 'lucide-react'

export default function HumanReviewPage() {
  const [reviews, setReviews] = useState<PendingReviewItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true)
      const data = await getPendingReviews()
      setReviews(data)
      setLoading(false)
    }
    fetchReviews()
  }, [])

  const handleSubmitReview = async (decisionId: string, verdict: 'approve' | 'reject', notes: string) => {
    await submitHumanReview({
      decision_id: decisionId,
      human_verdict: verdict,
      reviewer_name: 'Member 3 (Frontend)',
      notes
    })
    
    // Remove from queue locally
    setReviews(prev => prev.filter(r => r.decision_id !== decisionId))
  }

  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center h-64 text-primary gap-4">
         <Loader2 className="w-10 h-10 animate-spin" />
         <p className="font-syne font-bold uppercase tracking-widest text-sm">Fetching Queue...</p>
       </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 pt-12">
        <div className="w-16 h-16 rounded-full bg-finguard-green/10 flex items-center justify-center mb-6">
          <span className="text-finguard-green text-3xl">✓</span>
        </div>
        <h2 className="text-xl font-syne font-bold text-finguard-green uppercase tracking-wide">
          Queue Clear
        </h2>
        <p className="text-finguard-green/80 font-inter mt-2">
          No pending reviews — all decisions resolved.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-syne font-bold text-foreground">Human Review Queue</h1>
        <p className="text-muted-foreground font-inter text-sm mt-1">
          Decisions requiring manual intervention due to broken confidence thresholds or hard rule escalations.
        </p>
      </div>

      <div className="flex flex-col gap-12 mt-4">
        {reviews.map(item => (
          <HumanReviewCard 
            key={item.decision_id} 
            item={item} 
            onSubmit={handleSubmitReview} 
          />
        ))}
      </div>
    </div>
  )
}
