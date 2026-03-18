import type { VaultPosition } from '@/types'

/**
 * Calculates the total amount deposited across all vault positions.
 *
 * Requirements 5.1: Total deposited amount equals the sum of deposited amounts
 * across all individual positions.
 *
 * @param positions - Array of vault positions
 * @returns Total deposited amount as bigint
 */
export function calculateTotalDeposited(positions: VaultPosition[]): bigint {
  return positions.reduce((sum, pos) => sum + pos.depositedAmount, 0n)
}

/**
 * Calculates the total current value across all vault positions.
 *
 * Requirements 5.2: Total current value equals the sum of current values
 * across all individual positions.
 *
 * @param positions - Array of vault positions
 * @returns Total current value as bigint
 */
export function calculateTotalValue(positions: VaultPosition[]): bigint {
  return positions.reduce((sum, pos) => sum + pos.currentValue, 0n)
}

/**
 * Calculates the total yield earned across all vault positions.
 *
 * Requirements 5.3: Yield earned equals total current value minus total deposited amount.
 *
 * @param positions - Array of vault positions
 * @returns Yield earned as bigint (can be negative if vault has losses)
 */
export function calculateYieldEarned(positions: VaultPosition[]): bigint {
  return calculateTotalValue(positions) - calculateTotalDeposited(positions)
}

/**
 * Calculates the weighted average APY across all vault positions,
 * weighted by each position's current value.
 *
 * Requirements 5.4: Weighted average APY is between the minimum and maximum
 * individual vault APYs.
 *
 * @param positions - Array of vault positions
 * @returns Weighted average APY as a number, or 0 if no positions
 */
export function calculateWeightedAPY(positions: VaultPosition[]): number {
  if (positions.length === 0) return 0

  const totalValue = calculateTotalValue(positions)
  if (totalValue === 0n) {
    // Equal weighting when all positions have zero value
    const sum = positions.reduce((acc, pos) => acc + pos.apy, 0)
    return sum / positions.length
  }

  const weightedSum = positions.reduce((acc, pos) => {
    const weight = Number(pos.currentValue) / Number(totalValue)
    return acc + pos.apy * weight
  }, 0)

  return weightedSum
}
