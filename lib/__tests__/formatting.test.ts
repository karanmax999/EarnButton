/**
 * Manual tests for formatting functions
 * These tests verify the formatting utilities work correctly
 * 
 * To run: npx tsx lib/__tests__/formatting.test.ts
 */

import {
  formatUSDC,
  formatAPY,
  formatAddress,
  formatLargeNumber,
  formatTimestamp,
  formatTxHash
} from '../formatting'

// Test counter
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
    throw new Error(message || `Expected "${expected}", got "${actual}"`)
  }
}

console.log('\n=== Testing formatUSDC ===\n')

test('formats zero USDC', () => {
  assertEqual(formatUSDC(0n), '0.00')
})

test('formats small USDC amount', () => {
  assertEqual(formatUSDC(1_000_000n), '1.00')
})

test('formats USDC with cents', () => {
  assertEqual(formatUSDC(1_234_560n), '1.23')
})

test('formats large USDC amount with comma separators', () => {
  assertEqual(formatUSDC(1_234_567_890n), '1,234.57')
})

test('formats USDC with thousands separator', () => {
  assertEqual(formatUSDC(10_000_000_000n), '10,000.00')
})

test('formats USDC with millions', () => {
  assertEqual(formatUSDC(1_000_000_000_000n), '1,000,000.00')
})

test('formats fractional USDC correctly', () => {
  assertEqual(formatUSDC(500_000n), '0.50')
})

test('formats USDC with proper rounding', () => {
  assertEqual(formatUSDC(1_235_000n), '1.24')
})

console.log('\n=== Testing formatAPY ===\n')

test('formats zero APY', () => {
  assertEqual(formatAPY(0), '0.00%')
})

test('formats single digit APY', () => {
  assertEqual(formatAPY(5), '5.00%')
})

test('formats APY with decimals', () => {
  assertEqual(formatAPY(5.5), '5.50%')
})

test('formats APY with two decimal places', () => {
  assertEqual(formatAPY(12.34), '12.34%')
})

test('formats APY with rounding', () => {
  // Note: toFixed uses banker's rounding (round half to even)
  // 5.555 rounds to 5.55 (not 5.56) due to floating point representation
  assertEqual(formatAPY(5.555), '5.55%')
})

test('formats large APY', () => {
  assertEqual(formatAPY(123.45), '123.45%')
})

test('formats negative APY', () => {
  assertEqual(formatAPY(-2.5), '-2.50%')
})

console.log('\n=== Testing formatAddress ===\n')

test('formats standard Ethereum address', () => {
  const address = '0x1234567890123456789012345678901234567890'
  assertEqual(formatAddress(address), '0x1234...7890')
})

test('formats address with lowercase hex', () => {
  const address = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  assertEqual(formatAddress(address), '0xabcd...abcd')
})

test('formats address with uppercase hex', () => {
  const address = '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD'
  assertEqual(formatAddress(address), '0xABCD...ABCD')
})

test('formats address with mixed case', () => {
  const address = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12'
  assertEqual(formatAddress(address), '0xAbCd...Ef12')
})

test('returns short string unchanged', () => {
  assertEqual(formatAddress('0x123'), '0x123')
})

test('returns empty string unchanged', () => {
  assertEqual(formatAddress(''), '')
})

console.log('\n=== Testing formatLargeNumber ===\n')

test('formats small number without suffix', () => {
  assertEqual(formatLargeNumber(0), '0')
  assertEqual(formatLargeNumber(100), '100')
  assertEqual(formatLargeNumber(999), '999')
})

test('formats thousands with K suffix', () => {
  assertEqual(formatLargeNumber(1_000), '1.0K')
  assertEqual(formatLargeNumber(1_500), '1.5K')
  assertEqual(formatLargeNumber(10_000), '10.0K')
  assertEqual(formatLargeNumber(999_999), '1000.0K')
})

test('formats millions with M suffix', () => {
  assertEqual(formatLargeNumber(1_000_000), '1.0M')
  assertEqual(formatLargeNumber(2_500_000), '2.5M')
  assertEqual(formatLargeNumber(10_000_000), '10.0M')
  assertEqual(formatLargeNumber(123_456_789), '123.5M')
})

test('formats bigint values', () => {
  assertEqual(formatLargeNumber(1_000n), '1.0K')
  assertEqual(formatLargeNumber(1_000_000n), '1.0M')
  assertEqual(formatLargeNumber(500n), '500')
})

test('formats edge case at 1000 boundary', () => {
  assertEqual(formatLargeNumber(999), '999')
  assertEqual(formatLargeNumber(1_000), '1.0K')
})

test('formats edge case at 1M boundary', () => {
  assertEqual(formatLargeNumber(999_999), '1000.0K')
  assertEqual(formatLargeNumber(1_000_000), '1.0M')
})

console.log('\n=== Testing formatTimestamp ===\n')

test('formats timestamp to human-readable date', () => {
  // Jan 15, 2024 00:00:00 UTC
  const timestamp = 1705276800
  assertEqual(formatTimestamp(timestamp), 'Jan 15, 2024')
})

test('formats different months correctly', () => {
  // Feb 1, 2024
  assertEqual(formatTimestamp(1706745600), 'Feb 1, 2024')
  // Mar 1, 2024
  assertEqual(formatTimestamp(1709251200), 'Mar 1, 2024')
  // Dec 31, 2024
  assertEqual(formatTimestamp(1735603200), 'Dec 31, 2024')
})

test('formats year 2023', () => {
  // Jan 1, 2023
  assertEqual(formatTimestamp(1672531200), 'Jan 1, 2023')
})

test('formats year 2025', () => {
  // Jan 1, 2025
  assertEqual(formatTimestamp(1735689600), 'Jan 1, 2025')
})

test('formats double-digit day', () => {
  // Jan 25, 2024
  assertEqual(formatTimestamp(1706140800), 'Jan 25, 2024')
})

console.log('\n=== Testing formatTxHash ===\n')

test('formats standard transaction hash', () => {
  const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  assertEqual(formatTxHash(txHash), '0x12345678...90abcdef')
})

test('formats transaction hash with all lowercase', () => {
  const txHash = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  assertEqual(formatTxHash(txHash), '0xabcdefab...cdefabcd')
})

test('formats transaction hash with all uppercase', () => {
  const txHash = '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD'
  assertEqual(formatTxHash(txHash), '0xABCDEFAB...CDEFABCD')
})

test('formats transaction hash with mixed case', () => {
  const txHash = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890'
  assertEqual(formatTxHash(txHash), '0xAbCdEf12...34567890')
})

test('returns short string unchanged', () => {
  assertEqual(formatTxHash('0x123'), '0x123')
})

test('returns empty string unchanged', () => {
  assertEqual(formatTxHash(''), '')
})

// Print summary
console.log('\n=== Test Summary ===\n')
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log(`Total: ${passed + failed}\n`)

if (failed > 0) {
  process.exit(1)
}
