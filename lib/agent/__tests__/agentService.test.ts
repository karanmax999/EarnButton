/**
 * Agent Service Tests
 * 
 * Tests for agent registration, identity fetching, and registration polling.
 * Validates Requirements: 1.2, 1.3, 1.4, 1.8, 11.1
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  registerAgent,
  fetchAgentIdentity,
  pollAgentRegistration,
  clearAgentIdentityCache,
} from '../agentService'
import { AgentIdentity } from '@/types/agent'

describe('agentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearAgentIdentityCache()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('registerAgent', () => {
    test('should successfully register an agent', async () => {
      const mockResponse = {
        success: true,
        agentId: 'agent-123',
        txHash: '0x123abc',
        message: 'Agent registered successfully',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await registerAgent('My Agent', '0x1234567890123456789012345678901234567890')

      expect(result.success).toBe(true)
      expect(result.agentId).toBe('agent-123')
      expect(result.txHash).toBe('0x123abc')
    })

    test('should handle registration failure', async () => {
      const mockError = {
        message: 'Invalid agent name',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      })

      const result = await registerAgent('', '0x1234567890123456789012345678901234567890')

      expect(result.success).toBe(false)
    })

    test('should reject invalid wallet address', async () => {
      const result = await registerAgent('My Agent', '')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid wallet address')
    })

    test('should reject invalid agent name', async () => {
      const result = await registerAgent('', '0x1234567890123456789012345678901234567890')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid agent name')
    })

    test('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await registerAgent('My Agent', '0x1234567890123456789012345678901234567890')

      expect(result.success).toBe(false)
    })
  })

  describe('fetchAgentIdentity', () => {
    test('should fetch agent identity successfully', async () => {
      const mockAgent: AgentIdentity = {
        id: 'agent-123',
        name: 'My Agent',
        walletAddress: '0x1234567890123456789012345678901234567890',
        tokenId: BigInt('1'),
        capabilities: ['trading', 'validation'],
        registeredAt: 1234567890,
        status: 'live',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgent,
      })

      const result = await fetchAgentIdentity('0x1234567890123456789012345678901234567890')

      expect(result).toEqual(mockAgent)
      expect(result?.tokenId).toBe(BigInt('1'))
    })

    test('should return null when agent not found', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await fetchAgentIdentity('0x1234567890123456789012345678901234567890')

      expect(result).toBeNull()
    })

    test('should handle invalid wallet address', async () => {
      const result = await fetchAgentIdentity('')

      expect(result).toBeNull()
    })

    test('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchAgentIdentity('0x1234567890123456789012345678901234567890')

      expect(result).toBeNull()
    })

    test('should validate response structure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'agent-123',
          // Missing required fields
        }),
      })

      const result = await fetchAgentIdentity('0x1234567890123456789012345678901234567890')

      expect(result).toBeNull()
    })

    test('should convert tokenId from string to bigint', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'agent-123',
          name: 'My Agent',
          walletAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '123',
          capabilities: [],
          registeredAt: 1234567890,
          status: 'live',
        }),
      })

      const result = await fetchAgentIdentity('0x1234567890123456789012345678901234567890')

      expect(result?.tokenId).toBe(BigInt('123'))
    })
  })

  describe('pollAgentRegistration', () => {
    test('should poll until agent is found', async () => {
      const mockAgent: AgentIdentity = {
        id: 'agent-123',
        name: 'My Agent',
        walletAddress: '0x1234567890123456789012345678901234567890',
        tokenId: BigInt('1'),
        capabilities: ['trading'],
        registeredAt: 1234567890,
        status: 'live',
      }

      // First call returns 404, second call returns agent
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAgent,
        })

      const result = await pollAgentRegistration('0x1234567890123456789012345678901234567890')

      expect(result?.id).toBe('agent-123')
    })

    test('should handle invalid wallet address', async () => {
      const result = await pollAgentRegistration('')

      expect(result).toBeNull()
    })
  })
})
