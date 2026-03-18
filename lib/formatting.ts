import { format } from 'date-fns'

/**
 * Formats USDC amounts with 2 decimal places and comma separators
 * 
 * Requirements 9.1: Formats USDC values with 2 decimal places and comma separators
 * 
 * @param amount - The USDC amount as bigint (6 decimals)
 * @returns Formatted string (e.g., "1,234.56")
 */
export function formatUSDC(amount: bigint): string {
  // Convert from 6 decimals to a number
  const value = Number(amount) / 1_000_000
  
  // Format with 2 decimal places and comma separators
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Formats APY values with 2 decimal places and % symbol
 * 
 * Requirements 9.2: Formats APY percentages with 2 decimal places and "%" symbol
 * 
 * @param apy - The APY value as a number (e.g., 5.5 for 5.5%)
 * @returns Formatted string (e.g., "5.50%")
 */
export function formatAPY(apy: number): string {
  return `${apy.toFixed(2)}%`
}

/**
 * Formats Ethereum addresses by truncating to first 6 and last 4 characters
 * 
 * Requirements 9.3: Truncates addresses to show first 6 and last 4 characters
 * 
 * @param address - The Ethereum address (42 characters starting with 0x)
 * @returns Truncated string (e.g., "0x1234...5678")
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) {
    return address
  }
  
  const start = address.slice(0, 6)
  const end = address.slice(-4)
  
  return `${start}...${end}`
}

/**
 * Formats large numbers with K/M suffixes
 * 
 * Requirements 9.4: Uses K suffix for thousands and M suffix for millions
 * 
 * @param value - The number to format (can be bigint or number)
 * @returns Formatted string (e.g., "1.5K", "2.3M")
 */
export function formatLargeNumber(value: bigint | number): string {
  const num = typeof value === 'bigint' ? Number(value) : value
  
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  
  return num.toFixed(0)
}

/**
 * Formats Unix timestamps to human-readable dates
 * 
 * Requirements 9.5: Formats dates in human-readable format (e.g., "Jan 15, 2024")
 * 
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return format(date, 'MMM d, yyyy')
}

/**
 * Formats transaction hashes by truncating to first 10 and last 8 characters
 * 
 * Requirements 9.6: Truncates transaction hashes to show first 10 and last 8 characters
 * 
 * @param txHash - The transaction hash (66 characters starting with 0x)
 * @returns Truncated string (e.g., "0x12345678...abcdefgh")
 */
export function formatTxHash(txHash: string): string {
  if (!txHash || txHash.length < 18) {
    return txHash
  }
  
  const start = txHash.slice(0, 10)
  const end = txHash.slice(-8)
  
  return `${start}...${end}`
}
