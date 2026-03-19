'use client'

import React, { useEffect, useState } from 'react'
import { getActivityRecords, type ActivityRecord } from '@/lib/depositStore'
import { BLOCK_EXPLORER } from '@/lib/constants'

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

interface RecentActivityProps {
  walletAddress: string
}

export default function RecentActivity({ walletAddress }: RecentActivityProps) {
  const [records, setRecords] = useState<ActivityRecord[]>([])

  useEffect(() => {
    setRecords(getActivityRecords(walletAddress, 5))
  }, [walletAddress])

  if (records.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800">Recent Activity</h2>
        <a
          href={`${BLOCK_EXPLORER.BASE}/address/${walletAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neutral-400 hover:text-blue-600 transition-colors"
        >
          View all on Basescan ↗
        </a>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-soft overflow-hidden">
        {records.map((r, i) => (
          <div
            key={`${r.txHash}-${i}`}
            className={`flex items-center gap-3 px-5 py-3.5 ${i < records.length - 1 ? 'border-b border-neutral-100' : ''}`}
          >
            {/* Icon */}
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${r.type === 'deposit' ? 'bg-green-50' : 'bg-orange-50'}`}>
              {r.type === 'deposit' ? (
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-900 capitalize">{r.type}</span>
                <span className="text-xs text-neutral-400">{r.vaultName}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <a
                  href={r.basescanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-500 hover:text-blue-700 transition-colors"
                >
                  {r.txHash.slice(0, 6)}…{r.txHash.slice(-4)} ↗
                </a>
                <span className="text-xs text-neutral-400">{timeAgo(r.timestamp)}</span>
              </div>
            </div>

            {/* Amount */}
            <span className={`text-sm font-bold shrink-0 ${r.type === 'deposit' ? 'text-green-600' : 'text-orange-500'}`}>
              {r.type === 'deposit' ? '+' : '-'}{r.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}