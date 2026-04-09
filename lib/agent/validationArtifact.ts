/**
 * Validation Artifact Serialization and Parsing
 * 
 * This module provides utilities for serializing, parsing, and formatting
 * ValidationArtifact objects. It handles the conversion between ValidationArtifact
 * objects and JSON, with validation of required fields.
 */

import { ValidationArtifact } from '@/types/agent'

/**
 * Serializes a ValidationArtifact object to JSON string
 * 
 * @param artifact - The ValidationArtifact object to serialize
 * @returns JSON string representation of the ValidationArtifact
 * @throws Error if the artifact is invalid or cannot be serialized
 * 
 * @example
 * const artifact = {
 *   teeHash: '0x1234...',
 *   teeVerified: true,
 *   eigenaiSignature: '0x5678...',
 *   eigenaiModel: 'v1.0',
 *   redstoneProof: '0xabcd...',
 *   redstoneTimestamp: 1234567890
 * }
 * const json = serializeValidationArtifact(artifact)
 */
export function serializeValidationArtifact(artifact: ValidationArtifact): string {
  if (!artifact || typeof artifact !== 'object') {
    throw new Error('Invalid ValidationArtifact: must be an object')
  }

  if (!artifact.teeHash || typeof artifact.teeHash !== 'string') {
    throw new Error('Invalid ValidationArtifact: teeHash must be a non-empty string')
  }

  if (typeof artifact.teeVerified !== 'boolean') {
    throw new Error('Invalid ValidationArtifact: teeVerified must be a boolean')
  }

  if (!artifact.eigenaiSignature || typeof artifact.eigenaiSignature !== 'string') {
    throw new Error('Invalid ValidationArtifact: eigenaiSignature must be a non-empty string')
  }

  if (!artifact.eigenaiModel || typeof artifact.eigenaiModel !== 'string') {
    throw new Error('Invalid ValidationArtifact: eigenaiModel must be a non-empty string')
  }

  if (!artifact.redstoneProof || typeof artifact.redstoneProof !== 'string') {
    throw new Error('Invalid ValidationArtifact: redstoneProof must be a non-empty string')
  }

  if (typeof artifact.redstoneTimestamp !== 'number' || artifact.redstoneTimestamp < 0) {
    throw new Error('Invalid ValidationArtifact: redstoneTimestamp must be a non-negative number')
  }

  const serialized = {
    teeHash: artifact.teeHash,
    teeVerified: artifact.teeVerified,
    eigenaiSignature: artifact.eigenaiSignature,
    eigenaiModel: artifact.eigenaiModel,
    redstoneProof: artifact.redstoneProof,
    redstoneTimestamp: artifact.redstoneTimestamp,
  }

  return JSON.stringify(serialized)
}

/**
 * Parses a JSON string into a ValidationArtifact object
 * 
 * @param json - JSON string representation of a ValidationArtifact
 * @returns Parsed ValidationArtifact object
 * @throws Error if the JSON is invalid or doesn't match ValidationArtifact structure
 * 
 * @example
 * const json = '{"teeHash":"0x1234...","teeVerified":true,"eigenaiSignature":"0x5678...","eigenaiModel":"v1.0","redstoneProof":"0xabcd...","redstoneTimestamp":1234567890}'
 * const artifact = parseValidationArtifact(json)
 */
export function parseValidationArtifact(json: string): ValidationArtifact {
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
    throw new Error('Invalid ValidationArtifact: parsed JSON must be an object')
  }

  if (!parsed.teeHash || typeof parsed.teeHash !== 'string') {
    throw new Error('Invalid ValidationArtifact: teeHash must be a non-empty string')
  }

  if (typeof parsed.teeVerified !== 'boolean') {
    throw new Error('Invalid ValidationArtifact: teeVerified must be a boolean')
  }

  if (!parsed.eigenaiSignature || typeof parsed.eigenaiSignature !== 'string') {
    throw new Error('Invalid ValidationArtifact: eigenaiSignature must be a non-empty string')
  }

  if (!parsed.eigenaiModel || typeof parsed.eigenaiModel !== 'string') {
    throw new Error('Invalid ValidationArtifact: eigenaiModel must be a non-empty string')
  }

  if (!parsed.redstoneProof || typeof parsed.redstoneProof !== 'string') {
    throw new Error('Invalid ValidationArtifact: redstoneProof must be a non-empty string')
  }

  if (typeof parsed.redstoneTimestamp !== 'number' || parsed.redstoneTimestamp < 0) {
    throw new Error('Invalid ValidationArtifact: redstoneTimestamp must be a non-negative number')
  }

  return {
    teeHash: parsed.teeHash,
    teeVerified: parsed.teeVerified,
    eigenaiSignature: parsed.eigenaiSignature,
    eigenaiModel: parsed.eigenaiModel,
    redstoneProof: parsed.redstoneProof,
    redstoneTimestamp: parsed.redstoneTimestamp,
  }
}

/**
 * Formats a ValidationArtifact object for display
 * 
 * Converts the ValidationArtifact to a human-readable string representation.
 * 
 * @param artifact - The ValidationArtifact object to format
 * @returns Formatted string representation
 * 
 * @example
 * const artifact = {
 *   teeHash: '0x1234567890abcdef',
 *   teeVerified: true,
 *   eigenaiSignature: '0xfedcba0987654321',
 *   eigenaiModel: 'v1.0',
 *   redstoneProof: '0xabcdef1234567890',
 *   redstoneTimestamp: 1234567890
 * }
 * console.log(prettyPrintValidationArtifact(artifact))
 */
export function prettyPrintValidationArtifact(artifact: ValidationArtifact): string {
  const lines = [
    'ValidationArtifact {',
    `  teeHash: ${artifact.teeHash.substring(0, 20)}...`,
    `  teeVerified: ${artifact.teeVerified}`,
    `  eigenaiSignature: ${artifact.eigenaiSignature.substring(0, 20)}...`,
    `  eigenaiModel: ${artifact.eigenaiModel}`,
    `  redstoneProof: ${artifact.redstoneProof.substring(0, 20)}...`,
    `  redstoneTimestamp: ${artifact.redstoneTimestamp}`,
    '}',
  ]

  return lines.join('\n')
}

/**
 * Validates that a ValidationArtifact has all required fields
 * 
 * Checks that all required fields are present and non-empty.
 * 
 * @param artifact - The ValidationArtifact object to validate
 * @returns true if the artifact is complete, false otherwise
 * 
 * @example
 * const artifact = {
 *   teeHash: '0x1234...',
 *   teeVerified: true,
 *   eigenaiSignature: '0x5678...',
 *   eigenaiModel: 'v1.0',
 *   redstoneProof: '0xabcd...',
 *   redstoneTimestamp: 1234567890
 * }
 * if (validateArtifactCompleteness(artifact)) {
 *   console.log('Artifact is complete')
 * }
 */
export function validateArtifactCompleteness(artifact: ValidationArtifact): boolean {
  if (!artifact || typeof artifact !== 'object') {
    return false
  }

  if (!artifact.teeHash || typeof artifact.teeHash !== 'string') {
    return false
  }

  if (typeof artifact.teeVerified !== 'boolean') {
    return false
  }

  if (!artifact.eigenaiSignature || typeof artifact.eigenaiSignature !== 'string') {
    return false
  }

  if (!artifact.eigenaiModel || typeof artifact.eigenaiModel !== 'string') {
    return false
  }

  if (!artifact.redstoneProof || typeof artifact.redstoneProof !== 'string') {
    return false
  }

  if (typeof artifact.redstoneTimestamp !== 'number' || artifact.redstoneTimestamp < 0) {
    return false
  }

  return true
}
