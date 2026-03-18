'use client'

import React from 'react'
import { useChainId, useSwitchChain, useAccount } from 'wagmi'
import { base, baseSepolia } from 'viem/chains'

const useTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true'
const TARGET_CHAIN = useTestnet ? baseSepolia : base
const TARGET_CHAIN_NAME = useTestnet ? 'Base Sepolia' : 'Base'

interface NetworkGuardProps {
  children: React.ReactNode
}

export default function NetworkGuard({ children }: NetworkGuardProps) {
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  const { isConnected } = useAccount()

  if (isConnected && chainId !== TARGET_CHAIN.id) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 mx-auto">
            <svg className="h-7 w-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Wrong Network</h2>
            <p className="mt-1 text-sm text-neutral-500">
              EarnButton runs on {TARGET_CHAIN_NAME}. Please switch your network to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={() => switchChain({ chainId: TARGET_CHAIN.id })}
            disabled={isPending}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white
                       hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Switching…' : `Switch to ${TARGET_CHAIN_NAME}`}
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
