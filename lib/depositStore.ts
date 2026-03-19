/**
 * Persists deposited amounts in localStorage so we can calculate yield earned.
 * Key format: `deposit:{walletAddress}:{vaultAddress}`
 * Value: bigint as decimal string (raw token units, same decimals as the asset)
 *
 * Also maintains an activity log for the "Recent Activity" dashboard section.
 * Key format: `activity:{walletAddress}`
 * Value: JSON array of ActivityRecord[]
 */

const PREFIX = 'deposit'
const ACTIVITY_PREFIX = 'activity'
const MAX_ACTIVITY = 50

export interface ActivityRecord {
  type: 'deposit' | 'withdraw'
  vaultName: string
  vaultAddress: string
  amount: string        // human-readable, e.g. "100.00"
  txHash: string
  basescanUrl: string
  timestamp: number
}

function storageKey(walletAddress: string, vaultAddress: string) {
  return `${PREFIX}:${walletAddress.toLowerCase()}:${vaultAddress.toLowerCase()}`
}

function activityKey(walletAddress: string) {
  return `${ACTIVITY_PREFIX}:${walletAddress.toLowerCase()}`
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

/** Append an activity record (deposit or withdraw) to the user's activity log. */
export function addActivityRecord(walletAddress: string, record: ActivityRecord) {
  if (typeof window === 'undefined') return
  try {
    const k = activityKey(walletAddress)
    const existing: ActivityRecord[] = JSON.parse(localStorage.getItem(k) ?? '[]')
    const updated = [record, ...existing].slice(0, MAX_ACTIVITY)
    localStorage.setItem(k, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

/** Get the last N activity records for a wallet. */
export function getActivityRecords(walletAddress: string, limit = 5): ActivityRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const k = activityKey(walletAddress)
    const records: ActivityRecord[] = JSON.parse(localStorage.getItem(k) ?? '[]')
    return records.slice(0, limit)
  } catch {
    return []
  }
}