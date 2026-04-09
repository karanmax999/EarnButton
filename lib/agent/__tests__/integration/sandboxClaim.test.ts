/**
 * Integration Test: Sandbox Capital Claim Flow
 *
 * Tests the full sandbox capital claim flow through the service layer:
 * Connect wallet → View sandbox → Claim capital → Verify claim
 *
 * Requirements: 6.1-6.10
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { fetchSandboxBalance, claimCapital, pollClaimStatus } from '../../sandboxService'
import { CapitalSandbox } from '@/types/agent'

const WALLET = '0xSandboxWalletDeadBeefDeadBeefDeadBeef01'

describe('Integration: Sandbox Capital Claim Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  test('full flow: view sandbox balance → claim capital → verify claim', async () => {
    // Step 1: Mock sandbox balance fetch (unclaimed)
    const unclaimedSandbox: CapitalSandbox = {
      vaultAddress: '0xvault001',
      balance: BigInt('10000000000'), // 10,000 USDC
      claimed: false,
      ethAllocation: BigInt('100000000000000000'), // 0.1 ETH
    }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...unclaimedSandbox,
        balance: '10000000000',
        ethAllocation: '100000000000000000',
      }),
    })

    // Step 2: Fetch sandbox balance
    const sandbox = await fetchSandboxBalance(WALLET)
    expect(sandbox).not.toBeNull()
    expect(sandbox!.claimed).toBe(false)
    expect(sandbox!.balance).toBe(BigInt('10000000000'))
    expect(sandbox!.ethAllocation).toBe(BigInt('100000000000000000'))

    // Verify correct API call
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/agent/sandbox-balance?walletAddress=${encodeURIComponent(WALLET)}`
    )

    // Step 3: Mock claim capital API
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ txHash: '0xclaim123' }),
    })

    // Step 4: Claim capital
    const txHash = await claimCapital(WALLET)
    expect(txHash).toBe('0xclaim123')

    // Verify correct API call
    expect(global.fetch).toHaveBeenCalledWith('/api/agent/claim-capital', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ walletAddress: WALLET }),
    }))

    // Step 5: Mock poll — first unclaimed, then claimed
    const claimedSandbox: CapitalSandbox = {
      vaultAddress: '0xvault001',
      balance: BigInt('10000000000'),
      claimed: true,
      ethAllocation: BigInt('0'),
    }
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...claimedSandbox,
          claimed: false,
          balance: '10000000000',
          ethAllocation: '0',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...claimedSandbox,
          balance: '10000000000',
          ethAllocation: '0',
        }),
      })

    // Step 6: Poll for claim confirmation
    const confirmed = await pollClaimStatus('0xclaim123')
    expect(confirmed).not.toBeNull()
    expect(confirmed!.claimed).toBe(true)
    expect(confirmed!.vaultAddress).toBe('0xvault001')
  })

  test('already claimed sandbox shows claimed state', async () => {
    const claimedSandbox = {
      vaultAddress: '0xvault002',
      balance: '0',
      claimed: true,
      ethAllocation: '0',
    }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => claimedSandbox,
    })

    const sandbox = await fetchSandboxBalance(WALLET)
    expect(sandbox!.claimed).toBe(true)
    expect(sandbox!.balance).toBe(BigInt('0'))

    // Attempting to claim again should fail
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Capital already claimed' }),
    })

    const txHash = await claimCapital(WALLET)
    expect(txHash).toBeNull()
  })

  test('claim with invalid wallet returns null', async () => {
    const txHash = await claimCapital('')
    expect(txHash).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('sandbox balance fetch failure returns null', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    })

    const sandbox = await fetchSandboxBalance(WALLET)
    expect(sandbox).toBeNull()
  })

  test('poll claim status immediately resolves when already claimed', async () => {
    const claimedSandbox = {
      vaultAddress: '0xvault003',
      balance: '5000000000',
      claimed: true,
      ethAllocation: '0',
    }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => claimedSandbox,
    })

    const result = await pollClaimStatus('0xclaim456')
    expect(result).not.toBeNull()
    expect(result!.claimed).toBe(true)
    expect(result!.balance).toBe(BigInt('5000000000'))
  })
})
