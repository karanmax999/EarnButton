'use client'

import React, { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { ReputationMetrics } from '@/types/agent'
import { fetchReputationMetrics, subscribeToReputationUpdates } from '@/lib/agent/erc8004'

export interface ReputationScoreProps {
  walletAddress?: string
  agentId: string
}

/**
 * ReputationScore Component
 * 
 * Displays on-chain reputation metrics from ERC-8004 Reputation Registry.
 * Shows Sharpe ratio, drawdown percentage, and validation score with color-coding.
 * Polls every 30 seconds for updates.
 * 
 * Features:
 * - Display Sharpe ratio, drawdown, validation score
 * - Color-code metrics based on thresholds
 * - Poll every 30 seconds for updates
 * - Show loading skeleton and error states
 * - Responsive card layout matching existing components
 * 
 * Requirements: 5.1-5.13, 12.1-12.9
 */
const ReputationScore: React.FC<ReputationScoreProps> = ({ agentId }) => {
  const [metrics, setMetrics] = useState<ReputationMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial metrics and subscribe to updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const initializeMetrics = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch initial metrics
        const initialMetrics = await fetchReputationMetrics(agentId)
        if (initialMetrics) {
          setMetrics(initialMetrics)
        } else {
          setError('Failed to fetch reputation metrics')
        }

        // Subscribe to updates
        unsubscribe = subscribeToReputationUpdates(agentId, (updatedMetrics) => {
          setMetrics(updatedMetrics)
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reputation metrics')
      } finally {
        setIsLoading(false)
      }
    }

    initializeMetrics()

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [agentId])

  // Determine color for Sharpe ratio
  const getSharpeColor = (sharpeRatio: number): { bg: string; text: string; border: string } => {
    if (sharpeRatio > 1.0) {
      return {
        bg: 'rgba(34, 197, 94, 0.1)',
        text: '#86efac',
        border: 'rgba(34, 197, 94, 0.2)',
      }
    } else if (sharpeRatio >= 0.5) {
      return {
        bg: 'rgba(251, 146, 60, 0.1)',
        text: '#fdba74',
        border: 'rgba(251, 146, 60, 0.2)',
      }
    } else {
      return {
        bg: 'rgba(239, 68, 68, 0.1)',
        text: '#fca5a5',
        border: 'rgba(239, 68, 68, 0.2)',
      }
    }
  }

  // Determine color for drawdown
  const getDrawdownColor = (drawdown: number): { bg: string; text: string; border: string } => {
    if (drawdown < 10) {
      return {
        bg: 'rgba(34, 197, 94, 0.1)',
        text: '#86efac',
        border: 'rgba(34, 197, 94, 0.2)',
      }
    } else if (drawdown <= 25) {
      return {
        bg: 'rgba(251, 146, 60, 0.1)',
        text: '#fdba74',
        border: 'rgba(251, 146, 60, 0.2)',
      }
    } else {
      return {
        bg: 'rgba(239, 68, 68, 0.1)',
        text: '#fca5a5',
        border: 'rgba(239, 68, 68, 0.2)',
      }
    }
  }

  // Determine color for validation score
  const getValidationColor = (score: number): { bg: string; text: string; border: string } => {
    if (score > 95) {
      return {
        bg: 'rgba(34, 197, 94, 0.1)',
        text: '#86efac',
        border: 'rgba(34, 197, 94, 0.2)',
      }
    } else if (score >= 80) {
      return {
        bg: 'rgba(251, 146, 60, 0.1)',
        text: '#fdba74',
        border: 'rgba(251, 146, 60, 0.2)',
      }
    } else {
      return {
        bg: 'rgba(239, 68, 68, 0.1)',
        text: '#fca5a5',
        border: 'rgba(239, 68, 68, 0.2)',
      }
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
      <div className="reputation-score-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div>
            <Skeleton height={24} width="60%" />
            <Skeleton height={16} width="80%" className="mt-2" />
          </div>
          <div className="space-y-3">
            <Skeleton height={60} />
            <Skeleton height={60} />
            <Skeleton height={60} />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !metrics) {
    return (
      <div className="reputation-score-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(239, 68, 68, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Reputation Score</h3>
            <p className="text-sm text-gray-400 mb-4">{error || 'Failed to load reputation metrics'}</p>
            <button
              onClick={() => {
                setIsLoading(true)
                setError(null)
                fetchReputationMetrics(agentId).then((data) => {
                  if (data) {
                    setMetrics(data)
                  } else {
                    setError('Failed to fetch reputation metrics')
                  }
                  setIsLoading(false)
                })
              }}
              className="px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all min-h-[44px]"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.3)'
                el.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.boxShadow = 'none'
                el.style.transform = 'none'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const sharpeColor = getSharpeColor(metrics.sharpeRatio)
  const drawdownColor = getDrawdownColor(metrics.drawdownPercentage)
  const validationColor = getValidationColor(metrics.validationScore)

  return (
    <div
      className="reputation-score-card h-full"
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
        <div>
          <h3 className="text-lg font-bold text-white">Reputation Score</h3>
          <p className="text-xs text-gray-500 mt-1">On-chain performance metrics</p>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-3 flex-1">
          {/* Sharpe Ratio */}
          <div
            className="p-4 rounded-lg border transition-all"
            style={{
              background: sharpeColor.bg,
              borderColor: sharpeColor.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sharpe Ratio</p>
                <p className="text-2xl font-bold" style={{ color: sharpeColor.text }}>
                  {metrics.sharpeRatio.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {metrics.sharpeRatio > 1.0 ? '✓ Excellent' : metrics.sharpeRatio >= 0.5 ? '⚠ Good' : '✗ Low'}
                </p>
              </div>
            </div>
          </div>

          {/* Drawdown */}
          <div
            className="p-4 rounded-lg border transition-all"
            style={{
              background: drawdownColor.bg,
              borderColor: drawdownColor.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Max Drawdown</p>
                <p className="text-2xl font-bold" style={{ color: drawdownColor.text }}>
                  {metrics.drawdownPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {metrics.drawdownPercentage < 10 ? '✓ Low' : metrics.drawdownPercentage <= 25 ? '⚠ Moderate' : '✗ High'}
                </p>
              </div>
            </div>
          </div>

          {/* Validation Score */}
          <div
            className="p-4 rounded-lg border transition-all"
            style={{
              background: validationColor.bg,
              borderColor: validationColor.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Validation Score</p>
                <p className="text-2xl font-bold" style={{ color: validationColor.text }}>
                  {metrics.validationScore.toFixed(0)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {metrics.validationScore > 95 ? '✓ Excellent' : metrics.validationScore >= 80 ? '⚠ Good' : '✗ Low'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-600 text-center pt-2 border-t border-gray-800">
          Updated {new Date(metrics.updatedAt * 1000).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

export default ReputationScore
