'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { YO_VAULTS } from '@/lib/constants'

const PERIODS = [
  { label: '1M', days: 30 },
  { label: '3M', days: 91 },
  { label: '6M', days: 182 },
  { label: '1Y', days: 365 },
]

export interface YieldCalculatorProps {
  /** Optional map of vaultAddress → real APY from API */
  apyMap?: Record<string, number>
  onConnect?: () => void
}

const FALLBACK_APY: Record<string, number> = {
  [YO_VAULTS[0].address.toLowerCase()]: 8.5,
  [YO_VAULTS[1].address.toLowerCase()]: 6.2,
  [YO_VAULTS[2].address.toLowerCase()]: 5.8,
  [YO_VAULTS[3].address.toLowerCase()]: 7.1,
}

export default function YieldCalculator({ apyMap, onConnect }: YieldCalculatorProps) {
  const [principal, setPrincipal] = useState('1000')
  const [periodIdx, setPeriodIdx] = useState(3) // default 1Y
  const [vaultIdx, setVaultIdx] = useState(0)   // default yoUSD

  const vault = YO_VAULTS[vaultIdx]
  const apy =
    apyMap?.[vault.address.toLowerCase()] ??
    FALLBACK_APY[vault.address.toLowerCase()] ??
    0

  const { earnings, total } = useMemo(() => {
    const p = parseFloat(principal) || 0
    const days = PERIODS[periodIdx].days
    const earnings = p * (apy / 100) * (days / 365)
    return { earnings, total: p + earnings }
  }, [principal, periodIdx, apy])

  const parsedPrincipal = parseFloat(principal) || 0

  // Pulse the result when earnings changes
  const resultRef = useRef<HTMLDivElement>(null)
  const prevEarnings = useRef(earnings)
  useEffect(() => {
    if (prevEarnings.current !== earnings && resultRef.current) {
      resultRef.current.classList.remove('result-pulse')
      void resultRef.current.offsetWidth // reflow to restart animation
      resultRef.current.classList.add('result-pulse')
    }
    prevEarnings.current = earnings
  }, [earnings])

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-neutral-900">How much will you earn?</h2>
        <p className="text-xs text-neutral-500 mt-0.5">Adjust the inputs to see your estimated yield</p>
      </div>

      {/* Amount input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide" htmlFor="calc-amount">
          Amount
        </label>
        <div className="flex items-center gap-2 rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3
                        focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
          <span className="text-lg font-bold text-neutral-400">$</span>
          <input
            id="calc-amount"
            type="number"
            min="0"
            step="any"
            placeholder="1000"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-bold text-neutral-900 outline-none
                       placeholder:text-neutral-300 [appearance:textfield]
                       [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Investment amount"
          />
        </div>
        {/* Quick amounts */}
        <div className="flex gap-2">
          {[100, 500, 1000, 5000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setPrincipal(String(amt))}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors
                ${parsedPrincipal === amt
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'}`}
            >
              ${amt.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Time period */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Time period</span>
        <div className="flex gap-2">
          {PERIODS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setPeriodIdx(i)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors
                ${periodIdx === i
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vault selector */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Vault</span>
        <div className="flex flex-wrap gap-2">
          {YO_VAULTS.map((v, i) => (
            <button
              key={v.address}
              type="button"
              onClick={() => setVaultIdx(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors
                ${vaultIdx === i
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div ref={resultRef} className="rounded-xl bg-gradient-to-br from-primary-50 to-success-50 border border-primary-100 p-4 space-y-3" style={{ willChange: 'transform' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">You&apos;d earn</span>
          <span className="text-2xl font-bold text-success-600">
            +${earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">Total value</span>
          <span className="text-lg font-semibold text-neutral-800">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">APY</span>
          <span className="text-lg font-semibold text-primary-600">{apy.toFixed(2)}%</span>
        </div>
        <div className="h-px bg-primary-100" />
        <p className="text-xs text-neutral-400 text-center">
          Estimates based on current APY. Not financial advice.
        </p>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        {onConnect ? (
          <button
            type="button"
            onClick={onConnect}
            className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 py-3.5
                       text-sm font-semibold text-white shadow-medium
                       hover:from-primary-400 hover:to-primary-500 transition-all"
          >
            Start Earning
          </button>
        ) : (
          <ConnectButton label="Start Earning" />
        )}
      </div>
    </div>
  )
}
