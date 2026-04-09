'use client'

import React, { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { RiskRating } from '@/types/agent'
import { fetchRiskRatings, subscribeToRiskUpdates, mapRiskLevelToColor } from '@/lib/agent/credora'

export interface RiskRouterProps {
  walletAddress: string
  vaultAddresses: string[]
}

/**
 * RiskRouter Component
 * 
 * Displays Credora risk ratings for vault positions in table format.
 * Shows position limits, maximum leverage, and daily loss limits.
 * Color-codes status based on risk level (low/medium/high).
 * Polls every 60 seconds for updates.
 * 
 * Features:
 * - Display risk ratings in table format
 * - Color-code status (low/medium/high)
 * - Poll every 60 seconds for updates
 * - Show tooltips on hover
 * - Responsive card-based layout on mobile
 * - Loading skeleton and error states
 * 
 * Requirements: 3.1-3.9, 12.1-12.9
 */
const RiskRouter: React.FC<RiskRouterProps> = ({ walletAddress, vaultAddresses }) => {
  const [ratings, setRatings] = useState<RiskRating[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null)

  // Fetch initial ratings and subscribe to updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const initializeRatings = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch initial ratings
        const initialRatings = await fetchRiskRatings(vaultAddresses)
        if (initialRatings) {
          setRatings(initialRatings)
        } else {
          setError('Failed to fetch risk ratings')
        }

        // Subscribe to updates
        unsubscribe = subscribeToRiskUpdates(vaultAddresses, (updatedRatings) => {
          setRatings(updatedRatings)
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch risk ratings')
      } finally {
        setIsLoading(false)
      }
    }

    if (vaultAddresses && vaultAddresses.length > 0) {
      initializeRatings()
    } else {
      setIsLoading(false)
      setRatings([])
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [vaultAddresses])

  // Get color for risk level
  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high'): { bg: string; text: string; border: string; badge: string } => {
    switch (riskLevel) {
      case 'low':
        return {
          bg: 'rgba(34, 197, 94, 0.1)',
          text: '#86efac',
          border: 'rgba(34, 197, 94, 0.2)',
          badge: 'bg-green-500/20 text-green-300',
        }
      case 'medium':
        return {
          bg: 'rgba(251, 146, 60, 0.1)',
          text: '#fdba74',
          border: 'rgba(251, 146, 60, 0.2)',
          badge: 'bg-amber-500/20 text-amber-300',
        }
      case 'high':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          text: '#fca5a5',
          border: 'rgba(239, 68, 68, 0.2)',
          badge: 'bg-red-500/20 text-red-300',
        }
      default:
        return {
          bg: 'rgba(107, 114, 128, 0.1)',
          text: '#d1d5db',
          border: 'rgba(107, 114, 128, 0.2)',
          badge: 'bg-gray-500/20 text-gray-300',
        }
    }
  }

  // Format large numbers for display
  const formatNumber = (value: bigint | number): string => {
    const num = typeof value === 'bigint' ? Number(value) : value
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B'
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M'
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K'
    }
    return num.toFixed(2)
  }

  // Tooltip content
  const tooltips = {
    positionLimit: 'Maximum position size allowed in this vault',
    maxLeverage: 'Maximum leverage ratio allowed for trading',
    dailyLossLimit: 'Maximum daily loss threshold before trading is restricted',
    status: 'Risk classification: Low (safe), Medium (moderate), High (risky)',
  }

  // Card styling matching existing vault cards
  const cardBase: React.CSSProperties = {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 300,
    transition: 'all 300ms cubic-bezier(0.34,1.56,0.64,1)',
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="risk-router-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div>
            <Skeleton height={24} width="60%" />
            <Skeleton height={16} width="80%" className="mt-2" />
          </div>
          <div className="space-y-3">
            <Skeleton height={50} />
            <Skeleton height={50} />
            <Skeleton height={50} />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="risk-router-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(239, 68, 68, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Risk Ratings</h3>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => {
                setIsLoading(true)
                setError(null)
                fetchRiskRatings(vaultAddresses).then((data) => {
                  if (data) {
                    setRatings(data)
                  } else {
                    setError('Failed to fetch risk ratings')
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

  // Empty state
  if (ratings.length === 0) {
    return (
      <div className="risk-router-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Risk Ratings</h3>
            <p className="text-sm text-gray-400">No vaults available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="risk-router-card h-full"
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
          <h3 className="text-lg font-bold text-white">Risk Ratings</h3>
          <p className="text-xs text-gray-500 mt-1">Credora vault risk assessment</p>
        </div>

        {/* Table - Desktop View */}
        <div className="hidden sm:block flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Vault
                </th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Position Limit
                    <div
                      className="relative"
                      onMouseEnter={() => setHoveredTooltip('positionLimit')}
                      onMouseLeave={() => setHoveredTooltip(null)}
                    >
                      <span className="text-gray-500 cursor-help">?</span>
                      {hoveredTooltip === 'positionLimit' && (
                        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap z-10 border border-gray-700">
                          {tooltips.positionLimit}
                        </div>
                      )}
                    </div>
                  </div>
                </th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Max Leverage
                    <div
                      className="relative"
                      onMouseEnter={() => setHoveredTooltip('maxLeverage')}
                      onMouseLeave={() => setHoveredTooltip(null)}
                    >
                      <span className="text-gray-500 cursor-help">?</span>
                      {hoveredTooltip === 'maxLeverage' && (
                        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap z-10 border border-gray-700">
                          {tooltips.maxLeverage}
                        </div>
                      )}
                    </div>
                  </div>
                </th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Daily Loss Limit
                    <div
                      className="relative"
                      onMouseEnter={() => setHoveredTooltip('dailyLossLimit')}
                      onMouseLeave={() => setHoveredTooltip(null)}
                    >
                      <span className="text-gray-500 cursor-help">?</span>
                      {hoveredTooltip === 'dailyLossLimit' && (
                        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap z-10 border border-gray-700">
                          {tooltips.dailyLossLimit}
                        </div>
                      )}
                    </div>
                  </div>
                </th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Status
                    <div
                      className="relative"
                      onMouseEnter={() => setHoveredTooltip('status')}
                      onMouseLeave={() => setHoveredTooltip(null)}
                    >
                      <span className="text-gray-500 cursor-help">?</span>
                      {hoveredTooltip === 'status' && (
                        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap z-10 border border-gray-700">
                          {tooltips.status}
                        </div>
                      )}
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((rating) => {
                const riskColor = getRiskColor(rating.riskLevel)
                return (
                  <tr key={rating.vaultAddress} className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-3 text-white font-medium">{rating.vaultName}</td>
                    <td className="py-3 px-3 text-gray-300">{formatNumber(rating.positionLimit)}</td>
                    <td className="py-3 px-3 text-gray-300">{rating.maxLeverage.toFixed(1)}x</td>
                    <td className="py-3 px-3 text-gray-300">{formatNumber(rating.dailyLossLimit)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${riskColor.badge}`}
                        style={{
                          background: riskColor.bg,
                          color: riskColor.text,
                          border: `1px solid ${riskColor.border}`,
                        }}
                      >
                        {rating.riskLevel.charAt(0).toUpperCase() + rating.riskLevel.slice(1)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Card-based layout - Mobile View */}
        <div className="sm:hidden flex-1 space-y-3 overflow-y-auto">
          {ratings.map((rating) => {
            const riskColor = getRiskColor(rating.riskLevel)
            return (
              <div
                key={rating.vaultAddress}
                className="p-4 rounded-lg border transition-all"
                style={{
                  background: riskColor.bg,
                  borderColor: riskColor.border,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{rating.vaultName}</p>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${riskColor.badge}`}
                    style={{
                      background: riskColor.bg,
                      color: riskColor.text,
                      border: `1px solid ${riskColor.border}`,
                    }}
                  >
                    {rating.riskLevel.charAt(0).toUpperCase() + rating.riskLevel.slice(1)}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Position Limit:</span>
                    <span className="text-gray-200 font-medium">{formatNumber(rating.positionLimit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Leverage:</span>
                    <span className="text-gray-200 font-medium">{rating.maxLeverage.toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily Loss Limit:</span>
                    <span className="text-gray-200 font-medium">{formatNumber(rating.dailyLossLimit)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-600 text-center pt-2 border-t border-gray-800">
          Updates every 60 seconds
        </div>
      </div>
    </div>
  )
}

export default RiskRouter
