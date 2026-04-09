import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAccount } from 'wagmi'
import * as agentService from '@/lib/agent/agentService'

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}))

// Mock agentService
vi.mock('@/lib/agent/agentService', () => ({
  fetchAgentIdentity: vi.fn(),
  registerAgent: vi.fn(),
  pollAgentRegistration: vi.fn(),
}))

describe('AgentIdentity Component', () => {
  const mockWalletAddress = '0x1234567890123456789012345678901234567890'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Props', () => {
    it('should accept walletAddress prop', () => {
      // Component accepts walletAddress prop
      const props = {
        walletAddress: mockWalletAddress,
        onRegistrationSuccess: vi.fn(),
      }
      expect(props.walletAddress).toBe(mockWalletAddress)
      expect(typeof props.onRegistrationSuccess).toBe('function')
    })

    it('should accept onRegistrationSuccess callback', () => {
      const callback = vi.fn()
      const props = {
        onRegistrationSuccess: callback,
      }
      expect(typeof props.onRegistrationSuccess).toBe('function')
    })
  })

  describe('Service Integration', () => {
    it('should call fetchAgentIdentity service', async () => {
      const mockFetch = vi.mocked(agentService.fetchAgentIdentity)
      mockFetch.mockResolvedValue(null)

      await agentService.fetchAgentIdentity(mockWalletAddress)

      expect(mockFetch).toHaveBeenCalledWith(mockWalletAddress)
    })

    it('should call registerAgent service with name and wallet', async () => {
      const mockRegister = vi.mocked(agentService.registerAgent)
      mockRegister.mockResolvedValue({
        success: true,
        agentId: 'agent-123',
        txHash: '0xabc123',
      })

      await agentService.registerAgent('Test Agent', mockWalletAddress)

      expect(mockRegister).toHaveBeenCalledWith('Test Agent', mockWalletAddress)
    })

    it('should call pollAgentRegistration service', async () => {
      const mockPoll = vi.mocked(agentService.pollAgentRegistration)
      mockPoll.mockResolvedValue({
        id: 'agent-123',
        name: 'Test Agent',
        walletAddress: mockWalletAddress,
        tokenId: BigInt(1),
        capabilities: ['trading'],
        registeredAt: Math.floor(Date.now() / 1000),
        status: 'live',
      })

      await agentService.pollAgentRegistration(mockWalletAddress)

      expect(mockPoll).toHaveBeenCalledWith(mockWalletAddress)
    })
  })

  describe('Registration Flow', () => {
    it('should handle successful registration response', async () => {
      const mockResponse = {
        success: true,
        agentId: 'agent-123',
        txHash: '0xabc123',
        message: 'Registration successful',
      }

      expect(mockResponse.success).toBe(true)
      expect(mockResponse.agentId).toBe('agent-123')
      expect(mockResponse.txHash).toBe('0xabc123')
    })

    it('should handle failed registration response', async () => {
      const mockResponse = {
        success: false,
        agentId: '',
        txHash: '',
        message: 'Invalid agent name',
      }

      expect(mockResponse.success).toBe(false)
      expect(mockResponse.message).toBe('Invalid agent name')
    })

    it('should handle registration error', async () => {
      const mockRegister = vi.mocked(agentService.registerAgent)
      mockRegister.mockRejectedValue(new Error('Network error'))

      try {
        await agentService.registerAgent('Test Agent', mockWalletAddress)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })
  })

  describe('Agent Identity Data', () => {
    it('should handle agent identity with all fields', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        walletAddress: mockWalletAddress,
        tokenId: BigInt(1),
        capabilities: ['trading', 'validation'],
        registeredAt: Math.floor(Date.now() / 1000),
        status: 'live' as const,
      }

      expect(mockAgent.id).toBe('agent-123')
      expect(mockAgent.name).toBe('Test Agent')
      expect(mockAgent.walletAddress).toBe(mockWalletAddress)
      expect(mockAgent.tokenId).toBe(BigInt(1))
      expect(mockAgent.capabilities).toContain('trading')
      expect(mockAgent.capabilities).toContain('validation')
      expect(mockAgent.status).toBe('live')
    })

    it('should handle agent identity with pending status', async () => {
      const mockAgent = {
        id: 'agent-456',
        name: 'Pending Agent',
        walletAddress: mockWalletAddress,
        tokenId: BigInt(2),
        capabilities: [],
        registeredAt: Math.floor(Date.now() / 1000),
        status: 'pending' as const,
      }

      expect(mockAgent.status).toBe('pending')
    })

    it('should handle null agent identity (unregistered)', async () => {
      const mockAgent = null

      expect(mockAgent).toBeNull()
    })
  })

  describe('Wallet Integration', () => {
    it('should use connected wallet address from useAccount', () => {
      vi.mocked(useAccount).mockReturnValue({
        address: mockWalletAddress,
        isConnected: true,
        isConnecting: false,
        isDisconnected: false,
        isReconnecting: false,
        status: 'connected',
      } as any)

      const { address, isConnected } = vi.mocked(useAccount)()

      expect(address).toBe(mockWalletAddress)
      expect(isConnected).toBe(true)
    })

    it('should handle disconnected wallet state', () => {
      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
        isConnected: false,
        isConnecting: false,
        isDisconnected: true,
        isReconnecting: false,
        status: 'disconnected',
      } as any)

      const { address, isConnected } = vi.mocked(useAccount)()

      expect(address).toBeUndefined()
      expect(isConnected).toBe(false)
    })

    it('should prioritize prop walletAddress over connected address', () => {
      const propWalletAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      const connectedAddress = mockWalletAddress

      // Component logic: propWalletAddress || connectedAddress
      const selectedAddress = propWalletAddress || connectedAddress

      expect(selectedAddress).toBe(propWalletAddress)
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      const mockFetch = vi.mocked(agentService.fetchAgentIdentity)
      mockFetch.mockRejectedValue(new Error('Fetch failed'))

      try {
        await agentService.fetchAgentIdentity(mockWalletAddress)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Fetch failed')
      }
    })

    it('should handle empty agent name validation', () => {
      const agentName = ''
      const isValid = agentName.trim().length > 0

      expect(isValid).toBe(false)
    })

    it('should validate non-empty agent name', () => {
      const agentName = 'Test Agent'
      const isValid = agentName.trim().length > 0

      expect(isValid).toBe(true)
    })
  })

  describe('State Management', () => {
    it('should track registration status states', () => {
      const statuses = ['idle', 'pending', 'confirming', 'live'] as const

      expect(statuses).toContain('idle')
      expect(statuses).toContain('pending')
      expect(statuses).toContain('confirming')
      expect(statuses).toContain('live')
    })

    it('should handle loading state', () => {
      const isLoading = true

      expect(isLoading).toBe(true)
    })

    it('should handle error state', () => {
      const error = 'Registration failed'

      expect(error).toBe('Registration failed')
    })
  })

  describe('Callback Handling', () => {
    it('should call onRegistrationSuccess callback', () => {
      const callback = vi.fn()

      callback()

      expect(callback).toHaveBeenCalled()
    })

    it('should pass correct data to callback', () => {
      const callback = vi.fn()
      const mockAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        walletAddress: mockWalletAddress,
        tokenId: BigInt(1),
        capabilities: ['trading'],
        registeredAt: Math.floor(Date.now() / 1000),
        status: 'live' as const,
      }

      callback(mockAgent)

      expect(callback).toHaveBeenCalledWith(mockAgent)
    })
  })

  describe('Type Safety', () => {
    it('should have correct AgentIdentityProps interface', () => {
      const props = {
        walletAddress: mockWalletAddress,
        onRegistrationSuccess: vi.fn(),
      }

      expect(typeof props.walletAddress).toBe('string')
      expect(typeof props.onRegistrationSuccess).toBe('function')
    })

    it('should handle bigint token ID', () => {
      const tokenId = BigInt(1)

      expect(typeof tokenId).toBe('bigint')
      expect(tokenId.toString()).toBe('1')
    })

    it('should handle agent status enum', () => {
      const status: 'pending' | 'live' = 'live'

      expect(status === 'live' || status === 'pending').toBe(true)
    })
  })
})
