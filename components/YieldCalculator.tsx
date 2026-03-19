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
  const [periodIdx, setPeriodIdx] = useState(3)
  const [vaultIdx, setVaultIdx] = useState(0)

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

  const resultRef = useRef<HTMLDivElement>(null)
  const prevEarnings = useRef(earnings)
  useEffect(() => {
    if (prevEarnings.current !== earnings && resultRef.current) {
      resultRef.current.classList.remove('result-pulse')
      void resultRef.current.offsetWidth
      resultRef.current.classList.add('result-pulse')
    }
    prevEarnings.current = earnings
  }, [earnings])

  const inputBg = '#1a2332'
  const inputBorder = 'rgba(255,255,255,0.08)'

  return (
    <div
      className="rounded-3xl p-6 space-y-5"
      style={{
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}
    >
      <div>
        <h2 className="text-lg font-bold text-white">How much will you earn?</h2>
        <p className="text-xs text-gray-400 mt-0.5">Adjust the inputs to see your estimated yield</p>
      </div>

      {/* Amount input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-widest" htmlFor="calc-amount">
          Amount
        </label>
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 transition-all"
          style={{ background: inputBg, border: `1px solid ${inputBorder}` }}
          onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,150,0.4)' }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = inputBorder }}
        >
          <span className="text-lg font-bold text-gray-500">$</span>
          <input
            id="calc-amount"
            type="number"
            min="0"
            step="any"
            placeholder="1000"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-gray-600
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Investment amount"
          />
        </div>
        {/* Quick amounts */}
        <div className="flex gap-2">
          {[100, 500, 1000, 5000].map((amt) => {
            const isActive = parsedPrincipal === amt
            return (
              <button
                key={amt}
                type="button"
                onClick={() => setPrincipal(String(amt))}
                className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: isActive ? 'rgba(0,200,150,0.15)' : inputBg,
                  border: `1px solid ${isActive ? 'rgba(0,200,150,0.4)' : inputBorder}`,
                  color: isActive ? '#2dd4bf' : 'rgba(156,163,175,1)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = 'rgba(255,255,255,0.2)'
                    el.style.color = 'white'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = inputBorder
                    el.style.color = 'rgba(156,163,175,1)'
                  }
                }}
              >
                ${amt.toLocaleString()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time period */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Time period</span>
        <div className="flex gap-2">
          {PERIODS.map((p, i) => {
            const isActive = periodIdx === i
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => setPeriodIdx(i)}
                className="flex-1 rounded-xl py-2 text-sm font-semibold transition-all"
                style={{
                  background: isActive ? '#00c896' : inputBg,
                  border: `1px solid ${isActive ? '#00c896' : inputBorder}`,
                  color: isActive ? 'white' : 'rgba(156,163,175,1)',
                  boxShadow: isActive ? '0 0 15px rgba(0,200,150,0.3)' : 'none',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Vault selector */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Vault</span>
        <div className="flex flex-wrap gap-2">
          {YO_VAULTS.map((v, i) => {
            const isActive = vaultIdx === i
            return (
              <button
                key={v.address}
                type="button"
                onClick={() => setVaultIdx(i)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: isActive ? 'rgba(0,200,150,0.15)' : inputBg,
                  border: `1px solid ${isActive ? 'rgba(0,200,150,0.5)' : inputBorder}`,
                  color: isActive ? '#5eead4' : 'rgba(156,163,175,1)',
                }}
              >
                {v.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results */}
      <div
        ref={resultRef}
        className="rounded-2xl p-4 space-y-3"
        style={{
          background: 'linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,200,150,0.04))',
          border: '1px solid rgba(0,200,150,0.15)',
          willChange: 'transform',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">You&apos;d earn</span>
          <span className="text-2xl font-black text-teal-400" style={{ textShadow: '0 0 20px rgba(0,200,150,0.4)' }}>
            +${earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Total value</span>
          <span className="text-lg font-semibold text-white">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">APY</span>
          <span className="text-lg font-semibold text-teal-400">{apy.toFixed(2)}%</span>
        </div>
        <div className="h-px" style={{ background: 'rgba(0,200,150,0.1)' }} />
        <p className="text-xs text-gray-600 text-center">
          Estimates based on current APY. Not financial advice.
        </p>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        {onConnect ? (
          <button
            type="button"
            onClick={onConnect}
            className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}
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
