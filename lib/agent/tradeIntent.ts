/**
 * Trade Intent Serialization and Parsing
 * 
 * This module provides utilities for creating, serializing, parsing, and formatting
 * TradeIntent objects. It handles the conversion between TradeIntent objects and JSON,
 * with special handling for bigint values which cannot be directly serialized to JSON.
 */

import { TradeIntent } from '@/types/agent'

/**
 * Creates a new TradeIntent object with the specified parameters
 * 
 * @param asset - Trading pair identifier (e.g., "ETH/USDC")
 * @param amount - Amount to trade in base units (wei for ETH, etc.)
 * @param direction - Trade direction ('buy' or 'sell')
 * @param timestamp - Unix timestamp when the intent was created
 * @param signature - Optional EIP-712 signature
 * @param priceProof - Optional RedStone price proof
 * @returns A new TradeIntent object
 * 
 * @example
 * const intent = createTradeIntent('ETH/USDC', BigInt('1000000000000000000'), 'buy', Date.now())
 */
export function createTradeIntent(
  asset: string,
  amount: bigint,
  direction: 'buy' | 'sell',
  timestamp: number,
  signature?: string,
  priceProof?: string
): TradeIntent {
  return {
    asset,
    amount,
    direction,
    timestamp,
    signature,
    priceProof,
  }
}

/**
 * Serializes a TradeIntent object to JSON string
 * 
 * Converts bigint values to strings since JSON doesn't support bigint natively.
 * 
 * @param intent - The TradeIntent object to serialize
 * @returns JSON string representation of the TradeIntent
 * @throws Error if the intent is invalid or cannot be serialized
 * 
 * @example
 * const intent = createTradeIntent('ETH/USDC', BigInt('1000000000000000000'), 'buy', Date.now())
 * const json = serializeTradeIntent(intent)
 * console.log(json) // '{"asset":"ETH/USDC","amount":"1000000000000000000",...}'
 */
export function serializeTradeIntent(intent: TradeIntent): string {
  if (!intent || typeof intent !== 'object') {
    throw new Error('Invalid TradeIntent: must be an object')
  }

  if (!intent.asset || typeof intent.asset !== 'string') {
    throw new Error('Invalid TradeIntent: asset must be a non-empty string')
  }

  if (intent.amount === undefined || intent.amount === null) {
    throw new Error('Invalid TradeIntent: amount is required')
  }

  if (typeof intent.amount !== 'bigint') {
    throw new Error('Invalid TradeIntent: amount must be a bigint')
  }

  if (!intent.direction || !['buy', 'sell'].includes(intent.direction)) {
    throw new Error('Invalid TradeIntent: direction must be "buy" or "sell"')
  }

  if (typeof intent.timestamp !== 'number' || intent.timestamp < 0) {
    throw new Error('Invalid TradeIntent: timestamp must be a non-negative number')
  }

  const serialized = {
    asset: intent.asset,
    amount: intent.amount.toString(),
    direction: intent.direction,
    timestamp: intent.timestamp,
    ...(intent.signature && { signature: intent.signature }),
    ...(intent.priceProof && { priceProof: intent.priceProof }),
  }

  return JSON.stringify(serialized)
}

/**
 * Parses a JSON string into a TradeIntent object
 * 
 * Converts string amount values back to bigint.
 * 
 * @param json - JSON string representation of a TradeIntent
 * @returns Parsed TradeIntent object
 * @throws Error if the JSON is invalid or doesn't match TradeIntent structure
 * 
 * @example
 * const json = '{"asset":"ETH/USDC","amount":"1000000000000000000","direction":"buy","timestamp":1234567890}'
 * const intent = parseTradeIntent(json)
 * console.log(intent.amount) // BigInt('1000000000000000000')
 */
export function parseTradeIntent(json: string): TradeIntent {
  if (!json || typeof json !== 'string') {
    throw new Error('Invalid input: must be a non-empty string')
  }

  let parsed: any
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid TradeIntent: parsed JSON must be an object')
  }

  if (!parsed.asset || typeof parsed.asset !== 'string') {
    throw new Error('Invalid TradeIntent: asset must be a non-empty string')
  }

  if (!parsed.amount || typeof parsed.amount !== 'string') {
    throw new Error('Invalid TradeIntent: amount must be a string')
  }

  let amount: bigint
  try {
    amount = BigInt(parsed.amount)
  } catch (error) {
    throw new Error(`Invalid TradeIntent: amount must be a valid bigint string, got "${parsed.amount}"`)
  }

  if (!parsed.direction || !['buy', 'sell'].includes(parsed.direction)) {
    throw new Error('Invalid TradeIntent: direction must be "buy" or "sell"')
  }

  if (typeof parsed.timestamp !== 'number' || parsed.timestamp < 0) {
    throw new Error('Invalid TradeIntent: timestamp must be a non-negative number')
  }

  if (parsed.signature !== undefined && typeof parsed.signature !== 'string') {
    throw new Error('Invalid TradeIntent: signature must be a string if provided')
  }

  if (parsed.priceProof !== undefined && typeof parsed.priceProof !== 'string') {
    throw new Error('Invalid TradeIntent: priceProof must be a string if provided')
  }

  return {
    asset: parsed.asset,
    amount,
    direction: parsed.direction,
    timestamp: parsed.timestamp,
    signature: parsed.signature,
    priceProof: parsed.priceProof,
  }
}

/**
 * Formats a TradeIntent object for display
 * 
 * Converts the TradeIntent to a human-readable string representation.
 * 
 * @param intent - The TradeIntent object to format
 * @returns Formatted string representation
 * 
 * @example
 * const intent = createTradeIntent('ETH/USDC', BigInt('1000000000000000000'), 'buy', 1234567890)
 * console.log(prettyPrintTradeIntent(intent))
 * // TradeIntent {
 * //   asset: ETH/USDC
 * //   amount: 1000000000000000000
 * //   direction: buy
 * //   timestamp: 1234567890
 * // }
 */
export function prettyPrintTradeIntent(intent: TradeIntent): string {
  const lines = [
    'TradeIntent {',
    `  asset: ${intent.asset}`,
    `  amount: ${intent.amount.toString()}`,
    `  direction: ${intent.direction}`,
    `  timestamp: ${intent.timestamp}`,
  ]

  if (intent.signature) {
    lines.push(`  signature: ${intent.signature.substring(0, 20)}...`)
  }

  if (intent.priceProof) {
    lines.push(`  priceProof: ${intent.priceProof.substring(0, 20)}...`)
  }

  lines.push('}')

  return lines.join('\n')
}
