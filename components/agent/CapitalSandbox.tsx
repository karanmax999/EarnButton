'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Skeleton } from '@/components/ui/Skeleton'
import { CapitalSandbox as CapitalSandboxType } from '@/types/agent'
import { fetchSandboxBalance, claimCapital, pollClaimStatus } from '@/lib/agent/sandboxService'

export interface CapitalSandboxProps {
  walletAddress?: string
  onClaimSuccess?: () => void
}

/**
 * CapitalSandbox Component
 * 
 * Displays sandbox vault balance, capital claimed status, and ETH allocation.
 * Handles capital claim transaction flow with pending/confirming states.
 * 
 * Features:
 * - Display sandbox balance in USDC with 2 decimal precision
 * - Show capital claimed status (claimed/unclaimed)
 * - Display ETH allocation for gas fees
 * - Show "Claim Capital" button when unclaimed
 * - Handle claim transaction flow with pending/confirming states
 * - Responsive card layout matching existing vault cards
 * 
 * Requirements: 6.1-6.10, 12.1-12.9
 */
const CapitalSandbox: React.FC<CapitalSandboxProps> = ({ walletAddress: propWalletAddress, onClaimSuccess }) => {
  const { address: connectedAddress, isConnected } = useAccount()
  const walletAddress = propWalletAddress || connectedAddress

  const [sandbox, setSandbox] = useState<CapitalSandboxType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null)
  const [claimStatus, setClaimStatus] = useState<'idle' | 'pending' | 'confirming' | 'live'>('idle')

  // Fetch sandbox balance on mount or when wallet changes
  useEffect(() => {
    const fetchSandbox = async () => {
      if (!walletAddress) {
        setIsLoading(false)
        setSandbox(null)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const sandboxData = await fetchSandboxBalance(walletAddress)
        setSandbox(sandboxData)
        if (sandboxData?.claimed) {
          setClaimStatus('live')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sandbox balance')
        setSandbox(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSandbox()
  }, [walletAddress])

  // Handle capital claim
  const handleClaim = async () => {
    if (!walletAddress) {
      setError('Wallet not connected')
      return
    }

    try {
      setIsClaiming(true)
      setError(null)
      setClaimStatus('pending')

      // Submit claim transaction
      const txHash = await claimCapital(walletAddress)

      if (!txHash) {
        throw new Error('Failed to submit capital claim')
      }

      setClaimTxHash(txHash)
      setClaimStatus('confirming')

      // Poll for confirmation
      const confirmedSandbox = await pollClaimStatus(txHash)
      if (confirmedSandbox) {
        setSandbox(confirmedSandbox)
        setClaimStatus('live')
        setClaimTxHash(null)

        if (onClaimSuccess) {
          onClaimSuccess()
        }
      } else {
        throw new Error('Claim confirmation timed out')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim capital')
      setClaimStatus('idle')
      setClaimTxHash(null)
    } finally {
      setIsClaiming(false)
    }
  }

  // Format balance to 2 decimal places
  const formatBalance = (balance: bigint): string => {
    const balanceNum = Number(balance) / 1e6 // Assuming 6 decimals for USDC
    return balanceNum.toFixed(2)
  }

  // Format ETH allocation
  const formatEthAllocation = (allocation: bigint): string => {
    const allocationNum = Number(allocation) / 1e18 // 18 decimals for ETH
    return allocationNum.toFixed(4)
  }

  // Card styling matching existing vault cards
  const cardBase: React.CSSProperties = {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 220,
    transition: 'all 300ms cubic-bezier(0.34,1.56,0.64,1)',
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="capital-sandbox-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(34, 197, 94, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div className="space-y-2">
            <Skeleton height={24} width="60%" />
            <Skeleton height={16} width="80%" />
          </div>
          <div className="space-y-3">
            <div>
              <Skeleton height={14} width="40%" />
              <Skeleton height={20} width="100%" className="mt-2" />
            </div>
            <div>
              <Skeleton height={14} width="40%" />
              <Skeleton height={20} width="100%" className="mt-2" />
            </div>
          </div>
          <div className="mt-auto">
            <Skeleton height={44} />
          </div>
        </div>
      </div>
    )
  }

  // Not connected state
  if (!isConnected || !walletAddress) {
    return (
      <div className="capital-sandbox-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(34, 197, 94, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Capital Sandbox</h3>
            <p className="text-sm text-gray-400">Connect your wallet to view sandbox balance</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !sandbox) {
    return (
      <div className="capital-sandbox-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(239, 68, 68, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Capital Sandbox</h3>
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <button
              onClick={() => {
                setIsLoading(true)
                setError(null)
                fetchSandboxBalance(walletAddress).then((data) => {
                  setSandbox(data)
                  setIsLoading(false)
                }).catch((err) => {
                  setError(err instanceof Error ? err.message : 'Failed to fetch')
                  setIsLoading(false)
                })
              }}
              className="px-4 py-3 rounded-lg text-sm font-semibold text-white min-h-[44px]"
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Pending/confirming state
  if (claimStatus === 'pending' || claimStatus === 'confirming') {
    return (
      <div className="capital-sandbox-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(251, 146, 60, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="inline-block mb-4">
              <div
                className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"
                style={{
                  animation: 'spin 1s linear infinite',
                }}
              />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {claimStatus === 'pending' ? 'Submitting Claim' : 'Confirming Claim'}
            </h3>
            {claimTxHash && (
              <p className="text-xs text-gray-400 font-mono truncate mt-2">{claimTxHash}</p>
            )}
          </div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Claimed state - read-only display
  if (sandbox && sandbox.claimed) {
    return (
      <div
        className="capital-sandbox-card h-full"
        style={cardBase}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(34, 197, 94, 0.3)'
          el.style.boxShadow = '0 0 30px rgba(34, 197, 94, 0.06)'
          el.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(255,255,255,0.06)'
          el.style.boxShadow = 'none'
          el.style.transform = 'none'
        }}
      >
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #22c55e, #10b981)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white">Capital Sandbox</h3>
              <p className="text-xs text-gray-500 mt-0.5">Test trading environment</p>
            </div>
            <span
              className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#86efac',
                border: '1px solid rgba(34, 197, 94, 0.2)',
              }}
            >
              Claimed
            </span>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Sandbox Balance</p>
              <p className="text-2xl font-bold text-white">${formatBalance(sandbox.balance)}</p>
              <p className="text-xs text-gray-500 mt-1">USDC</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">ETH Allocation</p>
              <p className="text-lg font-semibold text-gray-300">{formatEthAllocation(sandbox.ethAllocation)} ETH</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Vault Address</p>
              <p className="text-xs font-mono text-gray-400 truncate">{sandbox.vaultAddress}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Unclaimed state - with claim button
  if (sandbox && !sandbox.claimed) {
    return (
      <div
        className="capital-sandbox-card h-full"
        style={cardBase}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(99, 102, 241, 0.3)'
          el.style.boxShadow = '0 0 30px rgba(99, 102, 241, 0.06)'
          el.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(255,255,255,0.06)'
          el.style.boxShadow = 'none'
          el.style.transform = 'none'
        }}
      >
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white">Capital Sandbox</h3>
              <p className="text-xs text-gray-500 mt-0.5">Test trading environment</p>
            </div>
            <span
              className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: 'rgba(251, 146, 60, 0.1)',
                color: '#fdba74',
                border: '1px solid rgba(251, 146, 60, 0.2)',
              }}
            >
              Unclaimed
            </span>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          {/* Details */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-white">${formatBalance(sandbox.balance)}</p>
              <p className="text-xs text-gray-500 mt-1">USDC</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">ETH Allocation</p>
              <p className="text-lg font-semibold text-gray-300">{formatEthAllocation(sandbox.ethAllocation)} ETH</p>
            </div>
          </div>

          {/* Claim button */}
          <div className="mt-auto">
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}
              onMouseEnter={(e) => {
                if (!isClaiming) {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.3)'
                  el.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.boxShadow = 'none'
                el.style.transform = 'none'
              }}
            >
              {isClaiming ? 'Claiming...' : 'Claim Capital'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback - no sandbox data
  return (
    <div className="capital-sandbox-card h-full" style={cardBase}>
      <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.5)' }} />
      <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-2">Capital Sandbox</h3>
          <p className="text-sm text-gray-400">No sandbox data available</p>
        </div>
      </div>
    </div>
  )
}

export default CapitalSandbox
