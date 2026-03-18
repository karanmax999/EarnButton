# useBalance Hook Implementation

## Task 5.1 - Implementation Complete ✅

### Overview

Implemented the `useBalance` custom React hook for fetching USDC and vault share balances with proper formatting, loading states, error handling, and automatic refresh capabilities.

### Requirements Validated

- ✅ **3.2**: Display user's USDC balance
- ✅ **4.2**: Fetch user's vault share balance
- ✅ **5.1**: Fetch token balances for portfolio tracking
- ✅ **5.2**: Display formatted balance output

### Implementation Details

#### Files Created

1. **lib/hooks/useBalance.ts** - Main hook implementation
2. **lib/hooks/index.ts** - Hooks module exports
3. **lib/hooks/__tests__/useBalance.test.ts** - Comprehensive unit tests
4. **lib/hooks/__tests__/useBalance.manual.test.tsx** - Manual integration test examples
5. **lib/hooks/useBalance.README.md** - Complete documentation

#### Files Modified

1. **lib/index.ts** - Added hooks exports

### Key Features

#### 1. Unified Interface
- Single hook for both USDC and vault share balances
- Token type parameter: `'USDC' | 'vault'`
- Automatic token address resolution

#### 2. Balance Fetching
- Uses wagmi's `useReadContract` with ERC-20 ABI
- Fetches balance using `balanceOf` function
- Supports both connected wallet and specific addresses

#### 3. Formatting
- Formats balance with 6 decimals (USDC standard)
- Uses viem's `formatUnits` for proper decimal handling
- Returns both raw (bigint) and formatted (string) values

#### 4. Loading & Error States
- `isLoading`: True while fetching balance
- `error`: Contains error message if fetch fails
- Proper error handling with user-friendly messages

#### 5. Refetch Functionality
- Manual refetch via `refetch()` function
- Allows users to refresh balance on demand

#### 6. Caching & Auto-Refresh
- **staleTime**: 30 seconds (data considered fresh)
- **refetchInterval**: 30 seconds (automatic refresh)
- Meets performance requirement 10.4

#### 7. Smart Query Enablement
- Disables query when no address available
- Disables query when vault token but no vault address
- Prevents unnecessary RPC calls

### API

```typescript
// Parameters
interface UseBalanceParams {
  address?: `0x${string}`
  token: 'USDC' | 'vault'
  vaultAddress?: `0x${string}`
}

// Return value
interface UseBalanceReturn {
  balance: bigint
  formatted: string
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}
```

### Usage Examples

```tsx
// USDC balance for connected wallet
const { balance, formatted, isLoading } = useBalance({
  token: 'USDC'
})

// USDC balance for specific address
const { balance, formatted } = useBalance({
  address: '0x1234...',
  token: 'USDC'
})

// Vault share balance
const { balance, formatted } = useBalance({
  token: 'vault',
  vaultAddress: '0xabcd...'
})

// With refetch
const { formatted, refetch } = useBalance({
  token: 'USDC'
})
```

### Testing

#### Unit Tests Coverage
- ✅ USDC balance fetching
- ✅ Vault share balance fetching
- ✅ Balance formatting (various values)
- ✅ Loading states
- ✅ Error handling
- ✅ Refetch functionality
- ✅ Query configuration
- ✅ Edge cases (zero, large values)
- ✅ Address fallback logic
- ✅ Query enablement logic

#### Test File
- **lib/hooks/__tests__/useBalance.test.ts** - 15+ test cases
- Uses vitest with React Testing Library
- Mocks wagmi hooks for isolated testing

### Integration Points

#### Dependencies
- `wagmi` - useAccount, useReadContract
- `viem` - erc20Abi, formatUnits
- `@/lib/constants` - CONTRACTS.USDC

#### Used By (Future)
- EarnModal component (deposit flow)
- Dashboard component (portfolio display)
- Withdraw modal (withdrawal flow)

### Performance Considerations

1. **Caching**: 30-second stale time reduces RPC calls
2. **Auto-refresh**: Keeps balance up-to-date without manual intervention
3. **Query enablement**: Prevents unnecessary calls when data unavailable
4. **Efficient re-renders**: Only updates when balance changes

### Security Considerations

1. **Address validation**: Uses typed addresses (`0x${string}`)
2. **Safe defaults**: Returns 0n when data unavailable
3. **Error handling**: Graceful degradation on failures
4. **No infinite approvals**: Hook only reads, doesn't write

### Next Steps

The useBalance hook is complete and ready for integration. Next tasks:

1. **Task 5.2**: Implement useYOVaults hook
2. **Task 5.3**: Implement useDeposit hook
3. **Task 5.4**: Implement useWithdraw hook

These hooks will build on the patterns established in useBalance.

### Notes

- Hook follows wagmi v2 patterns
- TypeScript strict mode compliant
- No diagnostics or errors
- Ready for production use
- Comprehensive documentation provided

---

**Implementation Date**: 2025
**Task**: 5.1 Implement useBalance hook
**Status**: ✅ Complete
