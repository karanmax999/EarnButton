/**
 * Sandbox Service Tests
 * 
 * Tests for sandbox balance fetching, capital claiming, and claim status polling.
 * Validates Requirements: 6.1-6.7, 11.1
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  fetchSandboxBalance,
  claimCapital,
  pollClaimStatus,
} from '../sandboxService'
import { CapitalSandbox } from '@/types/agent'

describe('sandboxService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchSandboxBalance', () => {
    test('should fetch sandbox balance successfully', async () => {
      const mockSandbox: CapitalSandbox = {
        vaultAddress: '0xvault123',
        balance: BigInt('1000000000'),
        claimed: false,
        ethAllocation: BigInt('1000000000000000000'),
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSandbox,
      })

      const result = await fetchSandboxBalance('0x1234567890123456789012345678901234567890')

      expect(result).toEqual(mockSandbox)
      expect(result?.balance).toBe(BigInt('1000000000'))
      expect(result?.ethAllocation).toBe(BigInt('1000000000000000000'))
    })

    test('should handle claimed capital', async () => {
      const mockSandbox: CapitalSandbox = {
        vaultAddress: '0xvault123',
        balance: BigInt('0'),
        claimed: true,
        ethAllocation: BigInt('0'),
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSandbox,
      })

      const result = await fetchSandboxBalance('0x1234567890123456789012345678901234567890')

      expect(result?.claimed).toBe(true)
      expect(result?.balance).toBe(BigInt('0'))
    })

    test('should handle invalid wallet address', async () => {
      const result = await fetchSandboxBalance('')

      expect(result).toBeNull()
    })

    test('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchSandboxBalance('0x1234567890123456789012345678901234567890')

      expect(result).toBeNull()
    })

    test('should validate response structure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          vaultAddress: '0xvault123',
          // Missing required fields
        }),
      })

      const result = await fetchSandboxBalance('0x1234567890123456789012345678901234567890')

      expect(result).toBeNull()
    })

    test('should convert balance from string to bigint', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          vaultAddress: '0xvault123',
          balance: '1000000000',
          claimed: false,
          ethAllocation: '1000000000000000000',
        }),
      })

      const result = await fetchSandboxBalance('0x1234567890123456789012345678901234567890')

      expect(result?.balance).toBe(BigInt('1000000000'))
      expect(result?.ethAllocation).toBe(BigInt('1000000000000000000'))
    })
  })

  describe('claimCapital', () => {
    test('should successfully submit capital claim', async () => {
      const mockResponse = {
        txHash: '0x123abc',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await claimCapital('0x1234567890123456789012345678901234567890')

      expect(result).toBe('0x123abc')
    })

    test('should handle claim failure', async () => {
      const mockError = {
        message: 'Capital already claimed',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      })

      const result = await claimCapital('0x1234567890123456789012345678901234567890')

      expect(result).toBeNull()
    })

    test('should reject invalid wallet address', async () => {
      const result = await claimCapital('')

      expect(result).toBeNull()
    })

    test('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await claimCapital('0x1234567890123456789012345678901234567890')

      expect(result).toBeNull()
    })

    test('should validate response structure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing txHash
        }),
      })

      const result = await claimCapital('0x1234567890123456789012345678901234567890')

      expect(result).toBeNull()
    })
  })

  describe('pollClaimStatus', () => {
    test('should poll until claim is confirmed', async () => {
      const mockSandbox: CapitalSandbox = {
        vaultAddress: '0xvault123',
        balance: BigInt('1000000000'),
        claimed: true,
        ethAllocation: BigInt('0'),
      }

      // First call returns unclaimed, second call returns claimed
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockSandbox,
            claimed: false,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSandbox,
        })

      const result = await pollClaimStatus('0x123abc')

      expect(result?.claimed).toBe(true)
      expect(result?.vaultAddress).toBe('0xvault123')
    })

    test('should handle invalid transaction hash', async () => {
      const result = await pollClaimStatus('')

      expect(result).toBeNull()
    })

    test('should convert balance from string to bigint', async () => {
      const mockSandbox = {
        vaultAddress: '0xvault123',
        balance: '1000000000',
        claimed: true,
        ethAllocation: '1000000000000000000',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSandbox,
      })

      const result = await pollClaimStatus('0x123abc')

      expect(result?.balance).toBe(BigInt('1000000000'))
      expect(result?.ethAllocation).toBe(BigInt('1000000000000000000'))
    })
  })
})
