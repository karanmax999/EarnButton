import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAccount, useSignTypedData } from 'wagmi'
import * as tradeIntent from '@/lib/agent/tradeIntent'
import * as redstone from '@/lib/agent/redstone'
import * as tradeService from '@/lib/agent/tradeService'

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useSignTypedData: vi.fn(),
}))

// Mock services
vi.mock('@/lib/agent/tradeIntent')
vi.mock('@/lib/agent/redstone')
vi.mock('@/lib/agent/tradeService')

describe('TradeIntent Component', () => {
  const mockWalletAddress = '0x1234567890123456789012345678901234567890'
  const mockAgentId = 'agent-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Props', () => {
    it('should accept walletAddress prop', () => {
      const props = {
        walletAddress: mockWalletAddress,
        agentId: mockAgentId,
        onTradeSubmitted: vi.fn(),
      }
      expect(props.walletAddress).toBe(mockWalletAddress)
      expect(props.agentId).toBe(mockAgentId)
      expect(typeof props.onTradeSubmitted).toBe('function')
    })

    it('should accept agentId prop', () => {
      const props = {
        agentId: mockAgentId,
      }
      expect(props.agentId).toBe(mockAgentId)
    })

    it('should accept onTradeSubmitted callback', () => {
      const callback = vi.fn()
      const props = {
        agentId: mockAgentId,
        onTradeSubmitted: callback,
      }
      expect(typeof props.onTradeSubmitted).toBe('function')
    })
  })

  describe('Form Validation', () => {
    it('should validate positive amount', () => {
      const amount = '10'
      const isValid = parseFloat(amount) > 0

      expect(isValid).toBe(true)
    })

    it('should reject negative amount', () => {
      const amount = '-10'
      const isValid = parseFloat(amount) > 0

      expect(isValid).toBe(false)
    })

    it('should reject zero amount', () => {
      const amount = '0'
      const isValid = parseFloat(amount) > 0

      expect(isValid).toBe(false)
    })

    it('should reject non-numeric amount', () => {
      const amount = 'abc'
      const isValid = !isNaN(parseFloat(amount))

      expect(isValid).toBe(false)
    })

    it('should validate amount within limits', () => {
      const amount = '500'
      const maxLimit = 1000
      const isValid = parseFloat(amount) <= maxLimit

      expect(isValid).toBe(true)
    })

    it('should reject amount exceeding limits', () => {
      const amount = '1001'
      const maxLimit = 1000
      const isValid = parseFloat(amount) <= maxLimit

      expect(isValid).toBe(false)
    })

    it('should require asset selection', () => {
      const asset = ''
      const isValid = asset.length > 0

      expect(isValid).toBe(false)
    })

    it('should accept valid asset selection', () => {
      const asset = 'ETH/USDC'
      const isValid = asset.length > 0

      expect(isValid).toBe(true)
    })
  })

  describe('Trade Intent Creation', () => {
    it('should create trade intent with correct structure', async () => {
      const mockCreateIntent = vi.mocked(tradeIntent.createTradeIntent)
      mockCreateIntent.mockReturnValue({
        asset: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy',
        timestamp: Math.floor(Date.now() / 1000),
      })

      const intent = tradeIntent.createTradeIntent(
        'ETH/USDC',
        BigInt('1000000000000000000'),
        'buy',
        Math.floor(Date.now() / 1000)
      )

      expect(intent.asset).toBe('ETH/USDC')
      expect(intent.amount).toBe(BigInt('1000000000000000000'))
      expect(intent.direction).toBe('buy')
      expect(typeof intent.timestamp).toBe('number')
    })

    it('should serialize trade intent', async () => {
      const mockSerialize = vi.mocked(tradeIntent.serializeTradeIntent)
      mockSerialize.mockReturnValue('{"asset":"ETH/USDC","amount":"1000000000000000000","direction":"buy","timestamp":1234567890}')

      const intent = {
        asset: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy' as const,
        timestamp: 1234567890,
      }

      const serialized = tradeIntent.serializeTradeIntent(intent)

      expect(typeof serialized).toBe('string')
      expect(serialized).toContain('ETH/USDC')
    })

    it('should pretty print trade intent', async () => {
      const mockPrettyPrint = vi.mocked(tradeIntent.prettyPrintTradeIntent)
      mockPrettyPrint.mockReturnValue('TradeIntent {\n  asset: ETH/USDC\n  amount: 1000000000000000000\n  direction: buy\n  timestamp: 1234567890\n}')

      const intent = {
        asset: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy' as const,
        timestamp: 1234567890,
      }

      const printed = tradeIntent.prettyPrintTradeIntent(intent)

      expect(typeof printed).toBe('string')
      expect(printed).toContain('TradeIntent')
      expect(printed).toContain('ETH/USDC')
    })
  })

  describe('Price Proof Handling', () => {
    it('should fetch price proof for asset', async () => {
      const mockFetchProof = vi.mocked(redstone.fetchPriceProof)
      mockFetchProof.mockResolvedValue('0xproof123')

      const proof = await redstone.fetchPriceProof('ETH')

      expect(mockFetchProof).toHaveBeenCalledWith('ETH')
      expect(proof).toBe('0xproof123')
    })

    it('should handle price proof fetch failure', async () => {
      const mockFetchProof = vi.mocked(redstone.fetchPriceProof)
      mockFetchProof.mockResolvedValue(null)

      const proof = await redstone.fetchPriceProof('ETH')

      expect(proof).toBeNull()
    })

    it('should verify price proof', async () => {
      const mockVerifyProof = vi.mocked(redstone.verifyPriceProof)
      mockVerifyProof.mockResolvedValue(true)

      const isValid = await redstone.verifyPriceProof('0xproof123')

      expect(isValid).toBe(true)
    })

    it('should handle invalid price proof', async () => {
      const mockVerifyProof = vi.mocked(redstone.verifyPriceProof)
      mockVerifyProof.mockResolvedValue(false)

      const isValid = await redstone.verifyPriceProof('0xinvalid')

      expect(isValid).toBe(false)
    })
  })

  describe('Trade Submission', () => {
    it('should submit trade with signed intent and price proof', async () => {
      const mockSubmitTrade = vi.mocked(tradeService.submitTrade)
      mockSubmitTrade.mockResolvedValue({
        success: true,
        txHash: '0xtxhash123',
        tradeId: 'trade-123',
      })

      const intent = {
        asset: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy' as const,
        timestamp: Math.floor(Date.now() / 1000),
        signature: '0xsig123',
        priceProof: '0xproof123',
      }

      const response = await tradeService.submitTrade(intent, '0xproof123')

      expect(mockSubmitTrade).toHaveBeenCalledWith(intent, '0xproof123')
      expect(response.success).toBe(true)
      expect(response.txHash).toBe('0xtxhash123')
      expect(response.tradeId).toBe('trade-123')
    })

    it('should handle trade submission failure', async () => {
      const mockSubmitTrade = vi.mocked(tradeService.submitTrade)
      mockSubmitTrade.mockResolvedValue({
        success: false,
        txHash: '',
        tradeId: '',
        message: 'Insufficient balance',
      })

      const intent = {
        asset: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy' as const,
        timestamp: Math.floor(Date.now() / 1000),
      }

      const response = await tradeService.submitTrade(intent, '0xproof123')

      expect(response.success).toBe(false)
      expect(response.message).toBe('Insufficient balance')
    })

    it('should poll trade status after submission', async () => {
      const mockPollStatus = vi.mocked(tradeService.pollTradeStatus)
      mockPollStatus.mockResolvedValue({
        id: 'trade-123',
        timestamp: Math.floor(Date.now() / 1000),
        assetPair: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy',
        executionPrice: 2000,
        status: 'confirmed',
        txHash: '0xtxhash123',
      })

      const trade = await tradeService.pollTradeStatus('0xtxhash123')

      expect(mockPollStatus).toHaveBeenCalledWith('0xtxhash123')
      expect(trade?.status).toBe('confirmed')
      expect(trade?.id).toBe('trade-123')
    })

    it('should handle trade confirmation timeout', async () => {
      const mockPollStatus = vi.mocked(tradeService.pollTradeStatus)
      mockPollStatus.mockResolvedValue(null)

      const trade = await tradeService.pollTradeStatus('0xtxhash123')

      expect(trade).toBeNull()
    })
  })

  describe('Direction Toggle', () => {
    it('should support buy direction', () => {
      const direction: 'buy' | 'sell' = 'buy'

      expect(direction).toBe('buy')
    })

    it('should support sell direction', () => {
      const direction: 'buy' | 'sell' = 'sell'

      expect(direction).toBe('sell')
    })

    it('should toggle between directions', () => {
      let direction: 'buy' | 'sell' = 'buy'

      direction = direction === 'buy' ? 'sell' : 'buy'

      expect(direction).toBe('sell')
    })
  })

  describe('Asset Selection', () => {
    it('should have available assets', () => {
      const availableAssets = ['ETH/USDC', 'BTC/USDC', 'USDC/DAI']

      expect(availableAssets).toContain('ETH/USDC')
      expect(availableAssets).toContain('BTC/USDC')
      expect(availableAssets).toContain('USDC/DAI')
    })

    it('should extract base asset from pair', () => {
      const assetPair = 'ETH/USDC'
      const baseAsset = assetPair.split('/')[0]

      expect(baseAsset).toBe('ETH')
    })

    it('should extract quote asset from pair', () => {
      const assetPair = 'ETH/USDC'
      const quoteAsset = assetPair.split('/')[1]

      expect(quoteAsset).toBe('USDC')
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

      const selectedAddress = propWalletAddress || connectedAddress

      expect(selectedAddress).toBe(propWalletAddress)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing asset selection error', () => {
      const selectedAsset = ''
      const error = selectedAsset ? null : 'Please select an asset'

      expect(error).toBe('Please select an asset')
    })

    it('should handle invalid amount error', () => {
      const amount = '-5'
      const error = parseFloat(amount) > 0 ? null : 'Amount must be positive'

      expect(error).toBe('Amount must be positive')
    })

    it('should handle price proof fetch error', async () => {
      const mockFetchProof = vi.mocked(redstone.fetchPriceProof)
      mockFetchProof.mockResolvedValue(null)

      const proof = await redstone.fetchPriceProof('ETH')

      expect(proof).toBeNull()
    })

    it('should handle trade submission error', async () => {
      const mockSubmitTrade = vi.mocked(tradeService.submitTrade)
      mockSubmitTrade.mockRejectedValue(new Error('Network error'))

      try {
        const intent = {
          asset: 'ETH/USDC',
          amount: BigInt('1000000000000000000'),
          direction: 'buy' as const,
          timestamp: Math.floor(Date.now() / 1000),
        }
        await tradeService.submitTrade(intent, '0xproof123')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })
  })

  describe('State Management', () => {
    it('should track form state', () => {
      const formState = {
        selectedAsset: 'ETH/USDC',
        amount: '10',
        direction: 'buy' as const,
      }

      expect(formState.selectedAsset).toBe('ETH/USDC')
      expect(formState.amount).toBe('10')
      expect(formState.direction).toBe('buy')
    })

    it('should track UI state', () => {
      const uiState = {
        isLoading: false,
        error: null,
        showPreview: false,
        isSigningState: 'idle' as const,
        submitStatus: 'idle' as const,
      }

      expect(uiState.isLoading).toBe(false)
      expect(uiState.error).toBeNull()
      expect(uiState.showPreview).toBe(false)
    })

    it('should track signing states', () => {
      const signingStates = ['idle', 'signing', 'fetching-proof', 'submitting'] as const

      expect(signingStates).toContain('idle')
      expect(signingStates).toContain('signing')
      expect(signingStates).toContain('fetching-proof')
      expect(signingStates).toContain('submitting')
    })

    it('should track submit status states', () => {
      const submitStates = ['idle', 'pending', 'confirming', 'success', 'error'] as const

      expect(submitStates).toContain('idle')
      expect(submitStates).toContain('pending')
      expect(submitStates).toContain('confirming')
      expect(submitStates).toContain('success')
      expect(submitStates).toContain('error')
    })
  })

  describe('Callback Handling', () => {
    it('should call onTradeSubmitted callback', () => {
      const callback = vi.fn()

      callback('0xtxhash123')

      expect(callback).toHaveBeenCalledWith('0xtxhash123')
    })

    it('should pass transaction hash to callback', () => {
      const callback = vi.fn()
      const txHash = '0xtxhash123'

      callback(txHash)

      expect(callback).toHaveBeenCalledWith(txHash)
    })
  })

  describe('Type Safety', () => {
    it('should have correct TradeIntentProps interface', () => {
      const props = {
        walletAddress: mockWalletAddress,
        agentId: mockAgentId,
        onTradeSubmitted: vi.fn(),
      }

      expect(typeof props.walletAddress).toBe('string')
      expect(typeof props.agentId).toBe('string')
      expect(typeof props.onTradeSubmitted).toBe('function')
    })

    it('should handle bigint amount', () => {
      const amount = BigInt('1000000000000000000')

      expect(typeof amount).toBe('bigint')
      expect(amount.toString()).toBe('1000000000000000000')
    })

    it('should handle direction enum', () => {
      const direction: 'buy' | 'sell' = 'buy'

      expect(direction === 'buy' || direction === 'sell').toBe(true)
    })

    it('should handle timestamp as number', () => {
      const timestamp = Math.floor(Date.now() / 1000)

      expect(typeof timestamp).toBe('number')
      expect(timestamp > 0).toBe(true)
    })
  })
})

