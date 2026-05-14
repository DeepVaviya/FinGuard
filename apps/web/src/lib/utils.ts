import type { Verdict } from '@finguard/shared'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDelta(delta: number): string {
  return delta.toFixed(2)
}

export function formatScore(score: number): string {
  return `${(score * 100).toFixed(0)}%`
}

export function getVerdictBorderClass(verdict: Verdict): string {
  switch (verdict) {
    case 'approved': return 'border-finguard-green'
    case 'rejected': return 'border-finguard-red'
    case 'escalated': return 'border-finguard-amber'
    case 'pending_review': return 'border-finguard-blue'
  }
}

export function getVerdictTextClass(verdict: Verdict): string {
  switch (verdict) {
    case 'approved': return 'text-finguard-green'
    case 'rejected': return 'text-finguard-red'
    case 'escalated': return 'text-finguard-amber'
    case 'pending_review': return 'text-finguard-blue'
  }
}

export function getVerdictBadgeClass(verdict: Verdict): string {
  switch (verdict) {
    case 'approved': return 'badge-approved'
    case 'rejected': return 'badge-rejected'
    case 'escalated': return 'badge-escalated'
    case 'pending_review': return 'badge-mock'
  }
}

export function truncateId(id: string, chars = 8): string {
  if (id.length <= chars) return id
  return `${id.substring(0, chars)}...`
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate()
  const month = d.toLocaleString('en-GB', { month: 'short' })
  const year = d.getFullYear()
  const time = d.toLocaleTimeString('en-GB', { hour12: false })
  return `${day} ${month} ${year}, ${time}`
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
