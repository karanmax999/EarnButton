# useWithdraw Hook

Custom React hook for withdrawing USDC from YO Protocol vaults by redeeming vault shares.

## Overview

The `useWithdraw` hook handles the single-step withdrawal flow for ERC4626-compliant YO Protocol vaults. Unlike deposits which require approval + deposit, withdrawals only need a single `redeem` transaction to burn vault shares and receive USDC.

## Requirements Validated

- **4.4**: Initiate redeem transaction to burn vault shares and receive USDC
- **4.5**: Display "Withdrawing..." status with transaction hash
- **4.6**: Display success message when withdrawal confirms
- **4.7**: Update user's USDC balance and vault share balance after withdrawal

## Usage

```tsx
import { useWithdraw } from '@/lib/hooks/useWithdraw'

function WithdrawButton({ vaultAddress, shares }: { vaultAddress: `0x${string}`, shares: bigint }) {
  const { withdraw, isWithdrawing, txHash, error, reset } = useWithdraw()
  
  const handleWithdraw = async () => {
    try {
      await withdraw({ vaultAddress, shares })
      console.log('Withdrawal initiated:', txHash)
    } catch (err) {
      console.error('Withdrawal failed:', err)
    }
  }
  
  return (
    <div>
      <button 
        onClick={handleWithdraw} 
        disabled={isWithdrawing}
      >
        {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
      </button>
      
      {txHash && (
        <a href={`https://basescan.org/tx/${txHash}`} target="_blank">
          View transaction
        </a>
      )}
      
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}
```

## API

### Parameters

```typescript
interface UseWithdrawParams {
  /** Vault address to withdraw from */
  vaultAddress: `0x${string}`
  
  /** Amount of shares to redeem (as bigint) */
  shares: bigint
}
```

### Return Value

```typescript
interface UseWithdrawReturn {
  /** Function to withdraw USDC from vault by redeeming shares */
  withdraw: (params: UseWithdrawParams) => Promise<void>
  
  /** Loading state for withdrawal transaction */
  isWithdrawing: boolean
  
  /** Transaction hash for withdrawal */
  txHash?: `0x${string}`
  
  /** Error state */
  error: Error | null
  
  /** Reset hook state */
  reset: () => void
}
```

## Implementation Details

### ERC4626 Redeem Function

The hook uses the standard ERC4626 `redeem` function:

```solidity
function redeem(
  uint256 shares,
  address receiver,
  address owner
) external returns (uint256 assets)
```

- **shares**: Amount of vault shares to burn
- **receiver**: Address to receive the USDC (user's address)
- **owner**: Address that owns the shares (user's address)
- **returns**: Amount of USDC assets received

### Transaction Flow

1. User calls `withdraw({ vaultAddress, shares })`
2. Hook validates wallet is connected
3. Hook calls vault's `redeem` function with user's address as both receiver and owner
4. Transaction is submitted to the blockchain
5. Hook tracks transaction status via `isWithdrawing`
6. Transaction hash is available immediately via `txHash`
7. Hook waits for transaction confirmation
8. User's vault shares are burned and USDC is transferred to their wallet

### State Management

The hook manages three pieces of state:

- **txHash**: Transaction hash, available immediately after submission
- **error**: Error object if transaction fails or wallet not connected
- **isWithdrawing**: Combined loading state (pending + confirming)

### Error Handling

The hook handles several error scenarios:

1. **Wallet Not Connected**: Sets error "Please connect your wallet"
2. **Transaction Rejection**: Captures wallet rejection errors
3. **On-chain Failure**: Captures contract execution errors (e.g., insufficient shares)

All errors are wrapped in Error objects with descriptive messages.

## Comparison with useDeposit

| Feature | useDeposit | useWithdraw |
|---------|-----------|-------------|
| Steps | 2 (approve + deposit) | 1 (redeem) |
| Approval needed | Yes (USDC) | No |
| Transaction count | 2 | 1 |
| Loading states | isApproving, isDepositing | isWithdrawing |
| Transaction hashes | approvalTxHash, depositTxHash | txHash |

## Testing

The hook includes comprehensive unit tests covering:

- Initial state
- Wallet connection validation
- Transaction parameter correctness
- Loading state transitions
- Transaction hash updates
- Error handling
- State reset functionality
- ERC4626 function signature validation

Run tests:

```bash
npm test lib/hooks/__tests__/useWithdraw.test.ts
```

## Security Considerations

1. **No Approval Required**: Withdrawals don't require USDC approval since the user is burning their own vault shares
2. **User as Receiver and Owner**: Both receiver and owner are set to the user's address to prevent sending funds to wrong address
3. **Exact Share Amount**: Only the specified amount of shares is redeemed, no more
4. **Error Messages**: User-friendly error messages prevent confusion and help with debugging

## Performance

- **Single Transaction**: Only one blockchain transaction required (vs. two for deposits)
- **Immediate Hash**: Transaction hash available immediately after submission
- **Optimistic Updates**: UI can show pending state while waiting for confirmation
- **No RPC Polling**: Uses wagmi's efficient transaction receipt waiting

## Future Enhancements

Potential improvements for future iterations:

1. **Slippage Protection**: Add minimum USDC amount parameter to protect against unfavorable exchange rates
2. **Partial Withdrawals**: Add helper to calculate shares needed for specific USDC amount
3. **Gas Estimation**: Pre-calculate and display gas costs before transaction
4. **Transaction Simulation**: Simulate transaction to catch errors before submission
5. **Withdrawal Queue**: Handle vaults with withdrawal delays or queues
