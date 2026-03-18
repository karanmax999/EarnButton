# useYOVaults Hook

Custom React hook for fetching vault metadata from YO Protocol with SWR caching.

## Overview

The `useYOVaults` hook provides a simple interface to fetch and manage vault data from YO Protocol. It integrates with the YO Protocol SDK and adds an additional SWR caching layer for optimal performance, with automatic revalidation every 5 minutes as per requirements.

## Features

- ✅ Fetches vault metadata from YO Protocol SDK
- ✅ SWR integration with 5-minute stale time
- ✅ Automatic data validation using `validateVaultMetadata`
- ✅ Type-safe with TypeScript
- ✅ Loading and error states
- ✅ Manual refetch functionality
- ✅ Transforms YO Protocol data to our VaultMetadata interface

## Requirements Validated

- **2.1**: Fetches and displays available vault metadata from YO Protocol
- **2.2**: Shows vault name, APY, risk level, and TVL
- **2.3**: Uses color coding to distinguish between risk levels
- **2.4**: Displays loading indicators during data fetch
- **2.5**: Displays error messages and provides retry option on failure

## Usage

### Basic Usage

```tsx
import { useYOVaults } from '@/lib/hooks'

function VaultList() {
  const { vaults, isLoading, error, refetch } = useYOVaults()

  if (isLoading) {
    return <div>Loading vaults...</div>
  }

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    )
  }

  return (
    <div>
      {vaults.map(vault => (
        <div key={vault.address}>
          <h3>{vault.name}</h3>
          <p>APY: {vault.apy}%</p>
          <p>Risk: {vault.riskLevel}</p>
          <p>TVL: ${vault.tvl.toString()}</p>
        </div>
      ))}
    </div>
  )
}
```

### With Formatting Utilities

```tsx
import { useYOVaults } from '@/lib/hooks'
import { formatUSDC, formatAPY } from '@/lib/formatting'

function VaultCards() {
  const { vaults, isLoading, error } = useYOVaults()

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorState error={error} />

  return (
    <div className="grid grid-cols-3 gap-4">
      {vaults.map(vault => (
        <div key={vault.address} className="vault-card">
          <h3>{vault.name}</h3>
          <div className="metrics">
            <span>APY: {formatAPY(vault.apy)}</span>
            <span>TVL: ${formatUSDC(vault.tvl)}</span>
            <span className={getRiskColor(vault.riskLevel)}>
              {vault.riskLevel} Risk
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### With Manual Refetch

```tsx
import { useYOVaults } from '@/lib/hooks'

function VaultDashboard() {
  const { vaults, isLoading, refetch } = useYOVaults()

  const handleRefresh = async () => {
    await refetch()
    console.log('Vaults refreshed!')
  }

  return (
    <div>
      <button onClick={handleRefresh} disabled={isLoading}>
        Refresh Vaults
      </button>
      <VaultList vaults={vaults} />
    </div>
  )
}
```

## API Reference

### Return Type

```typescript
interface UseYOVaultsReturn {
  /** Array of validated vault metadata */
  vaults: VaultMetadata[]
  
  /** Loading state - true while fetching data */
  isLoading: boolean
  
  /** Error state - contains error if fetch fails */
  error: Error | null
  
  /** Function to manually refetch vault data */
  refetch: () => Promise<void>
}
```

### VaultMetadata Type

```typescript
interface VaultMetadata {
  address: string              // Ethereum address of vault contract
  name: string                 // Human-readable vault name
  symbol: string               // Token symbol (e.g., "yoUSD")
  apy: number                  // Annual Percentage Yield (as percentage)
  riskLevel: 'Low' | 'Medium' | 'High'  // Risk classification
  tvl: bigint                  // Total Value Locked
  strategy: string             // Investment strategy description
  underlyingAsset: string      // Address of underlying asset (e.g., USDC)
  minDeposit: bigint          // Minimum deposit amount
  maxDeposit: bigint          // Maximum deposit amount
  depositFee: number          // Deposit fee percentage (0-100)
  withdrawalFee: number       // Withdrawal fee percentage (0-100)
  performanceFee: number      // Performance fee percentage (0-100)
}
```

## Data Flow

1. **YO Protocol SDK**: Fetches raw vault data from YO Protocol API
2. **Transformation**: Converts YO Protocol format to our VaultMetadata interface
3. **Validation**: Validates each vault using `validateVaultMetadata`
4. **SWR Caching**: Caches validated data with 5-minute stale time
5. **Return**: Provides typed, validated vault data to components

## Caching Behavior

- **Stale Time**: 5 minutes (300,000ms)
- **Revalidate on Focus**: Disabled
- **Revalidate on Reconnect**: Enabled
- **Keep Previous Data**: Enabled (shows old data while revalidating)

## Error Handling

The hook handles errors gracefully:

1. **Validation Errors**: Individual vault validation failures are logged but don't fail the entire fetch
2. **SDK Errors**: Errors from YO Protocol SDK are captured and returned
3. **SWR Errors**: Errors during data transformation are captured and returned
4. **Combined Errors**: Both SDK and SWR errors are combined into a single error state

## Performance Considerations

- Uses SWR for efficient caching and deduplication
- Validates data only once per fetch
- Keeps previous data while revalidating for better UX
- Automatic refresh every 5 minutes reduces unnecessary API calls

## Testing

See `lib/hooks/__tests__/useYOVaults.test.ts` for unit tests.

## Related

- `useBalance` - Fetch token and vault share balances
- `useDeposit` - Handle vault deposits
- `useWithdraw` - Handle vault withdrawals
- `validateVaultMetadata` - Validation function used internally
