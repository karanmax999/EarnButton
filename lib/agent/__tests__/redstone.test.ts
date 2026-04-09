/**
 * Tests for RedStone Price Feed Service
 * 
 * Tests the fetchPriceProof and verifyPriceProof functions
 * to ensure correct behavior for price data fetching and verification.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchPriceProof, verifyPriceProof } from '../redstone'

describe('redstone - RedStone Price Feed Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchPriceProof', () => {
    it('should fetch price proof successfully', async () => {
      const mockProof = 'proof_0x123abc'

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ proof: mockProof }),
        } as Response)
      )

      const result = await fetchPriceProof('ETH')

      expect(result).toBe(mockProof)
      expect(global.fetch).toHaveBeenCalledWith('/api/agent/price-proof?asset=ETH')
    })

    it('should return null on fetch failure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Not Found',
        } as Response)
      )

      const result = await fetchPriceProof('ETH')

      expect(result).toBeNull()
    })

    it('should return null on invalid response structure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'data' }),
        } as Response)
      )

      const result = await fetchPriceProof('ETH')

      expect(result).toBeNull()
    })

    it('should return null on network error', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

      const result = await fetchPriceProof('ETH')

      expect(result).toBeNull()
    })

    it('should return null for invalid asset parameter', async () => {
      const result = await fetchPriceProof('')

      expect(result).toBeNull()
    })

    it('should handle different asset types', async () => {
      const mockProof = 'proof_0x456def'

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ proof: mockProof }),
        } as Response)
      )

      const result = await fetchPriceProof('USDC')

      expect(result).toBe(mockProof)
      expect(global.fetch).toHaveBeenCalledWith('/api/agent/price-proof?asset=USDC')
    })
  })

  describe('verifyPriceProof', () => {
    it('should verify price proof successfully', async () => {
      const mockProof = 'proof_0x123abc'

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ valid: true }),
        } as Response)
      )

      const result = await verifyPriceProof(mockProof)

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/agent/verify-price-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proof: mockProof }),
      })
    })

    it('should return false for invalid proof', async () => {
      const mockProof = 'invalid_proof'

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ valid: false }),
        } as Response)
      )

      const result = await verifyPriceProof(mockProof)

      expect(result).toBe(false)
    })

    it('should return false on fetch failure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Error',
        } as Response)
      )

      const result = await verifyPriceProof('proof_0x123abc')

      expect(result).toBe(false)
    })

    it('should return false on invalid response structure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'data' }),
        } as Response)
      )

      const result = await verifyPriceProof('proof_0x123abc')

      expect(result).toBe(false)
    })

    it('should return false on network error', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

      const result = await verifyPriceProof('proof_0x123abc')

      expect(result).toBe(false)
    })

    it('should return false for empty proof', async () => {
      const result = await verifyPriceProof('')

      expect(result).toBe(false)
    })
  })
})
