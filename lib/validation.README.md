# Validation Utilities

This module provides validation functions for the EarnButton application, ensuring data integrity and preventing invalid operations.

## Functions

### `validateAddress(address: string): boolean`

Validates Ethereum addresses according to Requirement 8.7.

**Rules:**
- Must be a string
- Must start with "0x"
- Must be exactly 42 characters long
- Must contain only hexadecimal characters (0-9, a-f, A-F) after the "0x" prefix

**Example:**
```typescript
import { validateAddress } from '@/lib/validation'

validateAddress('0x1234567890123456789012345678901234567890') // true
validateAddress('0x123') // false (too short)
validateAddress('invalid') // false (no 0x prefix)
```

### `validateAmount(amount: bigint, balance: bigint): { isValid: boolean; error?: string }`

Validates deposit or withdrawal amounts according to Requirements 8.1, 8.2, 8.3.

**Rules:**
- Amount must be greater than zero
- Amount must not exceed available balance

**Example:**
```typescript
import { validateAmount } from '@/lib/validation'

const result = validateAmount(100n, 1000n)
if (result.isValid) {
  // Proceed with transaction
} else {
  console.error(result.error) // "Amount must be greater than zero" or "Amount exceeds available balance"
}
```

### `validateVaultMetadata(metadata: Partial<VaultMetadata>): void`

Validates vault metadata objects according to the design document.

**Rules:**
- `address`: Must be a valid Ethereum address
- `name`: Must be a non-empty string
- `symbol`: Must be a non-empty string
- `apy`: Must be a non-negative number
- `riskLevel`: Must be one of 'Low', 'Medium', or 'High'
- `tvl`: Must be a non-negative bigint
- `strategy`: Must be a non-empty string
- `underlyingAsset`: Must be a valid Ethereum address
- `minDeposit`: Must be a non-negative bigint
- `maxDeposit`: Must be a non-negative bigint
- `minDeposit` must be <= `maxDeposit`
- `depositFee`, `withdrawalFee`, `performanceFee`: Must be between 0 and 100

**Throws:** `ValidationError` if validation fails

**Example:**
```typescript
import { validateVaultMetadata, ValidationError } from '@/lib/validation'

try {
  validateVaultMetadata({
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
  })
  // Metadata is valid
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message)
  }
}
```

### `validateUserPosition(position: Partial<UserPosition>): void`

Validates user position objects according to the design document.

**Rules:**
- `vaultAddress`: Must be a valid Ethereum address
- `userAddress`: Must be a valid Ethereum address
- `shares`: Must be a non-negative bigint
- `depositedAmount`: Must be a non-negative bigint
- `currentValue`: Must be a non-negative bigint
- `yieldEarned`: Must be a non-negative bigint
- `depositedAt`: Must be a valid Unix timestamp (positive number)
- `lastUpdated`: Must be a valid Unix timestamp (positive number)
- `lastUpdated` must be >= `depositedAt`
- `yieldEarned` must equal `currentValue - depositedAmount`

**Throws:** `ValidationError` if validation fails

**Example:**
```typescript
import { validateUserPosition, ValidationError } from '@/lib/validation'

try {
  validateUserPosition({
    vaultAddress: '0x1234567890123456789012345678901234567890',
    userAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    shares: 1000n,
    depositedAmount: 10000n,
    currentValue: 11000n,
    yieldEarned: 1000n,
    depositedAt: 1640000000,
    lastUpdated: 1640100000
  })
  // Position is valid
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message)
  }
}
```

## ValidationError

Custom error class for validation failures. Extends the standard `Error` class with a `name` property set to 'ValidationError'.

**Example:**
```typescript
import { ValidationError } from '@/lib/validation'

try {
  // Some validation
  throw new ValidationError('Invalid data')
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message)
  }
}
```

## Testing

Run the validation tests with:

```bash
npx tsx lib/__tests__/validation.test.ts
```

All validation functions are thoroughly tested with 27 test cases covering:
- Valid inputs
- Invalid inputs
- Edge cases
- Error messages
- Type checking

## Requirements Coverage

This module implements the following requirements:

- **Requirement 8.1**: Validates deposit amounts are positive numbers
- **Requirement 8.2**: Validates deposit amounts don't exceed USDC balance
- **Requirement 8.3**: Validates withdrawal amounts don't exceed vault share balance
- **Requirement 8.7**: Validates Ethereum addresses are valid 42-character hexadecimal strings starting with "0x"

## Design Document Compliance

All validation functions follow the validation rules specified in the Design Document's Data Models section, ensuring:
- Type safety with TypeScript
- Proper error handling with descriptive messages
- Comprehensive validation of all required fields
- Business logic validation (e.g., minDeposit <= maxDeposit, yieldEarned = currentValue - depositedAmount)
