/**
 * Tests for validation functions
 */

import { describe, it, expect } from 'vitest'
import { validateAddress, validateAmount, validateVaultMetadata, validateUserPosition, ValidationError } from '../validation'
import type { VaultMetadata, UserPosition } from '@/types'

describe('validateAddress', () => {
  it('validates correct Ethereum address', () => {
    expect(validateAddress('0x1234567890123456789012345678901234567890')).toBe(true)
  })

  it('validates lowercase hex address', () => {
    expect(validateAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')).toBe(true)
  })

  it('validates uppercase hex address', () => {
    expect(validateAddress('0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD')).toBe(true)
  })

  it('validates mixed case hex address', () => {
    expect(validateAddress('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12')).toBe(true)
  })

  it('rejects address without 0x prefix', () => {
    expect(validateAddress('1234567890123456789012345678901234567890')).toBe(false)
  })

  it('rejects address with wrong length', () => {
    expect(validateAddress('0x12345')).toBe(false)
    expect(validateAddress('0x12345678901234567890123456789012345678901234')).toBe(false)
  })

  it('rejects address with invalid characters', () => {
    expect(validateAddress('0x123456789012345678901234567890123456789g')).toBe(false)
    expect(validateAddress('0x123456789012345678901234567890123456789!')).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(validateAddress(123 as any)).toBe(false)
    expect(validateAddress(null as any)).toBe(false)
    expect(validateAddress(undefined as any)).toBe(false)
  })
})

describe('validateAmount', () => {
  it('validates positive amount within balance', () => {
    const result = validateAmount(100n, 1000n)
    expect(result.isValid).toBe(true)
    expect(result.error).toBeFalsy()
  })

  it('validates amount equal to balance', () => {
    const result = validateAmount(1000n, 1000n)
    expect(result.isValid).toBe(true)
  })

  it('rejects zero amount', () => {
    const result = validateAmount(0n, 1000n)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Amount must be greater than zero')
  })

  it('rejects negative amount', () => {
    const result = validateAmount(-100n, 1000n)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Amount must be greater than zero')
  })

  it('rejects amount exceeding balance', () => {
    const result = validateAmount(2000n, 1000n)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Amount exceeds available balance')
  })
})

describe('validateVaultMetadata', () => {
  const validVaultMetadata: VaultMetadata = {
    address: '0x1234567890123456789012345678901234567890',
    name: 'Test Vault',
    symbol: 'TVAULT',
    apy: 5.5,
    riskLevel: 'Low',
    tvl: 1000000n,
    strategy: 'Conservative yield strategy',
    underlyingAsset: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    minDeposit: 100n,
    maxDeposit: 10000n,
    depositFee: 0.5,
    withdrawalFee: 0.5,
    performanceFee: 10
  }

  it('validates correct vault metadata', () => {
    expect(() => validateVaultMetadata(validVaultMetadata)).not.toThrow()
  })

  it('rejects invalid vault address', () => {
    expect(() => validateVaultMetadata({ ...validVaultMetadata, address: 'invalid' }))
      .toThrow(ValidationError)
  })

  it('rejects empty vault name', () => {
    expect(() => validateVaultMetadata({ ...validVaultMetadata, name: '' }))
      .toThrow(ValidationError)
  })

  it('rejects negative APY', () => {
    expect(() => validateVaultMetadata({ ...validVaultMetadata, apy: -5 }))
      .toThrow(ValidationError)
  })

  it('rejects invalid risk level', () => {
    expect(() => validateVaultMetadata({ ...validVaultMetadata, riskLevel: 'Invalid' as any }))
      .toThrow(ValidationError)
  })

  it('rejects negative TVL', () => {
    expect(() => validateVaultMetadata({ ...validVaultMetadata, tvl: -1000n }))
      .toThrow(ValidationError)
  })

  it('rejects minDeposit > maxDeposit', () => {
    expect(() => validateVaultMetadata({ ...validVaultMetadata, minDeposit: 10000n, maxDeposit: 100n }))
      .toThrow(ValidationError)
  })

  it('rejects invalid fee values', () => {
    expect(() => validateVaultMetadata({ ...validVaultMetadata, depositFee: -1 }))
      .toThrow(ValidationError)
    expect(() => validateVaultMetadata({ ...validVaultMetadata, withdrawalFee: 101 }))
      .toThrow(ValidationError)
  })
})

describe('validateUserPosition', () => {
  const validUserPosition: UserPosition = {
    vaultAddress: '0x1234567890123456789012345678901234567890',
    userAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    shares: 1000n,
    depositedAmount: 10000n,
    currentValue: 11000n,
    yieldEarned: 1000n,
    depositedAt: 1640000000,
    lastUpdated: 1640100000
  }

  it('validates correct user position', () => {
    expect(() => validateUserPosition(validUserPosition)).not.toThrow()
  })

  it('rejects invalid vault address', () => {
    expect(() => validateUserPosition({ ...validUserPosition, vaultAddress: 'invalid' }))
      .toThrow(ValidationError)
  })

  it('rejects invalid user address', () => {
    expect(() => validateUserPosition({ ...validUserPosition, userAddress: 'invalid' }))
      .toThrow(ValidationError)
  })

  it('rejects negative shares', () => {
    expect(() => validateUserPosition({ ...validUserPosition, shares: -100n }))
      .toThrow(ValidationError)
  })

  it('rejects invalid timestamps', () => {
    expect(() => validateUserPosition({ ...validUserPosition, depositedAt: -1 }))
      .toThrow(ValidationError)
    expect(() => validateUserPosition({ ...validUserPosition, lastUpdated: validUserPosition.depositedAt - 1 }))
      .toThrow(ValidationError)
  })

  it('rejects incorrect yield calculation', () => {
    expect(() => validateUserPosition({ ...validUserPosition, yieldEarned: 500n }))
      .toThrow(ValidationError)
  })
})
