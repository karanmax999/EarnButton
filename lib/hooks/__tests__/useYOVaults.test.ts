import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import useSWR from 'swr'

// Mock SWR to control data fetching
vi.mock('swr')

describe('useYOVaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading state initially', async () => {
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
    } as any)

    const { useYOVaults } = await import('../useYOVaults')
    const { result } = renderHook(() => useYOVaults())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should return 4 vaults from YO_VAULTS constants', async () => {
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    } as any)

    const { useYOVaults } = await import('../useYOVaults')
    const { result } = renderHook(() => useYOVaults())

    // Always returns all 4 YO vaults
    expect(result.current.vaults).toHaveLength(4)
  })

  it('should return vault names from constants', async () => {
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    } as any)

    const { useYOVaults } = await import('../useYOVaults')
    const { result } = renderHook(() => useYOVaults())

    const names = result.current.vaults.map(v => v.name)
    expect(names).toContain('yoUSD')
    expect(names).toContain('yoETH')
    expect(names).toContain('yoBTC')
    expect(names).toContain('yoEUR')
  })

  it('should use fallback APY when SWR data is not available', async () => {
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    } as any)

    const { useYOVaults } = await import('../useYOVaults')
    const { result } = renderHook(() => useYOVaults())

    // Fallback APYs are defined in the hook
    result.current.vaults.forEach(vault => {
      expect(typeof vault.apy).toBe('number')
      expect(vault.apy).toBeGreaterThanOrEqual(0)
    })
  })

  it('should use APY from SWR data when available', async () => {
    const mockData: Record<string, { apy: number; tvl: bigint }> = {
      '0x0000000f2eb9f69274678c76222b35eec7588a65': { apy: 9.5, tvl: 1000000n },
      '0x3a43aec53490cb9fa922847385d82fe25d0e9de7': { apy: 7.2, tvl: 500000n },
      '0xbcbc8cb4d1e8ed048a6276a5e94a3e952660bcbc': { apy: 6.1, tvl: 250000n },
      '0x50c749ae210d3977adc824ae11f3c7fd10c871e9': { apy: 8.0, tvl: 750000n },
    }

    vi.mocked(useSWR).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    } as any)

    const { useYOVaults } = await import('../useYOVaults')
    const { result } = renderHook(() => useYOVaults())

    const usdVault = result.current.vaults.find(v => v.name === 'yoUSD')
    expect(usdVault?.apy).toBe(9.5)
    expect(usdVault?.tvl).toBe(1000000n)
  })

  it('should return error when SWR fails', async () => {
    const mockError = new Error('Failed to fetch vault data')

    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      mutate: vi.fn(),
    } as any)

    const { useYOVaults } = await import('../useYOVaults')
    const { result } = renderHook(() => useYOVaults())

    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain('Failed to fetch')
  })

  it('should provide refetch functionality', async () => {
    const mockMutate = vi.fn()
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    } as any)

    const { useYOVaults } = await import('../useYOVaults')
    const { result } = renderHook(() => useYOVaults())

    expect(result.current.refetch).toBeDefined()
    expect(typeof result.current.refetch).toBe('function')
  })

  it('should call mutate when refetch is called', async () => {
    const mockMutate = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    } as any)

    const { useYOVaults } = await import('../useYOVaults')
    const { result } = renderHook(() => useYOVaults())

    await result.current.refetch()

    expect(mockMutate).toHaveBeenCalled()
  })

  it('should return vaults with correct structure', async () => {
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    } as any)

    const { useYOVaults } = await import('../useYOVaults')
    const { result } = renderHook(() => useYOVaults())

    result.current.vaults.forEach(vault => {
      expect(vault).toHaveProperty('address')
      expect(vault).toHaveProperty('name')
      expect(vault).toHaveProperty('symbol')
      expect(vault).toHaveProperty('apy')
      expect(vault).toHaveProperty('riskLevel')
      expect(vault).toHaveProperty('tvl')
      expect(vault).toHaveProperty('strategy')
      expect(vault).toHaveProperty('underlyingAsset')
      expect(vault).toHaveProperty('minDeposit')
      expect(vault).toHaveProperty('maxDeposit')
    })
  })

  it('should set riskLevel to Low for all vaults', async () => {
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    } as any)

    const { useYOVaults } = await import('../useYOVaults')
    const { result } = renderHook(() => useYOVaults())

    result.current.vaults.forEach(vault => {
      expect(vault.riskLevel).toBe('Low')
    })
  })
})
