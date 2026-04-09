'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import AgentIdentity from './AgentIdentity'
import TradeIntent from './TradeIntent'
import RiskRouter from './RiskRouter'
import ValidationArtifact from './ValidationArtifact'
import ReputationScore from './ReputationScore'
import CapitalSandbox from './CapitalSandbox'
import AgentActivity from './AgentActivity'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchAgentIdentity } from '@/lib/agent/agentService'
import { AgentIdentity as AgentIdentityType } from '@/types/agent'

export interface AgentDashboardProps {
  walletAddress?: string
}

// Dark design system card style matching the rest of the app
const darkCardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 20,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 220,
}

/**
 * AgentDashboard Component
 *
 * Main layout component that orchestrates all agent dashboard sub-components.
 * Displays a responsive grid of 8 interconnected components for managing
 * autonomous trading agents.
 *
 * Requirements: 8.1-8.10, 12.1-12.9
 */
const AgentDashboard: React.FC<AgentDashboardProps> = ({
  walletAddress: propWalletAddress,
}) => {
  const { address: connectedAddress, isConnected } = useAccount()
  const walletAddress = propWalletAddress || connectedAddress

  const [agentIdentity, setAgentIdentity] = useState<AgentIdentityType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch agent identity on mount and when wallet changes
  useEffect(() => {
    const loadAgentIdentity = async () => {
      if (!walletAddress) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const identity = await fetchAgentIdentity(walletAddress)
        setAgentIdentity(identity)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent identity')
      } finally {
        setLoading(false)
      }
    }

    loadAgentIdentity()
  }, [walletAddress])

  // Show wallet connection prompt if not connected
  if (!isConnected || !walletAddress) {
    return (
      <div
        className="min-h-screen p-4 sm:p-6 lg:p-8"
        style={{ background: '#0a0f1a' }}
      >
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h1 className="text-3xl font-bold text-white mb-4">Agent Dashboard</h1>
            <p className="text-gray-400 mb-6">
              Connect your wallet to access the agent dashboard and manage your trading operations.
            </p>
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <p className="text-indigo-300 text-sm">
                Please connect your wallet using the button in the top navigation to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div
        className="min-h-screen p-4 sm:p-6 lg:p-8"
        style={{ background: '#0a0f1a' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Agent Dashboard</h1>
            <p className="text-gray-500 font-mono text-sm">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={i} style={darkCardStyle}>
                  <div
                    className="h-[3px] w-full"
                    style={{ background: 'rgba(99, 102, 241, 0.3)' }}
                  />
                  <div className="p-6 space-y-4 flex-1">
                    <Skeleton height={24} width="60%" />
                    <Skeleton height={16} width="80%" />
                    <Skeleton height={16} width="50%" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  // Get vault addresses for RiskRouter (placeholder - would come from agent data)
  const vaultAddresses = agentIdentity?.capabilities?.includes('trading')
    ? ['0x1234567890123456789012345678901234567890']
    : []

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ background: '#0a0f1a' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Agent Dashboard</h1>
          <p className="text-gray-500 font-mono text-sm">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div
            className="mb-6 rounded-xl p-4"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Responsive grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Row 1 */}
          <DashboardErrorBoundary>
            <AgentIdentity
              walletAddress={walletAddress}
              onRegistrationSuccess={() => {
                fetchAgentIdentity(walletAddress).then(setAgentIdentity)
              }}
            />
          </DashboardErrorBoundary>

          <DashboardErrorBoundary>
            <TradeIntent
              walletAddress={walletAddress}
              agentId={agentIdentity?.id || ''}
              onTradeSubmitted={() => {
                // Refresh agent data after trade submission
              }}
            />
          </DashboardErrorBoundary>

          <DashboardErrorBoundary>
            <RiskRouter
              walletAddress={walletAddress}
              vaultAddresses={vaultAddresses}
            />
          </DashboardErrorBoundary>

          {/* Row 2 */}
          <DashboardErrorBoundary>
            <ValidationArtifact
              walletAddress={walletAddress}
              onRecordingSuccess={() => {
                // Refresh validation data after recording
              }}
            />
          </DashboardErrorBoundary>

          <DashboardErrorBoundary>
            <ReputationScore
              walletAddress={walletAddress}
              agentId={agentIdentity?.id || ''}
            />
          </DashboardErrorBoundary>

          <DashboardErrorBoundary>
            <CapitalSandbox
              walletAddress={walletAddress}
              onClaimSuccess={() => {
                // Refresh sandbox data after claim
              }}
            />
          </DashboardErrorBoundary>

          {/* Row 3 - Full width */}
          <div className="sm:col-span-2 lg:col-span-3">
            <DashboardErrorBoundary>
              <AgentActivity
                walletAddress={walletAddress}
                agentId={agentIdentity?.id || ''}
              />
            </DashboardErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * DashboardErrorBoundary Component
 *
 * Catches component errors and displays a dark-themed error state
 * without affecting other dashboard components.
 */
interface DashboardErrorBoundaryProps {
  children: React.ReactNode
}

interface DashboardErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('[DashboardErrorBoundary]', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: '#111827',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 220,
          }}
        >
          <div
            className="h-[3px] w-full"
            style={{ background: 'rgba(239, 68, 68, 0.5)' }}
          />
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
            <h3 className="text-base font-semibold text-white mb-2">Component Error</h3>
            <p className="text-red-400 text-sm mb-4">
              {this.state.error?.message || 'An error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AgentDashboard
