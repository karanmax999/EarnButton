# useBalance Hook

Custom React hook for fetching and formatting token balances (USDC or vault shares) using wagmi.

## Overview

The `useBalance` hook provides a unified interface for fetching ERC-20 token balances with proper formatting, loading states, error handling, and automatic refresh capabilities. It supports both USDC tokens and vault share tokens.

## Requirements Validated

- **3.2**: Display user's USDC balance
- **4.2**: Fetch user's vault share balance  
- **5.1**: Fetch token balances for portfolio tracking
- **5.2**: Display formatted balance output

## Features

- ✅ Fetches USDC balance using wagmi's `useReadContract`
- ✅ Fetches vault share balance when vault address provided
- ✅ Single interface for both token types
- ✅ Formatted balance output with proper decimals (6 decimals)
- ✅ Loading and error states
- ✅ Refetch functionality for manual updates
- ✅ 30-second cache (staleTime) as per requirements
- ✅ Auto-refresh every 30 seconds (refetchInterval)
- ✅ Falls back to connected wallet address when no address provided
- ✅ Disables query when required parameters missing

## Usage

### Basic USDC Balance

```tsx
import { useBalance } from '@/lib/hooks'

function MyComponent() {
  const { balance, formatted, isLoading, error } = useBalance({
    token: 'USDC'
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <p>Balance: {formatted} USDC</p>
      <p>Raw: {balance.toString()}</p>
    </div>
  )
}
```

### USDC Balance for Specific Address

```tsx
const { balance, formatted } = useBalance({
  address: '0x1234567890123456789012345678901234567890',
  token: 'USDC'
})
```

### Vault Share Balance

```tsx
const { balance, formatted } = useBalance({
  token: 'vault',
  vaultAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
})
```

### With Refetch

```tsx
function BalanceWithRefresh() {
  const { formatted, isLoading, refetch } = useBalance({
    token: 'USDC'
  })

  return (
    <div>
      <p>Balance: {formatted} USDC</p>
      <button onClick={refetch} disabled={isLoading}>
        Refresh
      </button>
    </div>
  )
}
```

## API

### Parameters

```typescript
interface UseBalanceParams {
  /** Ethereum address to fetch balance for (optional, uses connected wallet if not provided) */
  address?: `0x${string}`
  
  /** Token type to fetch balance for */
  token: 'USDC' | 'vault'
  
  /** Vault address (required when token is 'vault') */
  vaultAddress?: `0x${string}`
}
```

### Return Value

```typescript
interface UseBalanceReturn {
  /** Raw balance as bigint */
  balance: bigint
  
  /** Formatted balance string with proper decimals */
  formatted: string
  
  /** Loading state */
  isLoading: boolean
  
  /** Error state */
  error: Error | null
  
  /** Function to manually refetch balance */
  refetch: () => Promise<void>
}
```

## Implementation Details

### Token Address Resolution

- **USDC**: Uses `CONTRACTS.USDC` constant (Base network USDC address)
- **Vault**: Uses provided `vaultAddress` parameter

### Decimals

Both USDC and vault share tokens use 6 decimals, which is the standard for USDC on Base network.

### Caching Strategy

As per requirements (10.4):
- **staleTime**: 30 seconds - data is considered fresh for 30 seconds
- **refetchInterval**: 30 seconds - automatically refetches every 30 seconds

### Query Enablement

The hook automatically disables the query when:
- No address is provided and wallet is not connected
- Token is 'vault' but no vaultAddress is provided

This prevents unnecessary RPC calls and errors.

### Error Handling

Contract read errors are converted to standard Error objects with descriptive messages. The error state can be used to display user-friendly error messages and retry options.

## Examples

### Dashboard Balance Display

```tsx
function DashboardBalance() {
  const { formatted, isLoading, error, refetch } = useBalance({
    token: 'USDC'
  })

  return (
    <div className="balance-card">
      <h3>USDC Balance</h3>
      {isLoading ? (
        <div className="skeleton" />
      ) : error ? (
        <div className="error">
          <p>{error.message}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      ) : (
        <p className="balance">{formatted} USDC</p>
      )}
    </div>
  )
}
```

### Multiple Balances

```tsx
function PortfolioBalances({ vaultAddresses }: { vaultAddresses: string[] }) {
  const usdcBalance = useBalance({ token: 'USDC' })
  
  const vaultBalances = vaultAddresses.map(vaultAddress =>
    useBalance({
      token: 'vault',
      vaultAddress: vaultAddress as `0x${string}`
    })
  )

  return (
    <div>
      <div>USDC: {usdcBalance.formatted}</div>
      {vaultBalances.map((balance, i) => (
        <div key={i}>
          Vault {i + 1}: {balance.formatted} shares
        </div>
      ))}
    </div>
  )
}
```

### Conditional Rendering

```tsx
function ConditionalBalance({ showVault }: { showVault: boolean }) {
  const balance = useBalance({
    token: showVault ? 'vault' : 'USDC',
    vaultAddress: showVault ? '0xabc...' : undefined
  })

  return <div>{balance.formatted}</div>
}
```

## Testing

The hook includes comprehensive unit tests covering:
- USDC balance fetching
- Vault share balance fetching
- Balance formatting with various values
- Loading states
- Error handling
- Refetch functionality
- Query configuration
- Edge cases (zero balance, large values)

Run tests with:
```bash
npm test
```

## Dependencies

- `wagmi` - For blockchain interactions
- `viem` - For Ethereum utilities (formatUnits, erc20Abi)
- `@/lib/constants` - For contract addresses

## Related

- `useDeposit` - Hook for depositing USDC into vaults
- `useWithdraw` - Hook for withdrawing from vaults
- `useYOVaults` - Hook for fetching vault metadata
