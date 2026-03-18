'use client'

import React from 'react'
import { useVaultAPY } from '@/lib/hooks/useVaultAPY'

export interface TransparencyPanelProps {
  vaultAddress: string
}

const TransparencyPanel: React.FC<TransparencyPanelProps> = ({ vaultAddress }) => {
  const { allocations, isLoading } = useVaultAPY(vaultAddress)

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-neutral-100 p-5 animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-neutral-200 rounded w-1/3" />
              <div className="h-4 bg-neutral-200 rounded w-16" />
            </div>
            <div className="h-2 bg-neutral-200 rounded-full w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800">Fund Allocation</h3>
        <span className="text-xs text-neutral-400 italic">Indicative — rebalances automatically</span>
      </div>
      <div className="space-y-3">
        {allocations.map((entry) => (
          <AllocationRow key={entry.pool} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function AllocationRow({ entry }: {
  entry: { protocol: string; pool: string; percentage: number; yield1d: number }
}) {
  const { pool, protocol, percentage, yield1d } = entry
  const barColor =
    protocol === 'Aave' ? 'bg-blue-500' :
    protocol === 'Morpho' ? 'bg-purple-500' :
    protocol === 'Auto' ? 'bg-orange-500' :
    protocol === 'Resolv' ? 'bg-teal-500' :
    protocol === 'Aura' ? 'bg-indigo-500' :
    protocol === 'Fluid' ? 'bg-cyan-500' :
    'bg-primary-500'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-800 truncate min-w-0">{pool}</span>
        <div className="flex items-center gap-3 shrink-0">
          {yield1d > 0 && (
            <span className="text-xs text-green-600 font-medium">{yield1d.toFixed(2)}%</span>
          )}
          <span className="text-sm font-semibold text-neutral-700">{percentage.toFixed(1)}%</span>
        </div>
      </div>
      <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pool}: ${percentage.toFixed(1)}%`}
        />
      </div>
    </div>
  )
}

export default TransparencyPanel
