'use client'

import React, { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { ValidationArtifact as ValidationArtifactType } from '@/types/agent'
import { fetchValidationArtifacts, recordValidationArtifacts } from '@/lib/agent/eigencloud'

export interface ValidationArtifactProps {
  walletAddress?: string
  agentId?: string
  artifacts?: ValidationArtifactType
  onRecordingSuccess?: (txHash: string) => void
}

/**
 * ValidationArtifact Component
 * 
 * Displays validation artifacts including TEE attestation, EigenAI inference signature,
 * and RedStone price proof. Allows recording artifacts on-chain via the Validation Registry.
 * 
 * Features:
 * - Display three artifact sections with hashes
 * - Copy-to-clipboard functionality for each hash
 * - Record validation transaction flow
 * - Show pending/success/error states
 * - Responsive card layout matching existing components
 * 
 * Requirements: 4.1-4.10, 12.1-12.9
 */
const ValidationArtifact: React.FC<ValidationArtifactProps> = ({
  walletAddress,
  agentId,
  artifacts: providedArtifacts,
  onRecordingSuccess,
}) => {
  const [artifacts, setArtifacts] = useState<ValidationArtifactType | null>(providedArtifacts || null)
  const [isLoading, setIsLoading] = useState(!providedArtifacts)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [recordingSuccess, setRecordingSuccess] = useState(false)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  // Fetch artifacts if not provided
  useEffect(() => {
    if (providedArtifacts || !agentId) {
      return
    }

    const fetchArtifacts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const fetchedArtifacts = await fetchValidationArtifacts(agentId)
        if (fetchedArtifacts) {
          setArtifacts(fetchedArtifacts)
        } else {
          setError('Failed to fetch validation artifacts')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch validation artifacts')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArtifacts()
  }, [agentId, providedArtifacts])

  // Copy hash to clipboard
  const copyToClipboard = async (hash: string, hashType: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopiedHash(hashType)
      setTimeout(() => setCopiedHash(null), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  // Handle record validation
  const handleRecordValidation = async () => {
    if (!artifacts) {
      setRecordingError('No artifacts to record')
      return
    }

    try {
      setIsRecording(true)
      setRecordingError(null)
      setRecordingSuccess(false)

      const txHash = await recordValidationArtifacts(artifacts)
      if (txHash) {
        setRecordingSuccess(true)
        onRecordingSuccess?.(txHash)
        // Reset success message after 5 seconds
        setTimeout(() => setRecordingSuccess(false), 5000)
      } else {
        setRecordingError('Failed to record validation artifacts')
      }
    } catch (err) {
      setRecordingError(err instanceof Error ? err.message : 'Failed to record validation artifacts')
    } finally {
      setIsRecording(false)
    }
  }

  // Truncate hash for display
  const truncateHash = (hash: string, length: number = 20): string => {
    if (hash.length <= length) return hash
    return `${hash.substring(0, length)}...`
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
      <div className="validation-artifact-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div>
            <Skeleton height={24} width="60%" />
            <Skeleton height={16} width="80%" className="mt-2" />
          </div>
          <div className="space-y-3">
            <Skeleton height={80} />
            <Skeleton height={80} />
            <Skeleton height={80} />
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!artifacts) {
    return (
      <div className="validation-artifact-card h-full" style={cardBase}>
        <div className="h-[3px] w-full" style={{ background: 'rgba(239, 68, 68, 0.5)' }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Validation Artifacts</h3>
            <p className="text-sm text-gray-400 mb-4">{error || 'No validation artifacts available'}</p>
            {error && (
              <button
                onClick={() => {
                  setIsLoading(true)
                  setError(null)
                  if (agentId) {
                    fetchValidationArtifacts(agentId).then((data) => {
                      if (data) {
                        setArtifacts(data)
                      } else {
                        setError('Failed to fetch validation artifacts')
                      }
                      setIsLoading(false)
                    })
                  }
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
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="validation-artifact-card h-full"
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
          <h3 className="text-lg font-bold text-white">Validation Artifacts</h3>
          <p className="text-xs text-gray-500 mt-1">Cryptographic proof bundle</p>
        </div>

        {/* Artifact Sections */}
        <div className="space-y-3 flex-1">
          {/* TEE Attestation */}
          <div
            className="p-4 rounded-lg border transition-all"
            style={{
              background: 'rgba(34, 197, 94, 0.05)',
              borderColor: 'rgba(34, 197, 94, 0.2)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">TEE Attestation</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-green-400 font-mono break-all">
                    {truncateHash(artifacts.teeHash)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(artifacts.teeHash, 'tee')}
                    className="flex-shrink-0 p-1 rounded hover:bg-green-900/30 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedHash === 'tee' ? (
                      <span className="text-xs text-green-400">✓</span>
                    ) : (
                      <span className="text-xs text-gray-500">📋</span>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Status: {artifacts.teeVerified ? '✓ Verified' : '⚠ Unverified'}
                </p>
              </div>
            </div>
          </div>

          {/* EigenAI Inference */}
          <div
            className="p-4 rounded-lg border transition-all"
            style={{
              background: 'rgba(59, 130, 246, 0.05)',
              borderColor: 'rgba(59, 130, 246, 0.2)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">EigenAI Inference</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-blue-400 font-mono break-all">
                    {truncateHash(artifacts.eigenaiSignature)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(artifacts.eigenaiSignature, 'eigenai')}
                    className="flex-shrink-0 p-1 rounded hover:bg-blue-900/30 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedHash === 'eigenai' ? (
                      <span className="text-xs text-blue-400">✓</span>
                    ) : (
                      <span className="text-xs text-gray-500">📋</span>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Model: {artifacts.eigenaiModel}</p>
              </div>
            </div>
          </div>

          {/* RedStone Price Proof */}
          <div
            className="p-4 rounded-lg border transition-all"
            style={{
              background: 'rgba(168, 85, 247, 0.05)',
              borderColor: 'rgba(168, 85, 247, 0.2)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">RedStone Price Proof</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-purple-400 font-mono break-all">
                    {truncateHash(artifacts.redstoneProof)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(artifacts.redstoneProof, 'redstone')}
                    className="flex-shrink-0 p-1 rounded hover:bg-purple-900/30 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedHash === 'redstone' ? (
                      <span className="text-xs text-purple-400">✓</span>
                    ) : (
                      <span className="text-xs text-gray-500">📋</span>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Timestamp: {new Date(artifacts.redstoneTimestamp * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recording Status and Button */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          {recordingSuccess && (
            <div className="p-3 rounded-lg bg-green-900/20 border border-green-700/30">
              <p className="text-xs text-green-400">✓ Validation recorded successfully</p>
            </div>
          )}
          {recordingError && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/30">
              <p className="text-xs text-red-400">{recordingError}</p>
            </div>
          )}
          <button
            onClick={handleRecordValidation}
            disabled={isRecording}
            className="w-full px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            style={{
              background: isRecording
                ? 'rgba(99, 102, 241, 0.5)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
            onMouseEnter={(e) => {
              if (!isRecording) {
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
            {isRecording ? 'Recording Validation...' : 'Record Validation'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ValidationArtifact
