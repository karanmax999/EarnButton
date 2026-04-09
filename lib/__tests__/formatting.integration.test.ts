/**
 * Integration test for formatting utilities
 * Demonstrates real-world usage scenarios
 */

import { describe, it, expect } from 'vitest'
import {
  formatUSDC,
  formatAPY,
  formatAddress,
  formatLargeNumber,
  formatTimestamp,
  formatTxHash
} from '../formatting'

describe('Formatting Utilities Integration', () => {
  it('formats vault information correctly', () => {
    const vaultAddress = '0x1234567890123456789012345678901234567890'
    const tvl = 5_432_100_000_000n
    const apy = 8.75
    const minDeposit = 100_000_000n

    expect(formatAddress(vaultAddress)).toBe('0x1234...7890')
    expect(formatUSDC(tvl)).toBe('5,432,100.00')
    expect(formatLargeNumber(Number(tvl) / 1_000_000)).toBe('5.4M')
    expect(formatAPY(apy)).toBe('8.75%')
    expect(formatUSDC(minDeposit)).toBe('100.00')
  })

  it('formats user position correctly', () => {
    const userAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    const depositedAmount = 10_000_000_000n
    const currentValue = 10_875_000_000n
    const yieldEarned = currentValue - depositedAmount
    const depositedAt = 1705276800

    expect(formatAddress(userAddress)).toBe('0xabcd...abcd')
    expect(formatUSDC(depositedAmount)).toBe('10,000.00')
    expect(formatUSDC(currentValue)).toBe('10,875.00')
    expect(formatUSDC(yieldEarned)).toBe('875.00')
    expect(formatTimestamp(depositedAt)).toBe('Jan 15, 2024')
  })

  it('formats transaction data correctly', () => {
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    const txTimestamp = 1706745600
    const txAmount = 5_000_000_000n

    expect(formatTxHash(txHash)).toBe('0x12345678...90abcdef')
    expect(formatUSDC(txAmount)).toBe('5,000.00')
    expect(formatTimestamp(txTimestamp)).toBe('Feb 1, 2024')
  })

  it('formats portfolio summary correctly', () => {
    const totalDeposited = 25_000_000_000n
    const totalValue = 27_125_000_000n
    const totalYield = totalValue - totalDeposited
    const weightedAPY = 7.25

    expect(formatUSDC(totalDeposited)).toBe('25,000.00')
    expect(formatUSDC(totalValue)).toBe('27,125.00')
    expect(formatUSDC(totalYield)).toBe('2,125.00')
    expect(formatAPY(weightedAPY)).toBe('7.25%')
  })

  it('formats protocol allocations correctly', () => {
    const protocols = [
      { name: 'Aave', allocation: 15_000_000_000n, apy: 6.5 },
      { name: 'Compound', allocation: 8_000_000_000n, apy: 7.2 },
      { name: 'Yearn', allocation: 4_125_000_000n, apy: 9.8 }
    ]

    expect(formatUSDC(protocols[0].allocation)).toBe('15,000.00')
    expect(formatAPY(protocols[0].apy)).toBe('6.50%')
    expect(formatUSDC(protocols[1].allocation)).toBe('8,000.00')
    expect(formatAPY(protocols[1].apy)).toBe('7.20%')
    expect(formatUSDC(protocols[2].allocation)).toBe('4,125.00')
    expect(formatAPY(protocols[2].apy)).toBe('9.80%')
  })
})
