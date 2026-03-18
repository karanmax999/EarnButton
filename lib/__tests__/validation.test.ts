/**
 * Manual tests for validation functions
 * These tests verify the core validation logic works correctly
 * 
 * To run: npx tsx lib/__tests__/validation.test.ts
 */

import { validateAddress, validateAmount, validateVaultMetadata, validateUserPosition, ValidationError } from '../validation'
import type { VaultMetadata, UserPosition } from '@/types'

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

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`)
  }
}

console.log('\n=== Testing validateAddress ===\n')

test('validates correct Ethereum address', () => {
  assert(validateAddress('0x1234567890123456789012345678901234567890'), 'Should accept valid address')
})

test('validates lowercase hex address', () => {
  assert(validateAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'), 'Should accept lowercase hex')
})

test('validates uppercase hex address', () => {
  assert(validateAddress('0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD'), 'Should accept uppercase hex')
})

test('validates mixed case hex address', () => {
  assert(validateAddress('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12'), 'Should accept mixed case hex')
})

test('rejects address without 0x prefix', () => {
  assert(!validateAddress('1234567890123456789012345678901234567890'), 'Should reject address without 0x')
})

test('rejects address with wrong length', () => {
  assert(!validateAddress('0x12345'), 'Should reject short address')
  assert(!validateAddress('0x12345678901234567890123456789012345678901234'), 'Should reject long address')
})

test('rejects address with invalid characters', () => {
  assert(!validateAddress('0x123456789012345678901234567890123456789g'), 'Should reject non-hex characters')
  assert(!validateAddress('0x123456789012345678901234567890123456789!'), 'Should reject special characters')
})

test('rejects non-string input', () => {
  assert(!validateAddress(123 as any), 'Should reject number')
  assert(!validateAddress(null as any), 'Should reject null')
  assert(!validateAddress(undefined as any), 'Should reject undefined')
})

console.log('\n=== Testing validateAmount ===\n')

test('validates positive amount within balance', () => {
  const result = validateAmount(100n, 1000n)
  assert(result.isValid, 'Should accept valid amount')
  assert(!result.error, 'Should not have error')
})

test('validates amount equal to balance', () => {
  const result = validateAmount(1000n, 1000n)
  assert(result.isValid, 'Should accept amount equal to balance')
})

test('rejects zero amount', () => {
  const result = validateAmount(0n, 1000n)
  assert(!result.isValid, 'Should reject zero amount')
  assert(result.error === 'Amount must be greater than zero', 'Should have correct error message')
})

test('rejects negative amount', () => {
  const result = validateAmount(-100n, 1000n)
  assert(!result.isValid, 'Should reject negative amount')
  assert(result.error === 'Amount must be greater than zero', 'Should have correct error message')
})

test('rejects amount exceeding balance', () => {
  const result = validateAmount(2000n, 1000n)
  assert(!result.isValid, 'Should reject amount exceeding balance')
  assert(result.error === 'Amount exceeds available balance', 'Should have correct error message')
})

console.log('\n=== Testing validateVaultMetadata ===\n')

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

test('validates correct vault metadata', () => {
  validateVaultMetadata(validVaultMetadata)
})

test('rejects invalid vault address', () => {
  try {
    validateVaultMetadata({ ...validVaultMetadata, address: 'invalid' })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
    assert((error as ValidationError).message === 'Invalid vault address', 'Should have correct error message')
  }
})

test('rejects empty vault name', () => {
  try {
    validateVaultMetadata({ ...validVaultMetadata, name: '' })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }
})

test('rejects negative APY', () => {
  try {
    validateVaultMetadata({ ...validVaultMetadata, apy: -5 })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }
})

test('rejects invalid risk level', () => {
  try {
    validateVaultMetadata({ ...validVaultMetadata, riskLevel: 'Invalid' as any })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }
})

test('rejects negative TVL', () => {
  try {
    validateVaultMetadata({ ...validVaultMetadata, tvl: -1000n })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }
})

test('rejects minDeposit > maxDeposit', () => {
  try {
    validateVaultMetadata({ ...validVaultMetadata, minDeposit: 10000n, maxDeposit: 100n })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }
})

test('rejects invalid fee values', () => {
  try {
    validateVaultMetadata({ ...validVaultMetadata, depositFee: -1 })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }

  try {
    validateVaultMetadata({ ...validVaultMetadata, withdrawalFee: 101 })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }
})

console.log('\n=== Testing validateUserPosition ===\n')

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

test('validates correct user position', () => {
  validateUserPosition(validUserPosition)
})

test('rejects invalid vault address', () => {
  try {
    validateUserPosition({ ...validUserPosition, vaultAddress: 'invalid' })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }
})

test('rejects invalid user address', () => {
  try {
    validateUserPosition({ ...validUserPosition, userAddress: 'invalid' })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }
})

test('rejects negative shares', () => {
  try {
    validateUserPosition({ ...validUserPosition, shares: -100n })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }
})

test('rejects invalid timestamps', () => {
  try {
    validateUserPosition({ ...validUserPosition, depositedAt: -1 })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }

  try {
    validateUserPosition({ ...validUserPosition, lastUpdated: validUserPosition.depositedAt - 1 })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
  }
})

test('rejects incorrect yield calculation', () => {
  try {
    validateUserPosition({ ...validUserPosition, yieldEarned: 500n })
    throw new Error('Should have thrown ValidationError')
  } catch (error) {
    assert(error instanceof ValidationError, 'Should throw ValidationError')
    assert((error as ValidationError).message.includes('Yield earned must equal'), 'Should have correct error message')
  }
})

// Print summary
console.log('\n=== Test Summary ===\n')
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log(`Total: ${passed + failed}\n`)

if (failed > 0) {
  process.exit(1)
}
