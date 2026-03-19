'use client'

import React from 'react'
import { useYOVaults } from '@/lib/hooks/useYOVaults'

export default function APYTicker() {
  const { vaults, isLoading } = useYOVaults()

  if (isLoading || vaults.length === 0) return null

  const items = vaults.map((v) => `${v.name} ${v.apy.toFixed(2)}%`)
  // Duplicate for seamless loop
  const doubled = [...items, ...items]

  return (
    <div
      className="hidden lg:flex items-center overflow-hidden max-w-xs"
      aria-label="Live vault APY rates"
      aria-live="polite"
    >
      <div className="flex items-center gap-6 animate-ticker whitespace-nowrap">
        {doubled.map((label, i) => (
          <span key={i} className="text-xs font-medium text-white/40 shrink-0">
            <span className="text-teal-400/70">●</span>{' '}{label}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 18s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}