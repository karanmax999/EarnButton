import type { VaultMetadata, UserPosition, RiskLevel } from '@/types'

/**
 * Validation error class for better error handling
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validates an Ethereum address
 * 
 * Requirements 8.7: Validates that addresses are valid 42-character hexadecimal strings starting with "0x"
 * 
 * @param address - The address string to validate
 * @returns true if valid, false otherwise
 */
export function validateAddress(address: string): boolean {
  // Check if address is a string
  if (typeof address !== 'string') {
    return false
  }

  // Check if address starts with 0x and is 42 characters long
  if (!address.startsWith('0x') || address.length !== 42) {
    return false
  }

  // Check if the rest of the address is valid hexadecimal
  const hexPart = address.slice(2)
  const hexRegex = /^[0-9a-fA-F]+$/
  
  return hexRegex.test(hexPart)
}

/**
 * Validates a deposit or withdrawal amount
 * 
 * Requirements 8.1, 8.2, 8.3: Validates that amounts are positive numbers and don't exceed available balance
 * 
 * @param amount - The amount to validate (as bigint)
 * @param balance - The available balance (as bigint)
 * @returns Object with isValid flag and optional error message
 */
export function validateAmount(
  amount: bigint,
  balance: bigint
): { isValid: boolean; error?: string } {
  // Check if amount is positive
  if (amount <= 0n) {
    return {
      isValid: false,
      error: 'Amount must be greater than zero'
    }
  }

  // Check if amount doesn't exceed balance
  if (amount > balance) {
    return {
      isValid: false,
      error: 'Amount exceeds available balance'
    }
  }

  return { isValid: true }
}

/**
 * Validates vault metadata object
 * 
 * Ensures all required fields are present and valid according to design document rules
 * 
 * @param metadata - The vault metadata to validate
 * @throws ValidationError if validation fails
 */
export function validateVaultMetadata(metadata: Partial<VaultMetadata>): void {
  // Validate address
  if (!metadata.address || !validateAddress(metadata.address)) {
    throw new ValidationError('Invalid vault address')
  }

  // Validate name and symbol
  if (!metadata.name || typeof metadata.name !== 'string' || metadata.name.trim() === '') {
    throw new ValidationError('Vault name is required')
  }

  if (!metadata.symbol || typeof metadata.symbol !== 'string' || metadata.symbol.trim() === '') {
    throw new ValidationError('Vault symbol is required')
  }

  // Validate APY (must be non-negative)
  if (typeof metadata.apy !== 'number' || metadata.apy < 0) {
    throw new ValidationError('APY must be a non-negative number')
  }

  // Validate risk level
  const validRiskLevels: RiskLevel[] = ['Low', 'Medium', 'High']
  if (!metadata.riskLevel || !validRiskLevels.includes(metadata.riskLevel)) {
    throw new ValidationError('Risk level must be one of: Low, Medium, High')
  }

  // Validate TVL (must be non-negative bigint)
  if (typeof metadata.tvl !== 'bigint' || metadata.tvl < 0n) {
    throw new ValidationError('TVL must be a non-negative bigint')
  }

  // Validate strategy
  if (!metadata.strategy || typeof metadata.strategy !== 'string' || metadata.strategy.trim() === '') {
    throw new ValidationError('Strategy description is required')
  }

  // Validate underlying asset address
  if (!metadata.underlyingAsset || !validateAddress(metadata.underlyingAsset)) {
    throw new ValidationError('Invalid underlying asset address')
  }

  // Validate deposit limits (must be non-negative bigint)
  if (typeof metadata.minDeposit !== 'bigint' || metadata.minDeposit < 0n) {
    throw new ValidationError('Minimum deposit must be a non-negative bigint')
  }

  if (typeof metadata.maxDeposit !== 'bigint' || metadata.maxDeposit < 0n) {
    throw new ValidationError('Maximum deposit must be a non-negative bigint')
  }

  // Validate that minDeposit <= maxDeposit
  if (metadata.minDeposit > metadata.maxDeposit) {
    throw new ValidationError('Minimum deposit cannot exceed maximum deposit')
  }

  // Validate fees (must be between 0 and 100)
  if (typeof metadata.depositFee !== 'number' || metadata.depositFee < 0 || metadata.depositFee > 100) {
    throw new ValidationError('Deposit fee must be between 0 and 100')
  }

  if (typeof metadata.withdrawalFee !== 'number' || metadata.withdrawalFee < 0 || metadata.withdrawalFee > 100) {
    throw new ValidationError('Withdrawal fee must be between 0 and 100')
  }

  if (typeof metadata.performanceFee !== 'number' || metadata.performanceFee < 0 || metadata.performanceFee > 100) {
    throw new ValidationError('Performance fee must be between 0 and 100')
  }
}

/**
 * Validates user position object
 * 
 * Ensures all required fields are present and valid according to design document rules
 * 
 * @param position - The user position to validate
 * @throws ValidationError if validation fails
 */
export function validateUserPosition(position: Partial<UserPosition>): void {
  // Validate vault address
  if (!position.vaultAddress || !validateAddress(position.vaultAddress)) {
    throw new ValidationError('Invalid vault address')
  }

  // Validate user address
  if (!position.userAddress || !validateAddress(position.userAddress)) {
    throw new ValidationError('Invalid user address')
  }

  // Validate shares (must be non-negative bigint)
  if (typeof position.shares !== 'bigint' || position.shares < 0n) {
    throw new ValidationError('Shares must be a non-negative bigint')
  }

  // Validate deposited amount (must be non-negative bigint)
  if (typeof position.depositedAmount !== 'bigint' || position.depositedAmount < 0n) {
    throw new ValidationError('Deposited amount must be a non-negative bigint')
  }

  // Validate current value (must be non-negative bigint)
  if (typeof position.currentValue !== 'bigint' || position.currentValue < 0n) {
    throw new ValidationError('Current value must be a non-negative bigint')
  }

  // Validate yield earned (must be non-negative bigint)
  if (typeof position.yieldEarned !== 'bigint' || position.yieldEarned < 0n) {
    throw new ValidationError('Yield earned must be a non-negative bigint')
  }

  // Validate timestamps (must be valid Unix timestamps)
  if (typeof position.depositedAt !== 'number' || position.depositedAt <= 0) {
    throw new ValidationError('Deposited at must be a valid Unix timestamp')
  }

  if (typeof position.lastUpdated !== 'number' || position.lastUpdated <= 0) {
    throw new ValidationError('Last updated must be a valid Unix timestamp')
  }

  // Validate that lastUpdated >= depositedAt
  if (position.lastUpdated < position.depositedAt) {
    throw new ValidationError('Last updated timestamp cannot be before deposited timestamp')
  }

  // Validate that yieldEarned = currentValue - depositedAmount
  const calculatedYield = position.currentValue - position.depositedAmount
  if (position.yieldEarned !== calculatedYield) {
    throw new ValidationError('Yield earned must equal current value minus deposited amount')
  }
}
