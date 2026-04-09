/**
 * Tests for EigenCloud TEE Attestation Service
 * 
 * Tests the fetchValidationArtifacts and recordValidationArtifacts functions
 * to ensure correct behavior for validation artifact handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchValidationArtifacts, recordValidationArtifacts } from '../eigencloud'
import { ValidationArtifact } from '@/types/agent'

describe('eigencloud - EigenCloud TEE Attestation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchValidationArtifacts', () => {
    it('should fetch validation artifacts successfully', async () => {
      const mockArtifacts: ValidationArtifact = {
        teeHash: 'hash_0x123',
        teeVerified: true,
        eigenaiSignature: 'sig_0x456',
        eigenaiModel: 'v1.0',
        redstoneProof: 'proof_0x789',
        redstoneTimestamp: Date.now(),
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockArtifacts),
        } as Response)
      )

      const result = await fetchValidationArtifacts('agent-123')

      expect(result).toEqual(mockArtifacts)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/agent/validation-artifacts?agentId=agent-123'
      )
    })

    it('should return null on fetch failure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Not Found',
        } as Response)
      )

      const result = await fetchValidationArtifacts('agent-123')

      expect(result).toBeNull()
    })

    it('should return null on invalid response structure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'data' }),
        } as Response)
      )

      const result = await fetchValidationArtifacts('agent-123')

      expect(result).toBeNull()
    })

    it('should return null on network error', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

      const result = await fetchValidationArtifacts('agent-123')

      expect(result).toBeNull()
    })

    it('should return null for invalid agentId', async () => {
      const result = await fetchValidationArtifacts('')

      expect(result).toBeNull()
    })

    it('should validate all required fields in response', async () => {
      const incompleteArtifacts = {
        teeHash: 'hash_0x123',
        // Missing other required fields
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(incompleteArtifacts),
        } as Response)
      )

      const result = await fetchValidationArtifacts('agent-123')

      expect(result).toBeNull()
    })
  })

  describe('recordValidationArtifacts', () => {
    it('should record validation artifacts successfully', async () => {
      const mockArtifacts: ValidationArtifact = {
        teeHash: 'hash_0x123',
        teeVerified: true,
        eigenaiSignature: 'sig_0x456',
        eigenaiModel: 'v1.0',
        redstoneProof: 'proof_0x789',
        redstoneTimestamp: Date.now(),
      }

      const mockTxHash = 'tx_0xabc123'

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ txHash: mockTxHash }),
        } as Response)
      )

      const result = await recordValidationArtifacts(mockArtifacts)

      expect(result).toBe(mockTxHash)
      expect(global.fetch).toHaveBeenCalledWith('/api/agent/record-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockArtifacts),
      })
    })

    it('should return null on fetch failure', async () => {
      const mockArtifacts: ValidationArtifact = {
        teeHash: 'hash_0x123',
        teeVerified: true,
        eigenaiSignature: 'sig_0x456',
        eigenaiModel: 'v1.0',
        redstoneProof: 'proof_0x789',
        redstoneTimestamp: Date.now(),
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Error',
        } as Response)
      )

      const result = await recordValidationArtifacts(mockArtifacts)

      expect(result).toBeNull()
    })

    it('should return null on invalid response structure', async () => {
      const mockArtifacts: ValidationArtifact = {
        teeHash: 'hash_0x123',
        teeVerified: true,
        eigenaiSignature: 'sig_0x456',
        eigenaiModel: 'v1.0',
        redstoneProof: 'proof_0x789',
        redstoneTimestamp: Date.now(),
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'data' }),
        } as Response)
      )

      const result = await recordValidationArtifacts(mockArtifacts)

      expect(result).toBeNull()
    })

    it('should return null on network error', async () => {
      const mockArtifacts: ValidationArtifact = {
        teeHash: 'hash_0x123',
        teeVerified: true,
        eigenaiSignature: 'sig_0x456',
        eigenaiModel: 'v1.0',
        redstoneProof: 'proof_0x789',
        redstoneTimestamp: Date.now(),
      }

      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

      const result = await recordValidationArtifacts(mockArtifacts)

      expect(result).toBeNull()
    })

    it('should return null for null artifacts', async () => {
      const result = await recordValidationArtifacts(null as any)

      expect(result).toBeNull()
    })

    it('should validate artifact structure before recording', async () => {
      const incompleteArtifacts = {
        teeHash: 'hash_0x123',
        // Missing other required fields
      } as any

      const result = await recordValidationArtifacts(incompleteArtifacts)

      expect(result).toBeNull()
    })
  })
})
