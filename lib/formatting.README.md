# Formatting Utilities

This module provides formatting functions for displaying financial data, addresses, and timestamps in user-friendly formats.

## Functions

### `formatUSDC(amount: bigint): string`

Formats USDC amounts with 2 decimal places and comma separators.

**Requirements:** 9.1

**Parameters:**
- `amount` - The USDC amount as bigint (6 decimals)

**Returns:** Formatted string (e.g., "1,234.56")

**Examples:**
```typescript
formatUSDC(1_000_000n)        // "1.00"
formatUSDC(1_234_567_890n)    // "1,234.57"
formatUSDC(10_000_000_000n)   // "10,000.00"
```

---

### `formatAPY(apy: number): string`

Formats APY values with 2 decimal places and % symbol.

**Requirements:** 9.2

**Parameters:**
- `apy` - The APY value as a number (e.g., 5.5 for 5.5%)

**Returns:** Formatted string (e.g., "5.50%")

**Examples:**
```typescript
formatAPY(5)       // "5.00%"
formatAPY(5.5)     // "5.50%"
formatAPY(12.34)   // "12.34%"
```

---

### `formatAddress(address: string): string`

Formats Ethereum addresses by truncating to first 6 and last 4 characters.

**Requirements:** 9.3

**Parameters:**
- `address` - The Ethereum address (42 characters starting with 0x)

**Returns:** Truncated string (e.g., "0x1234...5678")

**Examples:**
```typescript
formatAddress('0x1234567890123456789012345678901234567890')  // "0x1234...7890"
formatAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')  // "0xabcd...abcd"
```

---

### `formatLargeNumber(value: bigint | number): string`

Formats large numbers with K/M suffixes.

**Requirements:** 9.4

**Parameters:**
- `value` - The number to format (can be bigint or number)

**Returns:** Formatted string (e.g., "1.5K", "2.3M")

**Examples:**
```typescript
formatLargeNumber(999)          // "999"
formatLargeNumber(1_500)        // "1.5K"
formatLargeNumber(2_500_000)    // "2.5M"
formatLargeNumber(1_000_000n)   // "1.0M"
```

---

### `formatTimestamp(timestamp: number): string`

Formats Unix timestamps to human-readable dates.

**Requirements:** 9.5

**Parameters:**
- `timestamp` - Unix timestamp in seconds

**Returns:** Formatted date string (e.g., "Jan 15, 2024")

**Examples:**
```typescript
formatTimestamp(1705276800)  // "Jan 15, 2024"
formatTimestamp(1706745600)  // "Feb 1, 2024"
```

---

### `formatTxHash(txHash: string): string`

Formats transaction hashes by truncating to first 10 and last 8 characters.

**Requirements:** 9.6

**Parameters:**
- `txHash` - The transaction hash (66 characters starting with 0x)

**Returns:** Truncated string (e.g., "0x12345678...abcdefgh")

**Examples:**
```typescript
formatTxHash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
// "0x12345678...90abcdef"
```

## Testing

Run the test suite:

```bash
npx tsx lib/__tests__/formatting.test.ts
```

All formatting functions have comprehensive test coverage including:
- Standard cases
- Edge cases (zero, empty strings, boundaries)
- Different input formats (lowercase, uppercase, mixed case)
- Proper rounding and precision

## Usage in Components

These utilities should be used throughout the application to ensure consistent formatting:

```typescript
import { formatUSDC, formatAPY, formatAddress } from '@/lib/formatting'

// In a component
const balance = 1_234_567_890n
const apy = 5.5
const userAddress = '0x1234567890123456789012345678901234567890'

return (
  <div>
    <p>Balance: ${formatUSDC(balance)}</p>
    <p>APY: {formatAPY(apy)}</p>
    <p>Address: {formatAddress(userAddress)}</p>
  </div>
)
```
