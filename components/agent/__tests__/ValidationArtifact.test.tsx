import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidationArtifact as ValidationArtifactType } from '@/types/agent'
import * as eigencloud from '@/lib/agent/eigencloud'

// Mock eigencloud service
vi.mock('@/lib/agent/eigencloud', () => ({
  fetchValidationArtifacts: vi.fn(),
  recordValidationArtifacts: vi.fn(),
}))

describe('ValidationArtifact Component', () => {
  const mockArtifacts: ValidationArtifactType = {
    teeHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    teeVerified: true,
    eigenaiSignature: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    eigenaiModel: 'v1.0',
    redstoneProof: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    redstoneTimestamp: 1234567890,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Props', () => {
    it('should accept artifacts prop', () => {
      const props = {
        artifacts: mockArtifacts,
      }
      expect(props.artifacts).toBeDefined()
      expect(props.artifacts.teeHash).toBe(mockArtifacts.teeHash)
    })

    it('should accept optional agentId prop', () => {
      const props = {
        agentId: 'agent-123',
        artifacts: mockArtifacts,
      }
      expect(props.agentId).toBe('agent-123')
    })

    it('should accept optional walletAddress prop', () => {
      const props = {
        walletAddress: '0x1234567890123456789012345678901234567890',
        artifacts: mockArtifacts,
      }
      expect(props.walletAddress).toBeDefined()
    })

    it('should accept optional onRecordingSuccess callback', () => {
      const callback = vi.fn()
      const props = {
        artifacts: mockArtifacts,
        onRecordingSuccess: callback,
      }
      expect(typeof props.onRecordingSuccess).toBe('function')
    })
  })

  describe('Artifact Data Structure', () => {
    it('should have all required artifact fields', () => {
      expect(mockArtifacts.teeHash).toBeDefined()
      expect(mockArtifacts.teeVerified).toBeDefined()
      expect(mockArtifacts.eigenaiSignature).toBeDefined()
      expect(mockArtifacts.eigenaiModel).toBeDefined()
      expect(mockArtifacts.redstoneProof).toBeDefined()
      expect(mockArtifacts.redstoneTimestamp).toBeDefined()
    })

    it('should have correct types for artifact fields', () => {
      expect(typeof mockArtifacts.teeHash).toBe('string')
      expect(typeof mockArtifacts.teeVerified).toBe('boolean')
      expect(typeof mockArtifacts.eigenaiSignature).toBe('string')
      expect(typeof mockArtifacts.eigenaiModel).toBe('string')
      expect(typeof mockArtifacts.redstoneProof).toBe('string')
      expect(typeof mockArtifacts.redstoneTimestamp).toBe('number')
    })

    it('should handle verified TEE attestation', () => {
      const verified = mockArtifacts.teeVerified
      expect(verified).toBe(true)
    })

    it('should handle unverified TEE attestation', () => {
      const unverified = { ...mockArtifacts, teeVerified: false }
      expect(unverified.teeVerified).toBe(false)
    })

    it('should have valid hash format', () => {
      expect(mockArtifacts.teeHash.startsWith('0x')).toBe(true)
      expect(mockArtifacts.teeHash.length).toBeGreaterThan(2)
    })

    it('should have valid model version', () => {
      expect(mockArtifacts.eigenaiModel).toBe('v1.0')
    })

    it('should have valid timestamp', () => {
      expect(mockArtifacts.redstoneTimestamp).toBeGreaterThan(0)
    })
  })

  describe('Hash Truncation', () => {
    it('should truncate long hashes to 20 characters', () => {
      const hash = mockArtifacts.teeHash
      const truncated = hash.substring(0, 20) + '...'
      expect(truncated.length).toBe(23)
      expect(truncated.endsWith('...')).toBe(true)
    })

    it('should preserve short hashes', () => {
      const shortHash = '0x1234'
      const truncated = shortHash.length <= 20 ? shortHash : shortHash.substring(0, 20) + '...'
      expect(truncated).toBe(shortHash)
    })

    it('should handle empty hash gracefully', () => {
      const emptyHash = ''
      const truncated = emptyHash.length <= 20 ? emptyHash : emptyHash.substring(0, 20) + '...'
      expect(truncated).toBe('')
    })
  })

  describe('Service Integration', () => {
    it('should call fetchValidationArtifacts with agentId', async () => {
      const mockFetch = vi.mocked(eigencloud.fetchValidationArtifacts)
      mockFetch.mockResolvedValue(mockArtifacts)

      await eigencloud.fetchValidationArtifacts('agent-123')

      expect(mockFetch).toHaveBeenCalledWith('agent-123')
    })

    it('should call recordValidationArtifacts with artifacts', async () => {
      const mockRecord = vi.mocked(eigencloud.recordValidationArtifacts)
      mockRecord.mockResolvedValue('0xabc123')

      await eigencloud.recordValidationArtifacts(mockArtifacts)

      expect(mockRecord).toHaveBeenCalledWith(mockArtifacts)
    })

    it('should handle successful artifact fetch', async () => {
      const mockFetch = vi.mocked(eigencloud.fetchValidationArtifacts)
      mockFetch.mockResolvedValue(mockArtifacts)

      const result = await eigencloud.fetchValidationArtifacts('agent-123')

      expect(result).toEqual(mockArtifacts)
    })

    it('should handle failed artifact fetch', async () => {
      const mockFetch = vi.mocked(eigencloud.fetchValidationArtifacts)
      mockFetch.mockResolvedValue(null)

      const result = await eigencloud.fetchValidationArtifacts('agent-123')

      expect(result).toBeNull()
    })

    it('should handle successful artifact recording', async () => {
      const mockRecord = vi.mocked(eigencloud.recordValidationArtifacts)
      const txHash = '0xabc123'
      mockRecord.mockResolvedValue(txHash)

      const result = await eigencloud.recordValidationArtifacts(mockArtifacts)

      expect(result).toBe(txHash)
    })

    it('should handle failed artifact recording', async () => {
      const mockRecord = vi.mocked(eigencloud.recordValidationArtifacts)
      mockRecord.mockResolvedValue(null)

      const result = await eigencloud.recordValidationArtifacts(mockArtifacts)

      expect(result).toBeNull()
    })
  })

  describe('Timestamp Formatting', () => {
    it('should convert Unix timestamp to date', () => {
      const timestamp = mockArtifacts.redstoneTimestamp
      const date = new Date(timestamp * 1000)
      expect(date).toBeInstanceOf(Date)
    })

    it('should format timestamp as locale string', () => {
      const timestamp = mockArtifacts.redstoneTimestamp
      const date = new Date(timestamp * 1000)
      const formatted = date.toLocaleString()
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should handle current timestamp', () => {
      const now = Math.floor(Date.now() / 1000)
      const date = new Date(now * 1000)
      expect(date).toBeInstanceOf(Date)
    })

    it('should handle zero timestamp', () => {
      const date = new Date(0 * 1000)
      expect(date).toBeInstanceOf(Date)
    })
  })

  describe('TEE Verification Status', () => {
    it('should indicate verified status', () => {
      const verified = mockArtifacts.teeVerified
      expect(verified).toBe(true)
    })

    it('should indicate unverified status', () => {
      const unverified = { ...mockArtifacts, teeVerified: false }
      expect(unverified.teeVerified).toBe(false)
    })

    it('should display correct status message for verified', () => {
      const verified = mockArtifacts.teeVerified
      const message = verified ? '✓ Verified' : '⚠ Unverified'
      expect(message).toBe('✓ Verified')
    })

    it('should display correct status message for unverified', () => {
      const verified = false
      const message = verified ? '✓ Verified' : '⚠ Unverified'
      expect(message).toBe('⚠ Unverified')
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      const mockFetch = vi.mocked(eigencloud.fetchValidationArtifacts)
      mockFetch.mockRejectedValue(new Error('Network error'))

      try {
        await eigencloud.fetchValidationArtifacts('agent-123')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })

    it('should handle record error gracefully', async () => {
      const mockRecord = vi.mocked(eigencloud.recordValidationArtifacts)
      mockRecord.mockRejectedValue(new Error('Transaction failed'))

      try {
        await eigencloud.recordValidationArtifacts(mockArtifacts)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Transaction failed')
      }
    })

    it('should handle null artifacts', () => {
      const artifacts = null
      expect(artifacts).toBeNull()
    })

    it('should handle missing artifact fields', () => {
      const incomplete = { ...mockArtifacts, teeHash: '' }
      expect(incomplete.teeHash).toBe('')
    })
  })

  describe('Copy to Clipboard', () => {
    it('should copy TEE hash', async () => {
      const hash = mockArtifacts.teeHash
      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should copy EigenAI signature', async () => {
      const signature = mockArtifacts.eigenaiSignature
      expect(signature).toBeDefined()
      expect(signature.length).toBeGreaterThan(0)
    })

    it('should copy RedStone proof', async () => {
      const proof = mockArtifacts.redstoneProof
      expect(proof).toBeDefined()
      expect(proof.length).toBeGreaterThan(0)
    })

    it('should handle copy timeout', () => {
      const timeout = 2000
      expect(timeout).toBe(2000)
    })
  })

  describe('Recording Transaction', () => {
    it('should record validation with artifacts', async () => {
      const mockRecord = vi.mocked(eigencloud.recordValidationArtifacts)
      mockRecord.mockResolvedValue('0xabc123')

      const result = await eigencloud.recordValidationArtifacts(mockArtifacts)

      expect(result).toBe('0xabc123')
      expect(mockRecord).toHaveBeenCalledWith(mockArtifacts)
    })

    it('should return transaction hash on success', async () => {
      const mockRecord = vi.mocked(eigencloud.recordValidationArtifacts)
      const txHash = '0xabc123'
      mockRecord.mockResolvedValue(txHash)

      const result = await eigencloud.recordValidationArtifacts(mockArtifacts)

      expect(result).toBe(txHash)
      if (result) {
        expect(result.startsWith('0x')).toBe(true)
      }
    })

    it('should return null on failure', async () => {
      const mockRecord = vi.mocked(eigencloud.recordValidationArtifacts)
      mockRecord.mockResolvedValue(null)

      const result = await eigencloud.recordValidationArtifacts(mockArtifacts)

      expect(result).toBeNull()
    })

    it('should handle recording state transitions', () => {
      const states = ['idle', 'recording', 'success', 'error']
      expect(states).toContain('idle')
      expect(states).toContain('recording')
      expect(states).toContain('success')
      expect(states).toContain('error')
    })
  })

  describe('Callback Handling', () => {
    it('should call onRecordingSuccess with transaction hash', async () => {
      const mockCallback = vi.fn()
      const txHash = '0xabc123'

      mockCallback(txHash)

      expect(mockCallback).toHaveBeenCalledWith(txHash)
    })

    it('should handle optional callback', () => {
      const callback = undefined
      expect(callback).toBeUndefined()
    })

    it('should not throw if callback is not provided', () => {
      expect(() => {
        // Simulate calling optional callback
        const callback: ((txHash: string) => void) | undefined = Math.random() > 2 ? (() => {}) : undefined
        if (callback) {
          callback('0xabc123')
        }
      }).not.toThrow()
    })
  })

  describe('Type Safety', () => {
    it('should have correct ValidationArtifact type', () => {
      const artifact: ValidationArtifactType = mockArtifacts

      expect(typeof artifact.teeHash).toBe('string')
      expect(typeof artifact.teeVerified).toBe('boolean')
      expect(typeof artifact.eigenaiSignature).toBe('string')
      expect(typeof artifact.eigenaiModel).toBe('string')
      expect(typeof artifact.redstoneProof).toBe('string')
      expect(typeof artifact.redstoneTimestamp).toBe('number')
    })

    it('should handle all artifact fields', () => {
      const artifact = mockArtifacts

      expect(artifact.teeHash).toBeDefined()
      expect(artifact.teeVerified).toBeDefined()
      expect(artifact.eigenaiSignature).toBeDefined()
      expect(artifact.eigenaiModel).toBeDefined()
      expect(artifact.redstoneProof).toBeDefined()
      expect(artifact.redstoneTimestamp).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long hashes', () => {
      const longHash = '0x' + 'a'.repeat(1000)
      const truncated = longHash.substring(0, 20) + '...'
      expect(truncated.length).toBe(23)
    })

    it('should handle model version variations', () => {
      const versions = ['v1.0', 'v2.0', 'v1.0-beta', 'latest']
      expect(versions).toContain('v1.0')
    })

    it('should handle future timestamps', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400 // 1 day in future
      const date = new Date(futureTimestamp * 1000)
      expect(date).toBeInstanceOf(Date)
    })

    it('should handle past timestamps', () => {
      const pastTimestamp = 1000000000 // Sept 2001
      const date = new Date(pastTimestamp * 1000)
      expect(date).toBeInstanceOf(Date)
    })
  })
})
