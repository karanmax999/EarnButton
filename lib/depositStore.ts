/**
 * Persists deposited amounts in localStorage so we can calculate yield earned.
 * Key format: `deposit:{walletAddress}:{vaultAddress}`
 * Value: bigint as decimal string (raw token units, same decimals as the asset)
 */

const PREFIX = 'deposit'

function storageKey(walletAddress: string, vaultAddress: string) {
  return `${PREFIX}:${walletAddress.toLowerCase()}:${vaultAddress.toLowerCase()}`
}

/** Record a deposit. Adds to any existing recorded amount. */
export function recordDeposit(walletAddress: string, vaultAddress: string, amount: bigint) {
  if (typeof window === 'undefined') return
  try {
    const k = storageKey(walletAddress, vaultAddress)
    const existing = BigInt(localStorage.getItem(k) ?? '0')
    localStorage.setItem(k, String(existing + amount))
  } catch {
    // localStorage unavailable (SSR, private mode, etc.) — silently ignore
  }
}

/** Get the total recorded deposited amount for a vault. Returns 0n if not found. */
export function getRecordedDeposit(walletAddress: string, vaultAddress: string): bigint {
  if (typeof window === 'undefined') return 0n
  try {
    const k = storageKey(walletAddress, vaultAddress)
    const val = localStorage.getItem(k)
    return val ? BigInt(val) : 0n
  } catch {
    return 0n
  }
}

/** Clear the recorded deposit (e.g. after a full withdrawal). */
export function clearRecordedDeposit(walletAddress: string, vaultAddress: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(storageKey(walletAddress, vaultAddress))
  } catch {
    // ignore
  }
}
