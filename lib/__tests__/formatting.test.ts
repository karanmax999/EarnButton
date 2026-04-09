/**
 * Tests for formatting functions
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

describe('formatUSDC', () => {
  it('formats zero USDC', () => {
    expect(formatUSDC(0n)).toBe('0.00')
  })

  it('formats small USDC amount', () => {
    expect(formatUSDC(1_000_000n)).toBe('1.00')
  })

  it('formats USDC with cents', () => {
    expect(formatUSDC(1_234_560n)).toBe('1.23')
  })

  it('formats large USDC amount with comma separators', () => {
    expect(formatUSDC(1_234_567_890n)).toBe('1,234.57')
  })

  it('formats USDC with thousands separator', () => {
    expect(formatUSDC(10_000_000_000n)).toBe('10,000.00')
  })

  it('formats USDC with millions', () => {
    expect(formatUSDC(1_000_000_000_000n)).toBe('1,000,000.00')
  })

  it('formats fractional USDC correctly', () => {
    expect(formatUSDC(500_000n)).toBe('0.50')
  })

  it('formats USDC with proper rounding', () => {
    expect(formatUSDC(1_235_000n)).toBe('1.24')
  })
})

describe('formatAPY', () => {
  it('formats zero APY', () => {
    expect(formatAPY(0)).toBe('0.00%')
  })

  it('formats single digit APY', () => {
    expect(formatAPY(5)).toBe('5.00%')
  })

  it('formats APY with decimals', () => {
    expect(formatAPY(5.5)).toBe('5.50%')
  })

  it('formats APY with two decimal places', () => {
    expect(formatAPY(12.34)).toBe('12.34%')
  })

  it('formats APY with rounding', () => {
    expect(formatAPY(5.555)).toBe('5.55%')
  })

  it('formats large APY', () => {
    expect(formatAPY(123.45)).toBe('123.45%')
  })

  it('formats negative APY', () => {
    expect(formatAPY(-2.5)).toBe('-2.50%')
  })
})

describe('formatAddress', () => {
  it('formats standard Ethereum address', () => {
    expect(formatAddress('0x1234567890123456789012345678901234567890')).toBe('0x1234...7890')
  })

  it('formats address with lowercase hex', () => {
    expect(formatAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')).toBe('0xabcd...abcd')
  })

  it('formats address with uppercase hex', () => {
    expect(formatAddress('0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD')).toBe('0xABCD...ABCD')
  })

  it('formats address with mixed case', () => {
    expect(formatAddress('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12')).toBe('0xAbCd...Ef12')
  })

  it('returns short string unchanged', () => {
    expect(formatAddress('0x123')).toBe('0x123')
  })

  it('returns empty string unchanged', () => {
    expect(formatAddress('')).toBe('')
  })
})

describe('formatLargeNumber', () => {
  it('formats small number without suffix', () => {
    expect(formatLargeNumber(0)).toBe('0')
    expect(formatLargeNumber(100)).toBe('100')
    expect(formatLargeNumber(999)).toBe('999')
  })

  it('formats thousands with K suffix', () => {
    expect(formatLargeNumber(1_000)).toBe('1.0K')
    expect(formatLargeNumber(1_500)).toBe('1.5K')
    expect(formatLargeNumber(10_000)).toBe('10.0K')
    expect(formatLargeNumber(999_999)).toBe('1000.0K')
  })

  it('formats millions with M suffix', () => {
    expect(formatLargeNumber(1_000_000)).toBe('1.0M')
    expect(formatLargeNumber(2_500_000)).toBe('2.5M')
    expect(formatLargeNumber(10_000_000)).toBe('10.0M')
    expect(formatLargeNumber(123_456_789)).toBe('123.5M')
  })

  it('formats bigint values', () => {
    expect(formatLargeNumber(1_000n)).toBe('1.0K')
    expect(formatLargeNumber(1_000_000n)).toBe('1.0M')
    expect(formatLargeNumber(500n)).toBe('500')
  })

  it('formats edge case at 1000 boundary', () => {
    expect(formatLargeNumber(999)).toBe('999')
    expect(formatLargeNumber(1_000)).toBe('1.0K')
  })

  it('formats edge case at 1M boundary', () => {
    expect(formatLargeNumber(999_999)).toBe('1000.0K')
    expect(formatLargeNumber(1_000_000)).toBe('1.0M')
  })
})

describe('formatTimestamp', () => {
  it('formats timestamp to human-readable date', () => {
    expect(formatTimestamp(1705276800)).toBe('Jan 15, 2024')
  })

  it('formats different months correctly', () => {
    expect(formatTimestamp(1706745600)).toBe('Feb 1, 2024')
    expect(formatTimestamp(1709251200)).toBe('Mar 1, 2024')
    expect(formatTimestamp(1735603200)).toBe('Dec 31, 2024')
  })

  it('formats year 2023', () => {
    expect(formatTimestamp(1672531200)).toBe('Jan 1, 2023')
  })

  it('formats year 2025', () => {
    expect(formatTimestamp(1735689600)).toBe('Jan 1, 2025')
  })

  it('formats double-digit day', () => {
    expect(formatTimestamp(1706140800)).toBe('Jan 25, 2024')
  })
})

describe('formatTxHash', () => {
  it('formats standard transaction hash', () => {
    expect(formatTxHash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')).toBe('0x12345678...90abcdef')
  })

  it('formats transaction hash with all lowercase', () => {
    expect(formatTxHash('0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd')).toBe('0xabcdefab...cdefabcd')
  })

  it('formats transaction hash with all uppercase', () => {
    expect(formatTxHash('0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD')).toBe('0xABCDEFAB...CDEFABCD')
  })

  it('formats transaction hash with mixed case', () => {
    expect(formatTxHash('0xAbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890')).toBe('0xAbCdEf12...34567890')
  })

  it('returns short string unchanged', () => {
    expect(formatTxHash('0x123')).toBe('0x123')
  })

  it('returns empty string unchanged', () => {
    expect(formatTxHash('')).toBe('')
  })
})
