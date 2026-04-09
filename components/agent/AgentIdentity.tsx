'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Skeleton } from '@/components/ui/Skeleton'
import { AgentIdentity as AgentIdentityType } from '@/types/agent'
import { fetchAgentIdentity, registerAgent, pollAgentRegistration } from '@/lib/agent/agentService'

export interface AgentIdentityProps {
  walletAddress?: string
  onRegistrationSuccess?: () => void
}

/**
 * AgentIdentity Component
 * 
 * Displays agent ERC-721 registration status and handles registration flow.
 * Shows agent details in read-only mode when registered, or registration form when unregistered.
 * 
 * Features:
 * - Display agent name, ID, wallet address, and capabilities
 * - Show register button when unregistered
 * - Show read-only mode when registered
 * - Handle registration transaction flow with pending/live states
 * - Responsive card layout matching existing vault cards
 * 
 * Requirements: 1.1-1.8, 12.1-12.9
 */
const AgentIdentity: React.FC<AgentIdentityProps> = ({ walletAddress: propWalletAddress, onRegistrationSuccess }) => {
  const { address: connectedAddress, isConnected } = useAccount()
  const walletAddress = propWalletAddress || connectedAddress

  const [agent, setAgent] = useState<AgentIdentityType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agentName, setAgentName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationTxHash, setRegistrationTxHash] = useState<string | null>(null)
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'pending' | 'confirming' | 'live'>('idle')

  // Fetch agent identity on mount or when wallet changes
  useEffect(() => {
    const fetchAgent = async () => {
      if (!walletAddress) {
        setIsLoading(false)
        setAgent(null)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const agentData = await fetchAgentIdentity(walletAddress)
        setAgent(agentData)
        if (agentData) {
          setRegistrationStatus('live')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch agent identity')
        setAgent(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgent()
  }, [walletAddress])

  // Handle agent registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!walletAddress || !agentName.trim()) {
      setError('Please enter an agent name')
      return
    }

    try {
      setIsRegistering(true)
      setError(null)
      setRegistrationStatus('pending')

      // Call registration API
      const response = await registerAgent(agentName, walletAddress)

      if (!response.success) {
        throw new Error(response.message || 'Registration failed')
      }

      setRegistrationTxHash(response.txHash)
      setRegistrationStatus('confirming')

      // Poll for confirmation
      const confirmedAgent = await pollAgentRegistration(walletAddress)
      setAgent(confirmedAgent)
      setRegistrationStatus('live')
      setAgentName('')
      setRegistrationTxHash(null)

      if (onRegistrationSuccess) {
        onRegistrationSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      setRegistrationStatus('idle')
      setRegistrationTxHash(null)
    } finally {
      setIsRegistering(false)
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
      <div className="agent-identity-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div className="space-y-2">
            <Skeleton height={24} width="60%" />
            <Skeleton height={16} width="80%" />
          </div>
          <div className="space-y-2">
            <Skeleton height={16} width="40%" />
            <Skeleton height={20} width="100%" />
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
      <div className="agent-identity-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Agent Identity</h3>
            <p className="text-sm text-gray-400">Connect your wallet to register an agent</p>
          </div>
        </div>
      </div>
    )
  }

  // Registered state - read-only display
  if (agent && registrationStatus === 'live') {
    return (
      <div
        className="agent-identity-card h-full"
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
              <h3 className="text-lg font-bold text-white">{agent.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">{agent.id}</p>
            </div>
            <span
              className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              {agent.status === 'live' ? 'Live' : 'Pending'}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Wallet Address</p>
              <p className="text-sm font-mono text-gray-300 truncate">{agent.walletAddress}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Token ID</p>
              <p className="text-sm font-mono text-gray-300">{agent.tokenId.toString()}</p>
            </div>

            {agent.capabilities && agent.capabilities.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {agent.registeredAt && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Registered</p>
                <p className="text-sm text-gray-400">
                  {new Date(agent.registeredAt * 1000).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Pending/confirming state
  if (registrationStatus === 'pending' || registrationStatus === 'confirming') {
    return (
      <div className="agent-identity-card h-full" style={cardBase}>
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
              {registrationStatus === 'pending' ? 'Registering Agent' : 'Confirming Registration'}
            </h3>
            {registrationTxHash && (
              <p className="text-xs text-gray-400 font-mono truncate mt-2">{registrationTxHash}</p>
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

  // Unregistered state - registration form
  return (
    <div
      className="agent-identity-card h-full"
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
          <h3 className="text-lg font-bold text-white">Register Agent</h3>
          <p className="text-sm text-gray-500 mt-1">Create your agent identity on-chain</p>
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
        <form onSubmit={handleRegister} className="space-y-3 flex-1 flex flex-col">
          <div>
            <label htmlFor="agent-name" className="block text-xs text-gray-600 uppercase tracking-wider mb-2">
              Agent Name
            </label>
            <input
              id="agent-name"
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Enter agent name"
              disabled={isRegistering}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          {/* Submit button */}
          <div className="mt-auto">
            <button
              type="submit"
              disabled={isRegistering || !agentName.trim()}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}
              onMouseEnter={(e) => {
                if (!isRegistering && agentName.trim()) {
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
              {isRegistering ? 'Registering...' : 'Register Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AgentIdentity
