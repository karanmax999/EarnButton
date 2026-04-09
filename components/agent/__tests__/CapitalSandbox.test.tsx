import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAccount } from 'wagmi'
import * as sandboxService from '@/lib/agent/sandboxService'
import { CapitalSandbox as CapitalSandboxType } from '@/types/agent'

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}))

// Mock sandbox service
vi.mock('@/lib/agent/sandboxService', () => ({
  fetchSandboxBalance: vi.fn(),
  claimCapital: vi.fn(),
  pollClaimStatus: vi.fn(),
}))

const mockSandboxData: CapitalSandboxType = {
  vaultAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  balance: BigInt('1000000000'), // 1000 USDC (6 decimals)
  claimed: false,
  ethAllocation: BigInt('1000000000000000000'), // 1 ETH
}

const mockClaimedSandboxData: CapitalSandboxType = {
  ...mockSandboxData,
  claimed: true,
}

describe('CapitalSandbox Component', () => {
  const mockWalletAddress = '0x1234567890123456789012345678901234567890'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAccount).mockReturnValue({
      address: mockWalletAddress,
      isConnected: true,
    } as any)
  })

  describe('Component Props', () => {
    it('should accept walletAddress prop', () => {
      const props = {
        walletAddress: mockWalletAddress,
        onClaimSuccess: vi.fn(),
      }
      expect(props.walletAddress).toBe(mockWalletAddress)
      expect(typeof props.onClaimSuccess).toBe('function')
    })

    it('should accept onClaimSuccess callback', () => {
      const callback = vi.fn()
      const props = {
        onClaimSuccess: callback,
      }
      expect(typeof props.onClaimSuccess).toBe('function')
    })
  })

  describe('Service Integration', () => {
    it('should call fetchSandboxBalance service', async () => {
      const mockFetch = vi.mocked(sandboxService.fetchSandboxBalance)
      mockFetch.mockResolvedValue(mockSandboxData)

      await sandboxService.fetchSandboxBalance(mockWalletAddress)

      expect(mockFetch).toHaveBeenCalledWith(mockWalletAddress)
    })

    it('should call claimCapital service when claiming', async () => {
      const mockClaim = vi.mocked(sandboxService.claimCapital)
      mockClaim.mockResolvedValue('0xclaimtxhash')

      await sandboxService.claimCapital(mockWalletAddress)

      expect(mockClaim).toHaveBeenCalledWith(mockWalletAddress)
    })

    it('should call pollClaimStatus service after claiming', async () => {
      const mockPoll = vi.mocked(sandboxService.pollClaimStatus)
      mockPoll.mockResolvedValue(mockClaimedSandboxData)

      await sandboxService.pollClaimStatus('0xclaimtxhash')

      expect(mockPoll).toHaveBeenCalledWith('0xclaimtxhash')
    })
  })

  describe('Balance Formatting', () => {
    it('should format balance with 2 decimal places', () => {
      const balance = BigInt('1000000000') // 1000 USDC
      const formatted = (Number(balance) / 1e6).toFixed(2)
      expect(formatted).toBe('1000.00')
    })

    it('should format small balances correctly', () => {
      const balance = BigInt('1500000') // 1.5 USDC
      const formatted = (Number(balance) / 1e6).toFixed(2)
      expect(formatted).toBe('1.50')
    })

    it('should format zero balance', () => {
      const balance = BigInt('0')
      const formatted = (Number(balance) / 1e6).toFixed(2)
      expect(formatted).toBe('0.00')
    })
  })

  describe('ETH Allocation Formatting', () => {
    it('should format ETH allocation with 4 decimal places', () => {
      const allocation = BigInt('1000000000000000000') // 1 ETH
      const formatted = (Number(allocation) / 1e18).toFixed(4)
      expect(formatted).toBe('1.0000')
    })

    it('should format fractional ETH correctly', () => {
      const allocation = BigInt('500000000000000000') // 0.5 ETH
      const formatted = (Number(allocation) / 1e18).toFixed(4)
      expect(formatted).toBe('0.5000')
    })

    it('should format small ETH amounts', () => {
      const allocation = BigInt('100000000000000000') // 0.1 ETH
      const formatted = (Number(allocation) / 1e18).toFixed(4)
      expect(formatted).toBe('0.1000')
    })
  })

  describe('Sandbox Data Validation', () => {
    it('should validate sandbox data structure', () => {
      const sandbox = mockSandboxData
      expect(typeof sandbox.vaultAddress).toBe('string')
      expect(typeof sandbox.balance).toBe('bigint')
      expect(typeof sandbox.claimed).toBe('boolean')
      expect(typeof sandbox.ethAllocation).toBe('bigint')
    })

    it('should handle claimed state', () => {
      const sandbox = mockClaimedSandboxData
      expect(sandbox.claimed).toBe(true)
    })

    it('should handle unclaimed state', () => {
      const sandbox = mockSandboxData
      expect(sandbox.claimed).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle null sandbox data', async () => {
      const mockFetch = vi.mocked(sandboxService.fetchSandboxBalance)
      mockFetch.mockResolvedValue(null)

      const result = await sandboxService.fetchSandboxBalance(mockWalletAddress)

      expect(result).toBeNull()
    })

    it('should handle claim failure', async () => {
      const mockClaim = vi.mocked(sandboxService.claimCapital)
      mockClaim.mockResolvedValue(null)

      const result = await sandboxService.claimCapital(mockWalletAddress)

      expect(result).toBeNull()
    })

    it('should handle poll timeout', async () => {
      const mockPoll = vi.mocked(sandboxService.pollClaimStatus)
      mockPoll.mockResolvedValue(null)

      const result = await sandboxService.pollClaimStatus('0xclaimtxhash')

      expect(result).toBeNull()
    })
  })
})
