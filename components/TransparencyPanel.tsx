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
      <div className="rounded-2xl p-5 animate-pulse space-y-4"
        style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 rounded w-1/3" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-4 rounded w-16" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
            <div className="h-2 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Fund Allocation</h3>
        <span className="text-xs text-gray-600 italic">Indicative — rebalances automatically</span>
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
    protocol === 'Aave' ? '#3b82f6' :
    protocol === 'Morpho' ? '#a855f7' :
    protocol === 'Auto' ? '#f97316' :
    protocol === 'Resolv' ? '#00c896' :
    protocol === 'Aura' ? '#6366f1' :
    protocol === 'Fluid' ? '#06b6d4' :
    '#00c896'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-300 truncate min-w-0">{pool}</span>
        <div className="flex items-center gap-3 shrink-0">
          {yield1d > 0 && <span className="text-xs text-teal-400 font-medium">{yield1d.toFixed(2)}%</span>}
          <span className="text-sm font-semibold text-white">{percentage.toFixed(1)}%</span>
        </div>
      </div>
      <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%`, background: barColor }}
          role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}
          aria-label={`${pool}: ${percentage.toFixed(1)}%`} />
      </div>
    </div>
  )
}

export default TransparencyPanel
