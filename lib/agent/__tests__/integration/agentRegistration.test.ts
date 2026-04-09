/**
 * Integration Test: Agent Registration Flow
 *
 * Tests the full agent registration flow through the service layer:
 * Connect wallet → Register agent → Verify registration
 *
 * Requirements: 1.1-1.8
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { registerAgent, fetchAgentIdentity, pollAgentRegistration, clearAgentIdentityCache } from '../../agentService'
import { AgentIdentity, AgentRegisterResponse } from '@/types/agent'

const WALLET = '0xDeadBeefDeadBeefDeadBeefDeadBeefDeadBeef'

describe('Integration: Agent Registration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearAgentIdentityCache()
    global.fetch = vi.fn()
  })

  test('full flow: register agent then verify identity', async () => {
    // Step 1: Mock registration API response
    const registerResponse: AgentRegisterResponse = {
      success: true,
      agentId: 'agent-001',
      txHash: '0xabc123',
      message: 'Agent registered',
    }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => registerResponse,
    })

    // Step 2: Register the agent
    const regResult = await registerAgent('Integration Agent', WALLET)
    expect(regResult.success).toBe(true)
    expect(regResult.agentId).toBe('agent-001')
    expect(regResult.txHash).toBe('0xabc123')

    // Verify the correct API call was made
    expect(global.fetch).toHaveBeenCalledWith('/api/agent/register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Integration Agent', walletAddress: WALLET }),
    }))

    // Step 3: Mock identity fetch response
    const identityResponse: AgentIdentity = {
      id: 'agent-001',
      name: 'Integration Agent',
      walletAddress: WALLET,
      tokenId: BigInt('1'),
      capabilities: ['trading'],
      registeredAt: 1700000000,
      status: 'live',
    }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...identityResponse, tokenId: '1' }),
    })

    // Step 4: Fetch and verify identity
    const identity = await fetchAgentIdentity(WALLET)
    expect(identity).not.toBeNull()
    expect(identity!.id).toBe('agent-001')
    expect(identity!.name).toBe('Integration Agent')
    expect(identity!.walletAddress).toBe(WALLET)
    expect(identity!.tokenId).toBe(BigInt('1'))
    expect(identity!.status).toBe('live')
  })

  test('full flow: register then poll for confirmation', async () => {
    // Step 1: Register
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, agentId: 'agent-002', txHash: '0xdef456' }),
    })

    const regResult = await registerAgent('Polling Agent', WALLET)
    expect(regResult.success).toBe(true)

    // Step 2: Poll — first attempt returns 404, second returns identity
    const identityResponse: AgentIdentity = {
      id: 'agent-002',
      name: 'Polling Agent',
      walletAddress: WALLET,
      tokenId: BigInt('2'),
      capabilities: ['trading', 'validation'],
      registeredAt: 1700000001,
      status: 'live',
    }
    ;(global.fetch as any)
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...identityResponse, tokenId: '2' }),
      })

    const polled = await pollAgentRegistration(WALLET)
    expect(polled).not.toBeNull()
    expect(polled!.id).toBe('agent-002')
    expect(polled!.status).toBe('live')
  })

  test('registration failure returns unsuccessful response', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Wallet already registered' }),
    })

    const result = await registerAgent('Duplicate Agent', WALLET)
    expect(result.success).toBe(false)
    expect(result.message).toContain('Wallet already registered')
  })

  test('identity not found after registration returns null', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, agentId: 'agent-003', txHash: '0xghi789' }),
    })

    await registerAgent('Ghost Agent', WALLET)

    ;(global.fetch as any).mockResolvedValueOnce({ ok: false, status: 404 })

    const identity = await fetchAgentIdentity(WALLET)
    expect(identity).toBeNull()
  })
})
