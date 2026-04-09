'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Trade } from '@/types/agent'
import { fetchTradeHistory } from '@/lib/agent/tradeService'
import { Skeleton } from '@/components/ui/Skeleton'

export interface AgentActivityProps {
  walletAddress: string
  agentId: string
}

/**
 * AgentActivity Component
 *
 * Displays chronological trade history (newest first) with expandable details.
 * Fetches trades from backend API and polls for new trades every 10 seconds.
 * Supports pagination (10 trades per page).
 *
 * Requirements: 7.1-7.10, 12.1-12.9
 */
export const AgentActivity: React.FC<AgentActivityProps> = ({
  agentId,
}) => {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const TRADES_PER_PAGE = 10
  const POLL_INTERVAL = 10000 // 10 seconds

  const loadTrades = useCallback(async (page: number, isPolling = false) => {
    try {
      if (!isPolling) setError(null)
      const offset = (page - 1) * TRADES_PER_PAGE
      const data = await fetchTradeHistory(agentId, TRADES_PER_PAGE, offset)

      if (Array.isArray(data)) {
        // Sort newest first by timestamp
        const sorted = [...data].sort((a, b) => b.timestamp - a.timestamp)
        setTrades(sorted)
        setHasMore(data.length === TRADES_PER_PAGE)
      }
    } catch (err) {
      if (!isPolling) {
        setError(err instanceof Error ? err.message : 'Failed to load trades')
      }
    } finally {
      if (!isPolling) setLoading(false)
    }
  }, [agentId])

  // Initial load
  useEffect(() => {
    setLoading(true)
    loadTrades(currentPage)
  }, [agentId, currentPage, loadTrades])

  // Polling every 10 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadTrades(currentPage, true)
    }, POLL_INTERVAL)
    return () => clearInterval(pollInterval)
  }, [agentId, currentPage, loadTrades])

  const handleRetry = () => {
    setLoading(true)
    loadTrades(currentPage)
  }

  const toggleExpandedTrade = (tradeId: string) => {
    setExpandedTradeId(expandedTradeId === tradeId ? null : tradeId)
  }

  const openBlockExplorer = (txHash: string) => {
    window.open(`https://etherscan.io/tx/${txHash}`, '_blank')
  }

  // Card styling matching existing vault cards (dark design system)
  const cardBase: React.CSSProperties = {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 300ms cubic-bezier(0.34,1.56,0.64,1)',
  }

  const getStatusStyle = (status: Trade['status']): React.CSSProperties => {
    switch (status) {
      case 'pending':
        return {
          background: 'rgba(251, 146, 60, 0.1)',
          color: '#fdba74',
          border: '1px solid rgba(251, 146, 60, 0.2)',
        }
      case 'confirmed':
        return {
          background: 'rgba(34, 197, 94, 0.1)',
          color: '#86efac',
          border: '1px solid rgba(34, 197, 94, 0.2)',
        }
      case 'failed':
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#fca5a5',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }
      default:
        return {
          background: 'rgba(107, 114, 128, 0.1)',
          color: '#9ca3af',
          border: '1px solid rgba(107, 114, 128, 0.2)',
        }
    }
  }

  // Loading state
  if (loading && trades.length === 0) {
    return (
      <div className="agent-activity-card" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.5)' }} />
        <div className="p-6 space-y-4">
          <Skeleton height={24} width="40%" />
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} height={48} borderRadius="0.5rem" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && trades.length === 0) {
    return (
      <div className="agent-activity-card" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(239, 68, 68, 0.5)' }} />
        <div className="p-6 flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-bold text-white mb-2">Trade History</h3>
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRetry}
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
    )
  }

  // Empty state
  if (trades.length === 0) {
    return (
      <div className="agent-activity-card" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.5)' }} />
        <div className="p-6 flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-bold text-white mb-2">Trade History</h3>
          <p className="text-sm text-gray-500">No trades yet</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="agent-activity-card"
      style={cardBase}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(99, 102, 241, 0.3)'
        el.style.boxShadow = '0 0 30px rgba(99, 102, 241, 0.06)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.06)'
        el.style.boxShadow = 'none'
      }}
    >
      <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Trade History</h3>
            <p className="text-xs text-gray-500 mt-0.5">Chronological trade log</p>
          </div>
          <span className="text-xs text-gray-600">Page {currentPage}</span>
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="text-left py-2 px-2 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Timestamp
                </th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Asset Pair
                </th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Amount
                </th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Direction
                </th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Price
                </th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <React.Fragment key={trade.id}>
                  <tr
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onClick={() => toggleExpandedTrade(trade.id)}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLTableRowElement
                      el.style.background = 'rgba(255,255,255,0.03)'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLTableRowElement
                      el.style.background = 'transparent'
                    }}
                  >
                    <td className="py-3 px-2 text-gray-400 text-xs">
                      {new Date(trade.timestamp * 1000).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-white font-medium">{trade.assetPair}</td>
                    <td className="py-3 px-2 text-gray-300 font-mono text-xs">
                      {trade.amount.toString()}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className="font-semibold text-xs"
                        style={{
                          color: trade.direction === 'buy' ? '#86efac' : '#fca5a5',
                        }}
                      >
                        {trade.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-300">${trade.executionPrice.toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={getStatusStyle(trade.status)}
                      >
                        {trade.status}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded details row */}
                  {expandedTradeId === trade.id && (
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td colSpan={6} className="py-4 px-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {trade.txHash && (
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                                Transaction Hash
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openBlockExplorer(trade.txHash!)
                                }}
                                className="text-xs font-mono break-all text-left transition-colors"
                                style={{ color: '#818cf8' }}
                                onMouseEnter={(e) => {
                                  const el = e.currentTarget as HTMLButtonElement
                                  el.style.color = '#a5b4fc'
                                  el.style.textDecoration = 'underline'
                                }}
                                onMouseLeave={(e) => {
                                  const el = e.currentTarget as HTMLButtonElement
                                  el.style.color = '#818cf8'
                                  el.style.textDecoration = 'none'
                                }}
                              >
                                {trade.txHash}
                              </button>
                            </div>
                          )}
                          {trade.gasUsed !== undefined && (
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Gas Used</p>
                              <p className="text-xs font-mono text-gray-300">
                                {trade.gasUsed.toString()}
                              </p>
                            </div>
                          )}
                          {trade.slippage !== undefined && (
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Slippage</p>
                              <p className="text-xs font-mono text-gray-300">
                                {trade.slippage.toFixed(2)}%
                              </p>
                            </div>
                          )}
                          {trade.validationArtifacts && (
                            <div className="sm:col-span-2 lg:col-span-3">
                              <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">
                                Validation Artifacts
                              </p>
                              <div
                                className="p-3 rounded-lg space-y-1"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                              >
                                <p className="text-xs font-mono text-gray-400">
                                  <span className="text-gray-600">TEE: </span>
                                  {trade.validationArtifacts.teeHash}
                                  {trade.validationArtifacts.teeVerified && (
                                    <span className="ml-2 text-green-400">✓ Verified</span>
                                  )}
                                </p>
                                <p className="text-xs font-mono text-gray-400">
                                  <span className="text-gray-600">EigenAI: </span>
                                  {trade.validationArtifacts.eigenaiSignature}
                                </p>
                                <p className="text-xs font-mono text-gray-400">
                                  <span className="text-gray-600">RedStone: </span>
                                  {trade.validationArtifacts.redstoneProof}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden space-y-3">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="rounded-xl p-4 cursor-pointer transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onClick={() => toggleExpandedTrade(trade.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-500">
                    {new Date(trade.timestamp * 1000).toLocaleString()}
                  </p>
                  <p className="font-semibold text-white">{trade.assetPair}</p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={getStatusStyle(trade.status)}
                >
                  {trade.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>
                  <span
                    className="font-semibold"
                    style={{ color: trade.direction === 'buy' ? '#86efac' : '#fca5a5' }}
                  >
                    {trade.direction.toUpperCase()}
                  </span>{' '}
                  <span className="text-gray-400 font-mono text-xs">{trade.amount.toString()}</span>
                </span>
                <span className="text-gray-300">${trade.executionPrice.toFixed(2)}</span>
              </div>

              {/* Expanded details */}
              {expandedTradeId === trade.id && (
                <div
                  className="mt-3 pt-3 space-y-2"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {trade.txHash && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Tx Hash</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openBlockExplorer(trade.txHash!)
                        }}
                        className="text-xs font-mono break-all text-left"
                        style={{ color: '#818cf8' }}
                      >
                        {trade.txHash.slice(0, 20)}...
                      </button>
                    </div>
                  )}
                  {trade.gasUsed !== undefined && (
                    <p className="text-xs text-gray-400">
                      <span className="text-gray-600">Gas: </span>
                      {trade.gasUsed.toString()}
                    </p>
                  )}
                  {trade.slippage !== undefined && (
                    <p className="text-xs text-gray-400">
                      <span className="text-gray-600">Slippage: </span>
                      {trade.slippage.toFixed(2)}%
                    </p>
                  )}
                  {trade.validationArtifacts && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Validation Artifacts</p>
                      <div
                        className="p-2 rounded-lg space-y-1"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <p className="text-xs font-mono text-gray-400 truncate">
                          <span className="text-gray-600">TEE: </span>
                          {trade.validationArtifacts.teeHash.slice(0, 16)}...
                        </p>
                        <p className="text-xs font-mono text-gray-400 truncate">
                          <span className="text-gray-600">EigenAI: </span>
                          {trade.validationArtifacts.eigenaiSignature.slice(0, 16)}...
                        </p>
                        <p className="text-xs font-mono text-gray-400 truncate">
                          <span className="text-gray-600">RedStone: </span>
                          {trade.validationArtifacts.redstoneProof.slice(0, 16)}...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div
          className="mt-4 flex justify-between items-center pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-3 rounded-lg text-sm font-medium text-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1) {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = 'rgba(255,255,255,0.08)'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(255,255,255,0.05)'
            }}
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-500">Page {currentPage}</span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!hasMore}
            className="px-4 py-3 rounded-lg text-sm font-medium text-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={(e) => {
              if (hasMore) {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = 'rgba(255,255,255,0.08)'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(255,255,255,0.05)'
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgentActivity
