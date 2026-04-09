/**
 * Tests for portfolio calculation functions
 */

import { describe, it, expect } from 'vitest'
import {
  calculateTotalDeposited,
  calculateTotalValue,
  calculateYieldEarned,
  calculateWeightedAPY,
} from '../portfolio'
import type { VaultPosition } from '@/types'

function makePosition(overrides: Partial<VaultPosition> = {}): VaultPosition {
  return {
    vaultAddress: '0x1234567890123456789012345678901234567890',
    vaultName: 'Test Vault',
    depositedAmount: 1_000_000n,
    currentValue: 1_050_000n,
    shares: 1_000_000n,
    apy: 5,
    depositedAt: 1_700_000_000,
    ...overrides,
  }
}

describe('calculateTotalDeposited', () => {
  it('returns 0n for empty array', () => {
    expect(calculateTotalDeposited([])).toBe(0n)
  })

  it('returns depositedAmount for single position', () => {
    expect(calculateTotalDeposited([makePosition({ depositedAmount: 5_000_000n })])).toBe(5_000_000n)
  })

  it('sums depositedAmount across multiple positions', () => {
    const positions = [
      makePosition({ depositedAmount: 1_000_000n }),
      makePosition({ depositedAmount: 2_000_000n }),
      makePosition({ depositedAmount: 3_000_000n }),
    ]
    expect(calculateTotalDeposited(positions)).toBe(6_000_000n)
  })

  it('handles zero depositedAmount', () => {
    const positions = [
      makePosition({ depositedAmount: 0n }),
      makePosition({ depositedAmount: 1_000_000n }),
    ]
    expect(calculateTotalDeposited(positions)).toBe(1_000_000n)
  })

  it('handles large bigint values', () => {
    const positions = [
      makePosition({ depositedAmount: 1_000_000_000_000n }),
      makePosition({ depositedAmount: 2_000_000_000_000n }),
    ]
    expect(calculateTotalDeposited(positions)).toBe(3_000_000_000_000n)
  })
})

describe('calculateTotalValue', () => {
  it('returns 0n for empty array', () => {
    expect(calculateTotalValue([])).toBe(0n)
  })

  it('returns currentValue for single position', () => {
    expect(calculateTotalValue([makePosition({ currentValue: 1_100_000n })])).toBe(1_100_000n)
  })

  it('sums currentValue across multiple positions', () => {
    const positions = [
      makePosition({ currentValue: 1_100_000n }),
      makePosition({ currentValue: 2_200_000n }),
      makePosition({ currentValue: 3_300_000n }),
    ]
    expect(calculateTotalValue(positions)).toBe(6_600_000n)
  })

  it('handles zero currentValue', () => {
    const positions = [
      makePosition({ currentValue: 0n }),
      makePosition({ currentValue: 500_000n }),
    ]
    expect(calculateTotalValue(positions)).toBe(500_000n)
  })
})

describe('calculateYieldEarned', () => {
  it('returns 0n for empty array', () => {
    expect(calculateYieldEarned([])).toBe(0n)
  })

  it('returns positive yield when value > deposited', () => {
    const pos = makePosition({ depositedAmount: 1_000_000n, currentValue: 1_100_000n })
    expect(calculateYieldEarned([pos])).toBe(100_000n)
  })

  it('returns zero yield when value equals deposited', () => {
    const pos = makePosition({ depositedAmount: 1_000_000n, currentValue: 1_000_000n })
    expect(calculateYieldEarned([pos])).toBe(0n)
  })

  it('returns negative yield when value < deposited (vault loss)', () => {
    const pos = makePosition({ depositedAmount: 1_000_000n, currentValue: 900_000n })
    expect(calculateYieldEarned([pos])).toBe(-100_000n)
  })

  it('aggregates yield across multiple positions', () => {
    const positions = [
      makePosition({ depositedAmount: 1_000_000n, currentValue: 1_100_000n }),
      makePosition({ depositedAmount: 2_000_000n, currentValue: 2_300_000n }),
    ]
    expect(calculateYieldEarned(positions)).toBe(400_000n)
  })
})

describe('calculateWeightedAPY', () => {
  it('returns 0 for empty array', () => {
    expect(calculateWeightedAPY([])).toBe(0)
  })

  it('returns the single position APY unchanged', () => {
    const pos = makePosition({ apy: 7.5, currentValue: 1_000_000n })
    expect(calculateWeightedAPY([pos])).toBe(7.5)
  })

  it('returns equal-weighted average when all values are equal', () => {
    const positions = [
      makePosition({ apy: 4, currentValue: 1_000_000n }),
      makePosition({ apy: 8, currentValue: 1_000_000n }),
    ]
    expect(calculateWeightedAPY(positions)).toBe(6)
  })

  it('weights APY by currentValue', () => {
    const positions = [
      makePosition({ apy: 4, currentValue: 1_000_000n }),
      makePosition({ apy: 8, currentValue: 3_000_000n }),
    ]
    expect(calculateWeightedAPY(positions)).toBe(7)
  })

  it('weighted APY is between min and max individual APYs', () => {
    const positions = [
      makePosition({ apy: 3, currentValue: 500_000n }),
      makePosition({ apy: 10, currentValue: 1_500_000n }),
      makePosition({ apy: 6, currentValue: 1_000_000n }),
    ]
    const result = calculateWeightedAPY(positions)
    expect(result).toBeGreaterThanOrEqual(3)
    expect(result).toBeLessThanOrEqual(10)
  })

  it('falls back to equal weighting when all currentValues are zero', () => {
    const positions = [
      makePosition({ apy: 4, currentValue: 0n }),
      makePosition({ apy: 8, currentValue: 0n }),
    ]
    expect(calculateWeightedAPY(positions)).toBe(6)
  })
})
