'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useSignTypedData } from 'wagmi'
import { Skeleton } from '@/components/ui/Skeleton'
import { TradeIntent as TradeIntentType } from '@/types/agent'
import { createTradeIntent, serializeTradeIntent, prettyPrintTradeIntent } from '@/lib/agent/tradeIntent'
import { fetchPriceProof } from '@/lib/agent/redstone'
import { submitTrade, pollTradeStatus } from '@/lib/agent/tradeService'

export interface TradeIntentProps {
  walletAddress?: string
  agentId: string
  onTradeSubmitted?: (txHash: string) => void
}

/**
 * TradeIntent Component
 * 
 * Displays form for composing, previewing, and signing trade intents with EIP-712.
 * Handles asset selection, amount input validation, direction toggle, and trade submission.
 * 
 * Features:
 * - Display form with asset dropdown, amount input, direction toggle
 * - Validate amount input (positive number, within limits)
 * - Show preview of data being signed
 * - Handle EIP-712 signing flow
 * - Attach RedStone price proof
 * - Submit to `/api/agent/trade`
 * - Responsive card layout matching existing vault cards
 * 
 * Requirements: 2.1-2.11, 12.1-12.9
 */
const TradeIntent: React.FC<TradeIntentProps> = ({ walletAddress: propWalletAddress, agentId, onTradeSubmitted }) => {
  const { address: connectedAddress, isConnected } = useAccount()
  const walletAddress = propWalletAddress || connectedAddress
  const { signTypedDataAsync } = useSignTypedData()

  // Form state
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy')
  const [amountError, setAmountError] = useState<string | null>(null)

  // Available assets (in real app, would fetch from vault)
  const availableAssets = ['ETH/USDC', 'BTC/USDC', 'USDC/DAI']

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<TradeIntentType | null>(null)
  const [isSigningState, setIsSigningState] = useState<'idle' | 'signing' | 'fetching-proof' | 'submitting'>('idle')
  const [submitTxHash, setSubmitTxHash] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'pending' | 'confirming' | 'success' | 'error'>('idle')

  // Validate amount input
  const validateAmount = (value: string): boolean => {
    if (!value) {
      setAmountError('Amount is required')
      return false
    }

    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      setAmountError('Amount must be a valid number')
      return false
    }

    if (numValue <= 0) {
      setAmountError('Amount must be positive')
      return false
    }

    // Check reasonable limits (e.g., max 1000 for demo)
    if (numValue > 1000) {
      setAmountError('Amount exceeds maximum limit (1000)')
      return false
    }

    setAmountError(null)
    return true
  }

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)
    if (value) {
      validateAmount(value)
    } else {
      setAmountError(null)
    }
  }

  // Create preview
  const handleShowPreview = () => {
    if (!selectedAsset) {
      setError('Please select an asset')
      return
    }

    if (!validateAmount(amount)) {
      return
    }

    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1e18))
    const intent = createTradeIntent(selectedAsset, amountBigInt, direction, Math.floor(Date.now() / 1000))

    setPreviewData(intent)
    setShowPreview(true)
    setError(null)
  }

  // Handle sign and submit
  const handleSignAndSubmit = async () => {
    if (!previewData || !walletAddress) {
      setError('Missing required data')
      return
    }

    try {
      setIsSigningState('signing')
      setError(null)

      // Sign the trade intent with EIP-712
      const serialized = serializeTradeIntent(previewData)
      const signature = await signTypedDataAsync({
        domain: {
          name: 'EarnButton Agent',
          version: '1',
          chainId: 1,
        },
        types: {
          TradeIntent: [
            { name: 'asset', type: 'string' },
            { name: 'amount', type: 'uint256' },
            { name: 'direction', type: 'string' },
            { name: 'timestamp', type: 'uint256' },
          ],
        },
        primaryType: 'TradeIntent',
        message: {
          asset: previewData.asset,
          amount: previewData.amount,
          direction: previewData.direction,
          timestamp: BigInt(previewData.timestamp),
        },
      })

      // Fetch RedStone price proof
      setIsSigningState('fetching-proof')
      const priceProof = await fetchPriceProof(previewData.asset.split('/')[0])

      if (!priceProof) {
        throw new Error('Failed to fetch price proof')
      }

      // Create signed intent
      const signedIntent: TradeIntentType = {
        ...previewData,
        signature,
        priceProof,
      }

      // Submit trade
      setIsSigningState('submitting')
      setSubmitStatus('pending')

      const response = await submitTrade(signedIntent, priceProof)

      if (!response.success) {
        throw new Error(response.message || 'Trade submission failed')
      }

      setSubmitTxHash(response.txHash)
      setSubmitStatus('confirming')

      // Poll for confirmation
      const confirmedTrade = await pollTradeStatus(response.txHash)

      if (confirmedTrade) {
        setSubmitStatus('success')
        setShowPreview(false)
        setSelectedAsset('')
        setAmount('')
        setPreviewData(null)

        if (onTradeSubmitted) {
          onTradeSubmitted(response.txHash)
        }
      } else {
        throw new Error('Trade confirmation timed out')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign and submit trade')
      setSubmitStatus('error')
    } finally {
      setIsSigningState('idle')
    }
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
      <div className="trade-intent-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(168, 85, 247, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div className="space-y-2">
            <Skeleton height={24} width="60%" />
            <Skeleton height={16} width="80%" />
          </div>
          <div className="space-y-3">
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
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
      <div className="trade-intent-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(168, 85, 247, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Trade Intent</h3>
            <p className="text-sm text-gray-400">Connect your wallet to compose trades</p>
          </div>
        </div>
      </div>
    )
  }

  // Submitting state
  if (submitStatus === 'pending' || submitStatus === 'confirming') {
    return (
      <div className="trade-intent-card h-full" style={cardBase}>
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
              {isSigningState === 'signing' && 'Waiting for signature...'}
              {isSigningState === 'fetching-proof' && 'Fetching price proof...'}
              {isSigningState === 'submitting' && 'Submitting trade...'}
              {submitStatus === 'confirming' && 'Confirming trade...'}
            </h3>
            {submitTxHash && (
              <p className="text-xs text-gray-400 font-mono truncate mt-2">{submitTxHash}</p>
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

  // Success state
  if (submitStatus === 'success') {
    return (
      <div
        className="trade-intent-card h-full"
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
        <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="inline-block mb-4 p-3 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Trade Submitted</h3>
            {submitTxHash && (
              <p className="text-xs text-gray-400 font-mono truncate mt-2">{submitTxHash}</p>
            )}
            <button
              onClick={() => {
                setSubmitStatus('idle')
                setSubmitTxHash(null)
              }}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              New Trade
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Preview state
  if (showPreview && previewData) {
    return (
      <div
        className="trade-intent-card h-full"
        style={cardBase}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(168, 85, 247, 0.3)'
          el.style.boxShadow = '0 0 30px rgba(168, 85, 247, 0.06)'
          el.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(255,255,255,0.06)'
          el.style.boxShadow = 'none'
          el.style.transform = 'none'
        }}
      >
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          {/* Header */}
          <div>
            <h3 className="text-lg font-bold text-white">Review Trade Intent</h3>
            <p className="text-sm text-gray-500 mt-1">Verify the data before signing</p>
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

          {/* Preview data */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            <div
              className="p-3 rounded-lg font-mono text-xs text-gray-300"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <pre className="whitespace-pre-wrap break-words">{prettyPrintTradeIntent(previewData)}</pre>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-auto">
            <button
              onClick={() => {
                setShowPreview(false)
                setPreviewData(null)
              }}
              disabled={isSigningState !== 'idle'}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              Back
            </button>
            <button
              onClick={handleSignAndSubmit}
              disabled={isSigningState !== 'idle'}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #d946ef)',
              }}
              onMouseEnter={(e) => {
                if (isSigningState === 'idle') {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.3)'
                  el.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.boxShadow = 'none'
                el.style.transform = 'none'
              }}
            >
              {isSigningState !== 'idle' ? 'Processing...' : 'Sign & Submit'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Form state (default)
  return (
    <div
      className="trade-intent-card h-full"
      style={cardBase}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(168, 85, 247, 0.3)'
        el.style.boxShadow = '0 0 30px rgba(168, 85, 247, 0.06)'
        el.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.06)'
        el.style.boxShadow = 'none'
        el.style.transform = 'none'
      }}
    >
      <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef)' }} />
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-white">Trade Intent</h3>
          <p className="text-sm text-gray-500 mt-1">Compose and sign a trade order</p>
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

        {/* Form */}
        <div className="space-y-3 flex-1">
          {/* Asset selection */}
          <div>
            <label htmlFor="asset-select" className="block text-xs text-gray-600 uppercase tracking-wider mb-2">
              Asset Pair
            </label>
            <select
              id="asset-select"
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <option value="">Select an asset...</option>
              {availableAssets.map((asset) => (
                <option key={asset} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
          </div>

          {/* Amount input */}
          <div>
            <label htmlFor="amount-input" className="block text-xs text-gray-600 uppercase tracking-wider mb-2">
              Amount
            </label>
            <input
              id="amount-input"
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: amountError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            />
            {amountError && (
              <p className="text-xs text-red-400 mt-1">{amountError}</p>
            )}
          </div>

          {/* Direction toggle */}
          <div>
            <label className="block text-xs text-gray-600 uppercase tracking-wider mb-2">Direction</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDirection('buy')}
                className="flex-1 px-3 py-3 rounded-lg text-sm font-semibold transition-all min-h-[44px]"
                style={{
                  background: direction === 'buy' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.04)',
                  border: direction === 'buy' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                  color: direction === 'buy' ? '#86efac' : '#d1d5db',
                }}
              >
                Buy
              </button>
              <button
                onClick={() => setDirection('sell')}
                className="flex-1 px-3 py-3 rounded-lg text-sm font-semibold transition-all min-h-[44px]"
                style={{
                  background: direction === 'sell' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
                  border: direction === 'sell' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                  color: direction === 'sell' ? '#fca5a5' : '#d1d5db',
                }}
              >
                Sell
              </button>
            </div>
          </div>
        </div>

        {/* Preview button */}
        <button
          onClick={handleShowPreview}
          disabled={!selectedAsset || !amount || !!amountError}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #a855f7, #d946ef)',
          }}
          onMouseEnter={(e) => {
            if (selectedAsset && amount && !amountError) {
              const el = e.currentTarget as HTMLButtonElement
              el.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.3)'
              el.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.boxShadow = 'none'
            el.style.transform = 'none'
          }}
        >
          Review & Sign
        </button>
      </div>
    </div>
  )
}

export default TradeIntent
