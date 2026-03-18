/**
 * Tests for portfolio calculation functions
 *
 * To run: npx tsx lib/__tests__/portfolio.test.ts
 */

import {
  calculateTotalDeposited,
  calculateTotalValue,
  calculateYieldEarned,
  calculateWeightedAPY,
} from '../portfolio'
import type { VaultPosition } from '@/types'

// ── Test harness ──────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (error) {
    console.error(`✗ ${name}`)
    console.error(`  ${error}`)
    failed++
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message ?? `Expected ${String(expected)}, got ${String(actual)}`)
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makePosition(overrides: Partial<VaultPosition> = {}): VaultPosition {
  return {
    vaultAddress: '0x1234567890123456789012345678901234567890',
    vaultName: 'Test Vault',
    depositedAmount: 1_000_000n,   // 1 USDC (6 decimals)
    currentValue: 1_050_000n,      // 1.05 USDC
    shares: 1_000_000n,
    apy: 5,
    depositedAt: 1_700_000_000,
    ...overrides,
  }
}

// ── calculateTotalDeposited ───────────────────────────────────────────────────

console.log('\n=== calculateTotalDeposited ===\n')

test('returns 0n for empty array', () => {
  assertEqual(calculateTotalDeposited([]), 0n)
})

test('returns depositedAmount for single position', () => {
  const pos = makePosition({ depositedAmount: 5_000_000n })
  assertEqual(calculateTotalDeposited([pos]), 5_000_000n)
})

test('sums depositedAmount across multiple positions', () => {
  const positions = [
    makePosition({ depositedAmount: 1_000_000n }),
    makePosition({ depositedAmount: 2_000_000n }),
    makePosition({ depositedAmount: 3_000_000n }),
  ]
  assertEqual(calculateTotalDeposited(positions), 6_000_000n)
})

test('handles zero depositedAmount', () => {
  const positions = [
    makePosition({ depositedAmount: 0n }),
    makePosition({ depositedAmount: 1_000_000n }),
  ]
  assertEqual(calculateTotalDeposited(positions), 1_000_000n)
})

test('handles large bigint values', () => {
  const positions = [
    makePosition({ depositedAmount: 1_000_000_000_000n }),
    makePosition({ depositedAmount: 2_000_000_000_000n }),
  ]
  assertEqual(calculateTotalDeposited(positions), 3_000_000_000_000n)
})

// ── calculateTotalValue ───────────────────────────────────────────────────────

console.log('\n=== calculateTotalValue ===\n')

test('returns 0n for empty array', () => {
  assertEqual(calculateTotalValue([]), 0n)
})

test('returns currentValue for single position', () => {
  const pos = makePosition({ currentValue: 1_100_000n })
  assertEqual(calculateTotalValue([pos]), 1_100_000n)
})

test('sums currentValue across multiple positions', () => {
  const positions = [
    makePosition({ currentValue: 1_100_000n }),
    makePosition({ currentValue: 2_200_000n }),
    makePosition({ currentValue: 3_300_000n }),
  ]
  assertEqual(calculateTotalValue(positions), 6_600_000n)
})

test('handles zero currentValue', () => {
  const positions = [
    makePosition({ currentValue: 0n }),
    makePosition({ currentValue: 500_000n }),
  ]
  assertEqual(calculateTotalValue(positions), 500_000n)
})

// ── calculateYieldEarned ──────────────────────────────────────────────────────

console.log('\n=== calculateYieldEarned ===\n')

test('returns 0n for empty array', () => {
  assertEqual(calculateYieldEarned([]), 0n)
})

test('returns positive yield when value > deposited', () => {
  const pos = makePosition({ depositedAmount: 1_000_000n, currentValue: 1_100_000n })
  assertEqual(calculateYieldEarned([pos]), 100_000n)
})

test('returns zero yield when value equals deposited', () => {
  const pos = makePosition({ depositedAmount: 1_000_000n, currentValue: 1_000_000n })
  assertEqual(calculateYieldEarned([pos]), 0n)
})

test('returns negative yield when value < deposited (vault loss)', () => {
  const pos = makePosition({ depositedAmount: 1_000_000n, currentValue: 900_000n })
  assertEqual(calculateYieldEarned([pos]), -100_000n)
})

test('aggregates yield across multiple positions', () => {
  const positions = [
    makePosition({ depositedAmount: 1_000_000n, currentValue: 1_100_000n }),
    makePosition({ depositedAmount: 2_000_000n, currentValue: 2_300_000n }),
  ]
  // total value = 3_400_000, total deposited = 3_000_000, yield = 400_000
  assertEqual(calculateYieldEarned(positions), 400_000n)
})

// ── calculateWeightedAPY ──────────────────────────────────────────────────────

console.log('\n=== calculateWeightedAPY ===\n')

test('returns 0 for empty array', () => {
  assertEqual(calculateWeightedAPY([]), 0)
})

test('returns the single position APY unchanged', () => {
  const pos = makePosition({ apy: 7.5, currentValue: 1_000_000n })
  assertEqual(calculateWeightedAPY([pos]), 7.5)
})

test('returns equal-weighted average when all values are equal', () => {
  const positions = [
    makePosition({ apy: 4, currentValue: 1_000_000n }),
    makePosition({ apy: 8, currentValue: 1_000_000n }),
  ]
  assertEqual(calculateWeightedAPY(positions), 6)
})

test('weights APY by currentValue', () => {
  // 1 USDC at 4% and 3 USDC at 8% → weighted = (1*4 + 3*8) / 4 = 7
  const positions = [
    makePosition({ apy: 4, currentValue: 1_000_000n }),
    makePosition({ apy: 8, currentValue: 3_000_000n }),
  ]
  assertEqual(calculateWeightedAPY(positions), 7)
})

test('weighted APY is between min and max individual APYs', () => {
  const positions = [
    makePosition({ apy: 3, currentValue: 500_000n }),
    makePosition({ apy: 10, currentValue: 1_500_000n }),
    makePosition({ apy: 6, currentValue: 1_000_000n }),
  ]
  const result = calculateWeightedAPY(positions)
  assert(result >= 3, `Weighted APY ${result} should be >= min APY 3`)
  assert(result <= 10, `Weighted APY ${result} should be <= max APY 10`)
})

test('falls back to equal weighting when all currentValues are zero', () => {
  const positions = [
    makePosition({ apy: 4, currentValue: 0n }),
    makePosition({ apy: 8, currentValue: 0n }),
  ]
  assertEqual(calculateWeightedAPY(positions), 6)
})

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n=== Test Summary ===\n')
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log(`Total: ${passed + failed}\n`)

if (failed > 0) {
  process.exit(1)
}
