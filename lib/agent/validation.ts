/**
 * Data Validation and Security Utilities
 * 
 * Provides validation functions for user inputs and data integrity checks.
 * All user inputs should be validated using these functions before processing.
 */

import { TradeIntent } from '@/types/agent'

/**
 * Validate Ethereum Address
 * 
 * Checks if a string is a valid Ethereum address (0x followed by 40 hex characters).
 * 
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid Ethereum address
 * 
 * @example
 * validateEthereumAddress('0x1234567890123456789012345678901234567890') // true
 * validateEthereumAddress('invalid') // false
 */
export function validateEthereumAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false
  }

  // Check format: 0x followed by 40 hex characters
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/
  return ethereumAddressRegex.test(address)
}

/**
 * Validate Positive Number
 * 
 * Checks if a value is a positive number (greater than 0).
 * Accepts string or number input.
 * 
 * @param {string | number} value - Value to validate
 * @returns {boolean} True if valid positive number
 * 
 * @example
 * validatePositiveNumber('100') // true
 * validatePositiveNumber(0) // false
 * validatePositiveNumber('-50') // false
 */
export function validatePositiveNumber(value: string | number): boolean {
  if (value === null || value === undefined || value === '') {
    return false
  }

  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return false
  }

  return num > 0
}

/**
 * Validate Asset Supported
 * 
 * Checks if an asset is in the list of supported trading assets.
 * 
 * @param {string} asset - Asset identifier to validate
 * @returns {boolean} True if asset is supported
 * 
 * @example
 * validateAssetSupported('ETH/USDC') // true
 * validateAssetSupported('UNKNOWN/PAIR') // false
 */
export function validateAssetSupported(asset: string): boolean {
  const supportedAssets = [
    'ETH/USDC',
    'BTC/USDC',
    'USDC/USD',
    'DAI/USDC',
    'USDT/USDC',
  ]

  return supportedAssets.includes(asset)
}

/**
 * Validate Trade Intent Complete
 * 
 * Checks if a TradeIntent has all required fields populated.
 * 
 * @param {TradeIntent} intent - Trade intent to validate
 * @returns {boolean} True if all required fields are present
 * 
 * @example
 * const intent = {
 *   asset: 'ETH/USDC',
 *   amount: BigInt(1000),
 *   direction: 'buy',
 *   timestamp: Date.now() / 1000,
 * }
 * validateTradeIntentComplete(intent) // true
 */
export function validateTradeIntentComplete(intent: TradeIntent): boolean {
  if (!intent) {
    return false
  }

  // Check required fields
  if (!intent.asset || typeof intent.asset !== 'string') {
    return false
  }

  if (!intent.amount || typeof intent.amount !== 'bigint') {
    return false
  }

  if (!intent.direction || !['buy', 'sell'].includes(intent.direction)) {
    return false
  }

  if (!intent.timestamp || typeof intent.timestamp !== 'number') {
    return false
  }

  return true
}

/**
 * Validate Amount Within Limits
 * 
 * Checks if an amount is within acceptable trading limits.
 * 
 * @param {bigint} amount - Amount to validate
 * @param {bigint} minAmount - Minimum allowed amount
 * @param {bigint} maxAmount - Maximum allowed amount
 * @returns {boolean} True if amount is within limits
 * 
 * @example
 * validateAmountWithinLimits(
 *   BigInt(1000),
 *   BigInt(100),
 *   BigInt(10000)
 * ) // true
 */
export function validateAmountWithinLimits(
  amount: bigint,
  minAmount: bigint,
  maxAmount: bigint
): boolean {
  if (!amount || typeof amount !== 'bigint') {
    return false
  }

  return amount >= minAmount && amount <= maxAmount
}

/**
 * Validate API Response Structure
 * 
 * Checks if an API response has the expected structure.
 * 
 * @param {any} response - Response to validate
 * @param {string[]} requiredFields - Required field names
 * @returns {boolean} True if response has all required fields
 * 
 * @example
 * const response = { success: true, data: {} }
 * validateApiResponseStructure(response, ['success', 'data']) // true
 */
export function validateApiResponseStructure(
  response: any,
  requiredFields: string[]
): boolean {
  if (!response || typeof response !== 'object') {
    return false
  }

  return requiredFields.every((field) => field in response)
}

/**
 * Sanitize User Input
 * 
 * Removes potentially dangerous characters from user input.
 * 
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 * 
 * @example
 * sanitizeUserInput('<script>alert("xss")</script>') // 'scriptalertxssscript'
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove HTML tags and special characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>\"']/g, '') // Remove special characters
    .trim()
}

/**
 * Validate Transaction Hash
 * 
 * Checks if a string is a valid transaction hash (0x followed by 64 hex characters).
 * 
 * @param {string} txHash - Transaction hash to validate
 * @returns {boolean} True if valid transaction hash
 * 
 * @example
 * validateTransactionHash('0x' + 'a'.repeat(64)) // true
 * validateTransactionHash('invalid') // false
 */
export function validateTransactionHash(txHash: string): boolean {
  if (!txHash || typeof txHash !== 'string') {
    return false
  }

  // Check format: 0x followed by 64 hex characters
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/
  return txHashRegex.test(txHash)
}

/**
 * Validate Percentage
 * 
 * Checks if a value is a valid percentage (0-100).
 * 
 * @param {number} value - Value to validate
 * @returns {boolean} True if valid percentage
 * 
 * @example
 * validatePercentage(50) // true
 * validatePercentage(150) // false
 */
export function validatePercentage(value: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false
  }

  return value >= 0 && value <= 100
}

/**
 * Validate Sharpe Ratio
 * 
 * Checks if a value is a valid Sharpe ratio (typically -5 to 5).
 * 
 * @param {number} value - Sharpe ratio to validate
 * @returns {boolean} True if valid Sharpe ratio
 * 
 * @example
 * validateSharpeRatio(1.5) // true
 * validateSharpeRatio(10) // false
 */
export function validateSharpeRatio(value: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false
  }

  return value >= -5 && value <= 5
}

/**
 * Validate Drawdown Percentage
 * 
 * Checks if a value is a valid drawdown percentage (0-100).
 * 
 * @param {number} value - Drawdown percentage to validate
 * @returns {boolean} True if valid drawdown
 * 
 * @example
 * validateDrawdownPercentage(25) // true
 * validateDrawdownPercentage(150) // false
 */
export function validateDrawdownPercentage(value: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false
  }

  return value >= 0 && value <= 100
}
