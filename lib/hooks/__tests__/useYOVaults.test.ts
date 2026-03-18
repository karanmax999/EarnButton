import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useYOVaults } from '../useYOVaults'
import * as yoProtocolReact from '@yo-protocol/react'

// Mock the YO Protocol SDK
vi.mock('@yo-protocol/react', () => ({
  useVaults: vi.fn(),
}))

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn((key, fetcher, options) => {
    if (!key) {
      return {
        data: undefined,
        error: undefined,
        mutate: vi.fn(),
      }
    }
    
    // Execute fetcher immediately for testing
    const data = fetcher ? fetcher(key) : undefined
    
    return {
      data,
      error: undefined,
      mutate: vi.fn(),
    }
  }),
}))

describe('useYOVaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty vaults array when loading', () => {
    vi.mocked(yoProtocolReact.useVaults).mockReturnValue({
      vaults: [],
      isLoading: true,
      isError: false,
      error: null,
    })

    const { result } = renderHook(() => useYOVaults())

    expect(result.current.vaults).toEqual([])
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(null)
  })

  it('should return error when YO Protocol SDK fails', () => {
    const mockError = new Error('Failed to fetch vaults')
    
    vi.mocked(yoProtocolReact.useVaults).mockReturnValue({
      vaults: [],
      isLoading: false,
      isError: true,
      error: mockError,
    })

    const { result } = renderHook(() => useYOVaults())

    expect(result.current.vaults).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain('Failed to fetch')
  })

  it('should transform YO Protocol vault data correctly', async () => {
    const mockYoVaults = [
      {
        id: 'yoUSD',
        name: 'YO USD Vault',
        type: 'Yield Optimizer',
        asset: {
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
        shareAsset: {
          name: 'YO USD',
          symbol: 'yoUSD',
          decimals: 6,
          address: '0x...',
        },
        chain: {
          id: 8453,
          name: 'Base',
        },
        contracts: {
          vaultAddress: '0x1234567890123456789012345678901234567890',
        },
        tvl: {
          raw: 1000000,
          formatted: '$1,000,000',
        },
        yield: {
          '1d': '5.5',
          '7d': '5.2',
          '30d': '5.0',
        },
        sharePrice: {
          raw: 1.05,
          formatted: '$1.05',
        },
        cap: {
          raw: 10000000,
          formatted: '$10,000,000',
        },
      },
    ]

    vi.mocked(yoProtocolReact.useVaults).mockReturnValue({
      vaults: mockYoVaults as any,
      isLoading: false,
      isError: false,
      error: null,
    })

    const { result } = renderHook(() => useYOVaults())

    await waitFor(() => {
      expect(result.current.vaults.length).toBe(1)
    })

    const vault = result.current.vaults[0]
    expect(vault.address).toBe('0x1234567890123456789012345678901234567890')
    expect(vault.name).toBe('YO USD Vault')
    expect(vault.symbol).toBe('yoUSD')
    expect(vault.apy).toBe(5.0) // Should use 30d yield
    expect(vault.riskLevel).toBe('Medium')
    expect(vault.underlyingAsset).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')
  })

  it('should handle vaults with missing yield data', async () => {
    const mockYoVaults = [
      {
        id: 'yoETH',
        name: 'YO ETH Vault',
        type: 'Yield Optimizer',
        asset: {
          name: 'Wrapped Ether',
          symbol: 'WETH',
          decimals: 18,
          address: '0x...',
        },
        shareAsset: {
          name: 'YO ETH',
          symbol: 'yoETH',
          decimals: 18,
          address: '0x...',
        },
        chain: {
          id: 8453,
          name: 'Base',
        },
        contracts: {
          vaultAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        },
        tvl: {
          raw: 500000,
          formatted: '$500,000',
        },
        yield: {
          '1d': null,
          '7d': null,
          '30d': null,
        },
        sharePrice: {
          raw: 1.0,
          formatted: '$1.00',
        },
        cap: {
          raw: 5000000,
          formatted: '$5,000,000',
        },
      },
    ]

    vi.mocked(yoProtocolReact.useVaults).mockReturnValue({
      vaults: mockYoVaults as any,
      isLoading: false,
      isError: false,
      error: null,
    })

    const { result } = renderHook(() => useYOVaults())

    await waitFor(() => {
      expect(result.current.vaults.length).toBe(1)
    })

    const vault = result.current.vaults[0]
    expect(vault.apy).toBe(0) // Should default to 0 when no yield data
  })

  it('should provide refetch functionality', () => {
    vi.mocked(yoProtocolReact.useVaults).mockReturnValue({
      vaults: [],
      isLoading: false,
      isError: false,
      error: null,
    })

    const { result } = renderHook(() => useYOVaults())

    expect(result.current.refetch).toBeDefined()
    expect(typeof result.current.refetch).toBe('function')
  })

  it('should skip validation errors and continue processing other vaults', async () => {
    const mockYoVaults = [
      // Valid vault
      {
        id: 'yoUSD',
        name: 'YO USD Vault',
        type: 'Yield Optimizer',
        asset: {
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
        shareAsset: {
          name: 'YO USD',
          symbol: 'yoUSD',
          decimals: 6,
          address: '0x...',
        },
        chain: {
          id: 8453,
          name: 'Base',
        },
        contracts: {
          vaultAddress: '0x1234567890123456789012345678901234567890',
        },
        tvl: {
          raw: 1000000,
          formatted: '$1,000,000',
        },
        yield: {
          '1d': '5.5',
          '7d': '5.2',
          '30d': '5.0',
        },
        sharePrice: {
          raw: 1.05,
          formatted: '$1.05',
        },
        cap: {
          raw: 10000000,
          formatted: '$10,000,000',
        },
      },
      // Invalid vault (missing required fields)
      {
        id: 'invalid',
        name: '',
        contracts: {
          vaultAddress: 'invalid-address',
        },
        tvl: {
          raw: 0,
          formatted: '$0',
        },
      },
    ]

    vi.mocked(yoProtocolReact.useVaults).mockReturnValue({
      vaults: mockYoVaults as any,
      isLoading: false,
      isError: false,
      error: null,
    })

    const { result } = renderHook(() => useYOVaults())

    await waitFor(() => {
      // Should only include the valid vault
      expect(result.current.vaults.length).toBe(1)
    })

    expect(result.current.vaults[0].name).toBe('YO USD Vault')
  })
})
