/**
 * Property-Based Tests for ValidationArtifact Serialization
 * 
 * **Validates: Requirements 4.1-4.4, 20.1-20.7**
 * 
 * Property 8: Validation Artifact Round-Trip Serialization
 * Tests that ValidationArtifact objects can be serialized to JSON and parsed back
 * to produce equivalent objects (round-trip property).
 */

import fc from 'fast-check'
import {
  serializeValidationArtifact,
  parseValidationArtifact,
  prettyPrintValidationArtifact,
  validateArtifactCompleteness,
} from '../validationArtifact'
import type { ValidationArtifact } from '@/types/agent'

// Arbitraries for generating test data
const hashArbitrary = fc.string({ minLength: 64, maxLength: 66 })
const signatureArbitrary = fc.string({ minLength: 130, maxLength: 132 })
const proofArbitrary = fc.string({ minLength: 100, maxLength: 200 })
const modelArbitrary = fc.stringMatching(/^v\d+\.\d+(\.\d+)?$/)
const timestampArbitrary = fc.integer({ min: 0, max: Math.floor(Date.now() / 1000) })

const validationArtifactArbitrary = fc.record({
  teeHash: hashArbitrary,
  teeVerified: fc.boolean(),
  eigenaiSignature: signatureArbitrary,
  eigenaiModel: modelArbitrary,
  redstoneProof: proofArbitrary,
  redstoneTimestamp: timestampArbitrary,
})

describe('ValidationArtifact Serialization', () => {
  test('Property 8: Round-trip serialization preserves ValidationArtifact equivalence', () => {
    fc.assert(
      fc.property(validationArtifactArbitrary, (original) => {
        // Serialize to JSON
        const json = serializeValidationArtifact(original)

        // Parse back from JSON
        const parsed = parseValidationArtifact(json)

        // Verify all fields are equivalent
        expect(parsed.teeHash).toBe(original.teeHash)
        expect(parsed.teeVerified).toBe(original.teeVerified)
        expect(parsed.eigenaiSignature).toBe(original.eigenaiSignature)
        expect(parsed.eigenaiModel).toBe(original.eigenaiModel)
        expect(parsed.redstoneProof).toBe(original.redstoneProof)
        expect(parsed.redstoneTimestamp).toBe(original.redstoneTimestamp)
      }),
      { numRuns: 100 }
    )
  })

  test('Property: Serialization produces valid JSON', () => {
    fc.assert(
      fc.property(validationArtifactArbitrary, (artifact) => {
        const json = serializeValidationArtifact(artifact)

        // Should be valid JSON
        expect(() => JSON.parse(json)).not.toThrow()

        // Should be a string
        expect(typeof json).toBe('string')
      }),
      { numRuns: 100 }
    )
  })

  test('Property: TEE hash is preserved correctly', () => {
    fc.assert(
      fc.property(hashArbitrary, (hash) => {
        const artifact: ValidationArtifact = {
          teeHash: hash,
          teeVerified: true,
          eigenaiSignature: '0x' + 'a'.repeat(130),
          eigenaiModel: 'v1.0',
          redstoneProof: '0x' + 'b'.repeat(100),
          redstoneTimestamp: 123456,
        }

        const json = serializeValidationArtifact(artifact)
        const parsed = parseValidationArtifact(json)

        expect(parsed.teeHash).toBe(hash)
      }),
      { numRuns: 100 }
    )
  })

  test('Property: TEE verified boolean is preserved', () => {
    fc.assert(
      fc.property(fc.boolean(), (verified) => {
        const artifact: ValidationArtifact = {
          teeHash: '0x' + 'a'.repeat(64),
          teeVerified: verified,
          eigenaiSignature: '0x' + 'b'.repeat(130),
          eigenaiModel: 'v1.0',
          redstoneProof: '0x' + 'c'.repeat(100),
          redstoneTimestamp: 123456,
        }

        const json = serializeValidationArtifact(artifact)
        const parsed = parseValidationArtifact(json)

        expect(parsed.teeVerified).toBe(verified)
        expect(typeof parsed.teeVerified).toBe('boolean')
      }),
      { numRuns: 100 }
    )
  })

  test('Property: EigenAI signature is preserved correctly', () => {
    fc.assert(
      fc.property(signatureArbitrary, (signature) => {
        const artifact: ValidationArtifact = {
          teeHash: '0x' + 'a'.repeat(64),
          teeVerified: true,
          eigenaiSignature: signature,
          eigenaiModel: 'v1.0',
          redstoneProof: '0x' + 'b'.repeat(100),
          redstoneTimestamp: 123456,
        }

        const json = serializeValidationArtifact(artifact)
        const parsed = parseValidationArtifact(json)

        expect(parsed.eigenaiSignature).toBe(signature)
      }),
      { numRuns: 100 }
    )
  })

  test('Property: EigenAI model is preserved correctly', () => {
    fc.assert(
      fc.property(modelArbitrary, (model) => {
        const artifact: ValidationArtifact = {
          teeHash: '0x' + 'a'.repeat(64),
          teeVerified: true,
          eigenaiSignature: '0x' + 'b'.repeat(130),
          eigenaiModel: model,
          redstoneProof: '0x' + 'c'.repeat(100),
          redstoneTimestamp: 123456,
        }

        const json = serializeValidationArtifact(artifact)
        const parsed = parseValidationArtifact(json)

        expect(parsed.eigenaiModel).toBe(model)
      }),
      { numRuns: 100 }
    )
  })

  test('Property: RedStone proof is preserved correctly', () => {
    fc.assert(
      fc.property(proofArbitrary, (proof) => {
        const artifact: ValidationArtifact = {
          teeHash: '0x' + 'a'.repeat(64),
          teeVerified: true,
          eigenaiSignature: '0x' + 'b'.repeat(130),
          eigenaiModel: 'v1.0',
          redstoneProof: proof,
          redstoneTimestamp: 123456,
        }

        const json = serializeValidationArtifact(artifact)
        const parsed = parseValidationArtifact(json)

        expect(parsed.redstoneProof).toBe(proof)
      }),
      { numRuns: 100 }
    )
  })

  test('Property: RedStone timestamp is preserved as non-negative number', () => {
    fc.assert(
      fc.property(timestampArbitrary, (timestamp) => {
        const artifact: ValidationArtifact = {
          teeHash: '0x' + 'a'.repeat(64),
          teeVerified: true,
          eigenaiSignature: '0x' + 'b'.repeat(130),
          eigenaiModel: 'v1.0',
          redstoneProof: '0x' + 'c'.repeat(100),
          redstoneTimestamp: timestamp,
        }

        const json = serializeValidationArtifact(artifact)
        const parsed = parseValidationArtifact(json)

        expect(parsed.redstoneTimestamp).toBe(timestamp)
        expect(parsed.redstoneTimestamp).toBeGreaterThanOrEqual(0)
        expect(typeof parsed.redstoneTimestamp).toBe('number')
      }),
      { numRuns: 100 }
    )
  })

  test('Serialization rejects invalid teeHash', () => {
    const invalidArtifact = {
      teeHash: '',
      teeVerified: true,
      eigenaiSignature: '0x' + 'a'.repeat(130),
      eigenaiModel: 'v1.0',
      redstoneProof: '0x' + 'b'.repeat(100),
      redstoneTimestamp: 123456,
    }

    expect(() => serializeValidationArtifact(invalidArtifact as ValidationArtifact)).toThrow(
      'Invalid ValidationArtifact: teeHash must be a non-empty string'
    )
  })

  test('Serialization rejects invalid teeVerified', () => {
    const invalidArtifact = {
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: 'not a boolean' as any,
      eigenaiSignature: '0x' + 'b'.repeat(130),
      eigenaiModel: 'v1.0',
      redstoneProof: '0x' + 'c'.repeat(100),
      redstoneTimestamp: 123456,
    }

    expect(() => serializeValidationArtifact(invalidArtifact as ValidationArtifact)).toThrow(
      'Invalid ValidationArtifact: teeVerified must be a boolean'
    )
  })

  test('Serialization rejects invalid eigenaiSignature', () => {
    const invalidArtifact = {
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: true,
      eigenaiSignature: '',
      eigenaiModel: 'v1.0',
      redstoneProof: '0x' + 'b'.repeat(100),
      redstoneTimestamp: 123456,
    }

    expect(() => serializeValidationArtifact(invalidArtifact as ValidationArtifact)).toThrow(
      'Invalid ValidationArtifact: eigenaiSignature must be a non-empty string'
    )
  })

  test('Serialization rejects invalid eigenaiModel', () => {
    const invalidArtifact = {
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: true,
      eigenaiSignature: '0x' + 'a'.repeat(130),
      eigenaiModel: '',
      redstoneProof: '0x' + 'b'.repeat(100),
      redstoneTimestamp: 123456,
    }

    expect(() => serializeValidationArtifact(invalidArtifact as ValidationArtifact)).toThrow(
      'Invalid ValidationArtifact: eigenaiModel must be a non-empty string'
    )
  })

  test('Serialization rejects invalid redstoneProof', () => {
    const invalidArtifact = {
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: true,
      eigenaiSignature: '0x' + 'a'.repeat(130),
      eigenaiModel: 'v1.0',
      redstoneProof: '',
      redstoneTimestamp: 123456,
    }

    expect(() => serializeValidationArtifact(invalidArtifact as ValidationArtifact)).toThrow(
      'Invalid ValidationArtifact: redstoneProof must be a non-empty string'
    )
  })

  test('Serialization rejects negative redstoneTimestamp', () => {
    const invalidArtifact = {
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: true,
      eigenaiSignature: '0x' + 'a'.repeat(130),
      eigenaiModel: 'v1.0',
      redstoneProof: '0x' + 'b'.repeat(100),
      redstoneTimestamp: -1,
    }

    expect(() => serializeValidationArtifact(invalidArtifact as ValidationArtifact)).toThrow(
      'Invalid ValidationArtifact: redstoneTimestamp must be a non-negative number'
    )
  })

  test('Parsing rejects invalid JSON', () => {
    expect(() => parseValidationArtifact('not valid json')).toThrow('Invalid JSON')
  })

  test('Parsing rejects missing required fields', () => {
    const incompleteJson = JSON.stringify({
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: true,
      // missing other fields
    })

    expect(() => parseValidationArtifact(incompleteJson)).toThrow()
  })

  test('Parsing rejects invalid teeVerified type', () => {
    const invalidJson = JSON.stringify({
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: 'not a boolean',
      eigenaiSignature: '0x' + 'b'.repeat(130),
      eigenaiModel: 'v1.0',
      redstoneProof: '0x' + 'c'.repeat(100),
      redstoneTimestamp: 123456,
    })

    expect(() => parseValidationArtifact(invalidJson)).toThrow(
      'Invalid ValidationArtifact: teeVerified must be a boolean'
    )
  })

  test('validateArtifactCompleteness returns true for valid artifact', () => {
    const artifact: ValidationArtifact = {
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: true,
      eigenaiSignature: '0x' + 'b'.repeat(130),
      eigenaiModel: 'v1.0',
      redstoneProof: '0x' + 'c'.repeat(100),
      redstoneTimestamp: 123456,
    }

    expect(validateArtifactCompleteness(artifact)).toBe(true)
  })

  test('validateArtifactCompleteness returns false for missing teeHash', () => {
    const artifact = {
      teeHash: '',
      teeVerified: true,
      eigenaiSignature: '0x' + 'b'.repeat(130),
      eigenaiModel: 'v1.0',
      redstoneProof: '0x' + 'c'.repeat(100),
      redstoneTimestamp: 123456,
    }

    expect(validateArtifactCompleteness(artifact as ValidationArtifact)).toBe(false)
  })

  test('validateArtifactCompleteness returns false for invalid teeVerified', () => {
    const artifact = {
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: 'not a boolean' as any,
      eigenaiSignature: '0x' + 'b'.repeat(130),
      eigenaiModel: 'v1.0',
      redstoneProof: '0x' + 'c'.repeat(100),
      redstoneTimestamp: 123456,
    }

    expect(validateArtifactCompleteness(artifact as ValidationArtifact)).toBe(false)
  })

  test('validateArtifactCompleteness returns false for negative timestamp', () => {
    const artifact: ValidationArtifact = {
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: true,
      eigenaiSignature: '0x' + 'b'.repeat(130),
      eigenaiModel: 'v1.0',
      redstoneProof: '0x' + 'c'.repeat(100),
      redstoneTimestamp: -1,
    }

    expect(validateArtifactCompleteness(artifact)).toBe(false)
  })

  test('prettyPrintValidationArtifact formats correctly', () => {
    const artifact: ValidationArtifact = {
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: true,
      eigenaiSignature: '0x' + 'b'.repeat(130),
      eigenaiModel: 'v1.0',
      redstoneProof: '0x' + 'c'.repeat(100),
      redstoneTimestamp: 123456,
    }

    const formatted = prettyPrintValidationArtifact(artifact)

    expect(formatted).toContain('ValidationArtifact {')
    expect(formatted).toContain('teeHash:')
    expect(formatted).toContain('teeVerified: true')
    expect(formatted).toContain('eigenaiSignature:')
    expect(formatted).toContain('eigenaiModel: v1.0')
    expect(formatted).toContain('redstoneProof:')
    expect(formatted).toContain('redstoneTimestamp: 123456')
    expect(formatted).toContain('}')
  })

  test('prettyPrintValidationArtifact truncates long hashes', () => {
    const artifact: ValidationArtifact = {
      teeHash: '0x' + 'a'.repeat(64),
      teeVerified: true,
      eigenaiSignature: '0x' + 'b'.repeat(130),
      eigenaiModel: 'v1.0',
      redstoneProof: '0x' + 'c'.repeat(100),
      redstoneTimestamp: 123456,
    }

    const formatted = prettyPrintValidationArtifact(artifact)

    // Should truncate to first 20 characters
    expect(formatted).toContain('0xaaaaaaaaaaaaaaaaaa')
    expect(formatted).not.toContain('0x' + 'a'.repeat(64))
  })
})
