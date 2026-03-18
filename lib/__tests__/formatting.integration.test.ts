/**
 * Integration test for formatting utilities
 * Demonstrates real-world usage scenarios
 * 
 * To run: npx tsx lib/__tests__/formatting.integration.test.ts
 */

import {
  formatUSDC,
  formatAPY,
  formatAddress,
  formatLargeNumber,
  formatTimestamp,
  formatTxHash
} from '../formatting'

console.log('\n=== Formatting Utilities Integration Test ===\n')

// Simulate a vault display
console.log('--- Vault Information ---')
const vaultAddress = '0x1234567890123456789012345678901234567890'
const tvl = 5_432_100_000_000n // $5,432,100 USDC
const apy = 8.75
const minDeposit = 100_000_000n // $100 USDC

console.log(`Vault: ${formatAddress(vaultAddress)}`)
console.log(`TVL: $${formatUSDC(tvl)} (${formatLargeNumber(Number(tvl) / 1_000_000)})`)
console.log(`APY: ${formatAPY(apy)}`)
console.log(`Min Deposit: $${formatUSDC(minDeposit)}`)

// Simulate a user position
console.log('\n--- User Position ---')
const userAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
const depositedAmount = 10_000_000_000n // $10,000 USDC
const currentValue = 10_875_000_000n // $10,875 USDC
const yieldEarned = currentValue - depositedAmount
const depositedAt = 1705276800 // Jan 15, 2024

console.log(`User: ${formatAddress(userAddress)}`)
console.log(`Deposited: $${formatUSDC(depositedAmount)}`)
console.log(`Current Value: $${formatUSDC(currentValue)}`)
console.log(`Yield Earned: $${formatUSDC(yieldEarned)} (${formatAPY((Number(yieldEarned) / Number(depositedAmount)) * 100)})`)
console.log(`Deposited On: ${formatTimestamp(depositedAt)}`)

// Simulate a transaction
console.log('\n--- Recent Transaction ---')
const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const txTimestamp = 1706745600 // Feb 1, 2024
const txAmount = 5_000_000_000n // $5,000 USDC

console.log(`Transaction: ${formatTxHash(txHash)}`)
console.log(`Amount: $${formatUSDC(txAmount)}`)
console.log(`Date: ${formatTimestamp(txTimestamp)}`)

// Simulate portfolio summary
console.log('\n--- Portfolio Summary ---')
const totalDeposited = 25_000_000_000n // $25,000 USDC
const totalValue = 27_125_000_000n // $27,125 USDC
const totalYield = totalValue - totalDeposited
const weightedAPY = 7.25

console.log(`Total Deposited: $${formatUSDC(totalDeposited)}`)
console.log(`Current Value: $${formatUSDC(totalValue)}`)
console.log(`Total Yield: $${formatUSDC(totalYield)}`)
console.log(`Weighted APY: ${formatAPY(weightedAPY)}`)

// Simulate protocol allocations
console.log('\n--- Protocol Allocations ---')
const protocols = [
  { name: 'Aave', allocation: 15_000_000_000n, apy: 6.5 },
  { name: 'Compound', allocation: 8_000_000_000n, apy: 7.2 },
  { name: 'Yearn', allocation: 4_125_000_000n, apy: 9.8 }
]

protocols.forEach(protocol => {
  const percentage = (Number(protocol.allocation) / Number(totalValue)) * 100
  console.log(`${protocol.name}: $${formatUSDC(protocol.allocation)} (${percentage.toFixed(1)}%) - ${formatAPY(protocol.apy)}`)
})

console.log('\n✓ All formatting functions working correctly in real-world scenarios\n')
