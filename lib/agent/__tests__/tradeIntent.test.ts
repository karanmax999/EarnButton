/**
 * Property-Based Tests for TradeIntent Serialization
 * 
 * **Validates: Requirements 2.4, 2.5, 2.7, 19.3**
 * 
 * Property 2: Trade Intent Round-Trip Serialization
 * Tests that TradeIntent objects can be serialized to JSON and parsed back
 * to produce equivalent objects (round-trip property).
 */

import fc from 'fast-check'
import {
  createTradeIntent,
  serializeTradeIntent,
  parseTradeIntent,
  prettyPrintTradeIntent,
} from '../tradeIntent'
import type { TradeIntent } from '@/types/agent'

// Arbitraries for generating test data
const assetArbitrary = fc.stringMatching(/^[A-Z]{2,4}\/[A-Z]{2,4}$/)
const amountArbitrary = fc.bigInt({ min: 1n, max: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') })
const directionArbitrary = fc.oneof(fc.constant('buy' as const), fc.constant('sell' as const))
const timestampArbitrary = fc.integer({ min: 0, max: Math.floor(Date.now() / 1000) })
const signatureArbitrary = fc.option(fc.string({ minLength: 130, maxLength: 130 }), { nil: undefined })
const priceProofArbitrary = fc.option(fc.string({ minLength: 100, maxLength: 200 }), { nil: undefined })

const tradeIntentArbitrary = fc.record({
  asset: assetArbitrary,
  amount: amountArbitrary,
  direction: directionArbitrary,
  timestamp: timestampArbitrary,
  signature: signatureArbitrary,
  priceProof: priceProofArbitrary,
})

describe('TradeIntent Serialization', () => {
  test('Property 2: Round-trip serialization preserves TradeIntent equivalence', () => {
    fc.assert(
      fc.property(tradeIntentArbitrary, (original) => {
        // Serialize to JSON
        const json = serializeTradeIntent(original)

        // Parse back from JSON
        const parsed = parseTradeIntent(json)

        // Verify all fields are equivalent
        expect(parsed.asset).toBe(original.asset)
        expect(parsed.amount).toBe(original.amount)
        expect(parsed.direction).toBe(original.direction)
        expect(parsed.timestamp).toBe(original.timestamp)
        // Handle null vs undefined for optional fields
        expect(parsed.signature ?? undefined).toBe(original.signature ?? undefined)
        expect(parsed.priceProof ?? undefined).toBe(original.priceProof ?? undefined)
      }),
      { numRuns: 100 }
    )
  })

  test('Property: Serialization produces valid JSON', () => {
    fc.assert(
      fc.property(tradeIntentArbitrary, (intent) => {
        const json = serializeTradeIntent(intent)

        // Should be valid JSON
        expect(() => JSON.parse(json)).not.toThrow()

        // Should be a string
        expect(typeof json).toBe('string')
      }),
      { numRuns: 100 }
    )
  })

  test('Property: Parsing preserves bigint precision', () => {
    fc.assert(
      fc.property(amountArbitrary, (amount) => {
        const intent = createTradeIntent('ETH/USDC', amount, 'buy', Date.now())
        const json = serializeTradeIntent(intent)
        const parsed = parseTradeIntent(json)

        // Bigint should be preserved exactly
        expect(parsed.amount).toBe(amount)
        expect(parsed.amount.toString()).toBe(amount.toString())
      }),
      { numRuns: 100 }
    )
  })

  test('Property: Direction is preserved correctly', () => {
    fc.assert(
      fc.property(directionArbitrary, (direction) => {
        const intent = createTradeIntent('ETH/USDC', BigInt(1000), direction, Date.now())
        const json = serializeTradeIntent(intent)
        const parsed = parseTradeIntent(json)

        expect(parsed.direction).toBe(direction)
        expect(['buy', 'sell']).toContain(parsed.direction)
      }),
      { numRuns: 100 }
    )
  })

  test('Property: Timestamp is preserved as non-negative number', () => {
    fc.assert(
      fc.property(timestampArbitrary, (timestamp) => {
        const intent = createTradeIntent('ETH/USDC', BigInt(1000), 'buy', timestamp)
        const json = serializeTradeIntent(intent)
        const parsed = parseTradeIntent(json)

        expect(parsed.timestamp).toBe(timestamp)
        expect(parsed.timestamp).toBeGreaterThanOrEqual(0)
        expect(typeof parsed.timestamp).toBe('number')
      }),
      { numRuns: 100 }
    )
  })

  test('Property: Optional fields are preserved when present', () => {
    fc.assert(
      fc.property(
        fc.record({
          asset: assetArbitrary,
          amount: amountArbitrary,
          direction: directionArbitrary,
          timestamp: timestampArbitrary,
          signature: fc.string({ minLength: 130, maxLength: 130 }),
          priceProof: fc.string({ minLength: 100, maxLength: 200 }),
        }),
        (intent) => {
          const json = serializeTradeIntent(intent)
          const parsed = parseTradeIntent(json)

          expect(parsed.signature).toBe(intent.signature)
          expect(parsed.priceProof).toBe(intent.priceProof)
        }
      )
    )
  })

  test('Property: Optional fields are omitted when undefined', () => {
    fc.assert(
      fc.property(
        fc.record({
          asset: assetArbitrary,
          amount: amountArbitrary,
          direction: directionArbitrary,
          timestamp: timestampArbitrary,
        }),
        (intent) => {
          const json = serializeTradeIntent(intent)
          const parsed = parseTradeIntent(json)

          expect(parsed.signature).toBeUndefined()
          expect(parsed.priceProof).toBeUndefined()
        }
      )
    )
  })

  test('Serialization rejects invalid asset', () => {
    const invalidIntent = {
      asset: '',
      amount: BigInt(1000),
      direction: 'buy' as const,
      timestamp: Date.now(),
    }

    expect(() => serializeTradeIntent(invalidIntent as TradeIntent)).toThrow(
      'Invalid TradeIntent: asset must be a non-empty string'
    )
  })

  test('Serialization rejects invalid direction', () => {
    const invalidIntent = {
      asset: 'ETH/USDC',
      amount: BigInt(1000),
      direction: 'invalid' as any,
      timestamp: Date.now(),
    }

    expect(() => serializeTradeIntent(invalidIntent as TradeIntent)).toThrow(
      'Invalid TradeIntent: direction must be "buy" or "sell"'
    )
  })

  test('Serialization rejects negative timestamp', () => {
    const invalidIntent = {
      asset: 'ETH/USDC',
      amount: BigInt(1000),
      direction: 'buy' as const,
      timestamp: -1,
    }

    expect(() => serializeTradeIntent(invalidIntent as TradeIntent)).toThrow(
      'Invalid TradeIntent: timestamp must be a non-negative number'
    )
  })

  test('Parsing rejects invalid JSON', () => {
    expect(() => parseTradeIntent('not valid json')).toThrow('Invalid JSON')
  })

  test('Parsing rejects missing required fields', () => {
    const incompleteJson = JSON.stringify({
      asset: 'ETH/USDC',
      amount: '1000',
      // missing direction and timestamp
    })

    expect(() => parseTradeIntent(incompleteJson)).toThrow()
  })

  test('Parsing rejects invalid amount string', () => {
    const invalidJson = JSON.stringify({
      asset: 'ETH/USDC',
      amount: 'not a number',
      direction: 'buy',
      timestamp: Date.now(),
    })

    expect(() => parseTradeIntent(invalidJson)).toThrow(
      'Invalid TradeIntent: amount must be a valid bigint string'
    )
  })

  test('createTradeIntent creates valid intent', () => {
    const intent = createTradeIntent('ETH/USDC', BigInt(1000), 'buy', 123456)

    expect(intent.asset).toBe('ETH/USDC')
    expect(intent.amount).toBe(BigInt(1000))
    expect(intent.direction).toBe('buy')
    expect(intent.timestamp).toBe(123456)
    expect(intent.signature).toBeUndefined()
    expect(intent.priceProof).toBeUndefined()
  })

  test('createTradeIntent with optional fields', () => {
    const intent = createTradeIntent(
      'ETH/USDC',
      BigInt(1000),
      'sell',
      123456,
      '0xsignature',
      '0xproof'
    )

    expect(intent.signature).toBe('0xsignature')
    expect(intent.priceProof).toBe('0xproof')
  })

  test('prettyPrintTradeIntent formats correctly', () => {
    const intent = createTradeIntent('ETH/USDC', BigInt(1000), 'buy', 123456)
    const formatted = prettyPrintTradeIntent(intent)

    expect(formatted).toContain('TradeIntent {')
    expect(formatted).toContain('asset: ETH/USDC')
    expect(formatted).toContain('amount: 1000')
    expect(formatted).toContain('direction: buy')
    expect(formatted).toContain('timestamp: 123456')
    expect(formatted).toContain('}')
  })

  test('prettyPrintTradeIntent includes optional fields', () => {
    const intent = createTradeIntent(
      'ETH/USDC',
      BigInt(1000),
      'buy',
      123456,
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    )
    const formatted = prettyPrintTradeIntent(intent)

    expect(formatted).toContain('signature:')
    expect(formatted).toContain('priceProof:')
  })
})
