/**
 * Integration Test: Validation Artifact Recording Flow
 *
 * Tests the full validation artifact flow through the service layer:
 * Connect wallet → View artifacts → Record validation → Verify recording
 *
 * Requirements: 4.1-4.10
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { fetchValidationArtifacts, recordValidationArtifacts } from '../../eigencloud'
import { validateArtifactCompleteness } from '../../validationArtifact'
import { ValidationArtifact } from '@/types/agent'

const AGENT_ID = 'agent-validation-001'

const MOCK_ARTIFACT: ValidationArtifact = {
  teeHash: '0xtee1234567890abcdef',
  teeVerified: true,
  eigenaiSignature: '0xeigenai1234567890ab',
  eigenaiModel: 'v1.2.0',
  redstoneProof: '0xredstone1234567890',
  redstoneTimestamp: 1700000000,
}

describe('Integration: Validation Artifact Recording Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  test('full flow: fetch artifacts → validate completeness → record on-chain', async () => {
    // Step 1: Mock artifact fetch
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_ARTIFACT,
    })

    // Step 2: Fetch artifacts
    const artifacts = await fetchValidationArtifacts(AGENT_ID)
    expect(artifacts).not.toBeNull()
    expect(artifacts!.teeHash).toBe(MOCK_ARTIFACT.teeHash)
    expect(artifacts!.teeVerified).toBe(true)
    expect(artifacts!.eigenaiSignature).toBe(MOCK_ARTIFACT.eigenaiSignature)

    // Verify correct API call
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/agent/validation-artifacts?agentId=${AGENT_ID}`
    )

    // Step 3: Validate artifact completeness before recording
    const isComplete = validateArtifactCompleteness(artifacts!)
    expect(isComplete).toBe(true)

    // Step 4: Mock record-validation API
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ txHash: '0xvalidation123' }),
    })

    // Step 5: Record artifacts on-chain
    const txHash = await recordValidationArtifacts(artifacts!)
    expect(txHash).toBe('0xvalidation123')

    // Verify correct API call
    expect(global.fetch).toHaveBeenCalledWith('/api/agent/record-validation', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(MOCK_ARTIFACT),
    }))
  })

  test('full flow: unverified TEE artifact is still recordable', async () => {
    const unverifiedArtifact: ValidationArtifact = {
      ...MOCK_ARTIFACT,
      teeVerified: false,
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => unverifiedArtifact,
    })

    const artifacts = await fetchValidationArtifacts(AGENT_ID)
    expect(artifacts!.teeVerified).toBe(false)

    // Completeness check still passes (teeVerified is a boolean, not required to be true)
    expect(validateArtifactCompleteness(artifacts!)).toBe(true)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ txHash: '0xvalidation456' }),
    })

    const txHash = await recordValidationArtifacts(artifacts!)
    expect(txHash).toBe('0xvalidation456')
  })

  test('fetch failure returns null and recording is skipped', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    })

    const artifacts = await fetchValidationArtifacts(AGENT_ID)
    expect(artifacts).toBeNull()

    // No recording should happen when fetch fails
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  test('record failure returns null', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_ARTIFACT,
    })

    const artifacts = await fetchValidationArtifacts(AGENT_ID)
    expect(artifacts).not.toBeNull()

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    })

    const txHash = await recordValidationArtifacts(artifacts!)
    expect(txHash).toBeNull()
  })

  test('invalid agent ID returns null artifacts', async () => {
    const artifacts = await fetchValidationArtifacts('')
    expect(artifacts).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
