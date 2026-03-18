'use client'

import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'earnbutton_risk_dismissed'

export default function RiskWarning() {
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="w-full rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 flex items-start gap-3" role="alert">
      <svg className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <div className="flex-1 text-sm text-yellow-800">
        <span className="font-semibold">DeFi Risk Warning: </span>
        Depositing into yield vaults involves smart contract risk, liquidity risk, and potential loss of funds. Only deposit what you can afford to lose.
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded-lg bg-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-800 hover:bg-yellow-300 transition-colors whitespace-nowrap"
      >
        I understand
      </button>
    </div>
  )
}
