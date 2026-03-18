# useDeposit Hook

Custom React hook for handling USDC approval and vault deposit transactions in the EarnButton application.

## Overview

The `useDeposit` hook manages the two-step deposit flow required for depositing USDC into YO Protocol vaults:

1. **Approve USDC** - Grant the vault permission to spend USDC tokens (exact amount, not infinite)
2. **Deposit USDC** - Transfer USDC to the vault and receive vault shares

The hook tracks both transaction states separately, provides transaction hashes for both steps, and handles errors with user-friendly messages.

## Requirements Validated

- **3.4**: Initiate USDC approval transaction for vault contract
- **3.5**: Initiate deposit transaction
- **3.6**: Display "Approving..." status with transaction hash
- **3.7**: Automatically initiate deposit after approval confirms
- **3.8**: Display "Depositing..." status with transaction hash
- **3.9**: Display success message when deposit confirms
- **3.10**: Update user's USDC balance and vault share balance
- **12.1**: Request exact amount approval (not infinite approval)

## Usage

```tsx
import { useDeposit } from '@/lib/hooks/useDeposit'

function DepositModal({ vaultAddress }: { vaultAddress: `0x${string}` }) {
  const {
    approve,
    deposit,
    checkApproval,
    isApproving,
    isDepositing,
    approvalTxHash,
    depositTxHash,
    error,
    reset,
  } = useDeposit()

  const handleDeposit = async (amount: bigint) => {
    try {
      // Check if approval is needed
      const hasApproval = await checkApproval({ vaultAddress, amount })
      
      if (!hasApproval) {
        // Step 1: Approve USDC
        await approve({ vaultAddress, amount })
        // Wait for approval to confirm before proceeding
      }
      
      // Step 2: Deposit into vault
      await deposit({ vaultAddress, amount })
    } catch (err) {
      console.error('Deposit failed:', err)
    }
  }

  return (
    <div>
      {isApproving && (
        <div>
          Approving USDC...
          {approvalTxHash && <a href={`https://basescan.org/tx/${approvalTxHash}`}>View on Basescan</a>}
        </div>
      )}
      
      {isDepositing && (
        <div>
          Depositing into vault...
          {depositTxHash && <a href={`https://basescan.org/tx/${depositTxHash}`}>View on Basescan</a>}
        </div>
      )}
      
      {error && <div>Error: {error.message}</div>}
      
      <button onClick={() => handleDeposit(1000000000n)}>
        Deposit 1000 USDC
      </button>
    </div>
  )
}
```

## API

### Return Values

#### Functions

- **`approve(params: UseDepositParams): Promise<void>`**
  - Initiates USDC approval transaction for the vault
  - Requests exact amount approval (not infinite)
  - Throws error if wallet not connected

- **`deposit(params: UseDepositParams): Promise<void>`**
  - Initiates deposit transaction to vault
  - Deposits USDC and receives vault shares
  - Throws error if wallet not connected

- **`checkApproval(params: UseDepositParams): Promise<boolean>`**
  - Checks if user has sufficient USDC approval for the vault
  - Returns `true` if allowance >= amount, `false` otherwise
  - Returns `false` on error (logs to console)

- **`reset(): void`**
  - Clears all hook state (transaction hashes and errors)
  - Useful for resetting the modal after completion

#### State

- **`isApproving: boolean`**
  - `true` when approval transaction is pending or confirming
  - `false` otherwise

- **`isDepositing: boolean`**
  - `true` when deposit transaction is pending or confirming
  - `false` otherwise

- **`approvalTxHash?: 0x${string}`**
  - Transaction hash for the approval transaction
  - `undefined` if no approval transaction has been initiated

- **`depositTxHash?: 0x${string}`**
  - Transaction hash for the deposit transaction
  - `undefined` if no deposit transaction has been initiated

- **`error: Error | null`**
  - Error object if any transaction fails
  - `null` if no error

### Parameters

```typescript
interface UseDepositParams {
  vaultAddress: `0x${string}`  // Vault address to deposit into
  amount: bigint                // Amount to deposit (in USDC, with 6 decimals)
}
```

## Implementation Details

### Exact Amount Approval

Per Requirement 12.1, the hook requests **exact amount approval** rather than infinite approval. This is a security best practice that limits the vault's permission to only the amount being deposited.

```typescript
// Approves exactly the deposit amount
await approve({ vaultAddress, amount: 1000000000n }) // Approves exactly 1000 USDC
```

### Checking Existing Approval

Before requesting a new approval, you should check if sufficient approval already exists:

```typescript
const hasApproval = await checkApproval({ vaultAddress, amount })
if (!hasApproval) {
  await approve({ vaultAddress, amount })
}
```

This prevents unnecessary approval transactions and improves user experience.

### Transaction State Tracking

The hook tracks approval and deposit transactions separately:

- `isApproving` / `approvalTxHash` - For approval transaction
- `isDepositing` / `depositTxHash` - For deposit transaction

This allows the UI to show distinct status for each step of the flow.

### Error Handling

Errors are captured and exposed through the `error` state:

- Wallet not connected: "Please connect your wallet"
- Approval failure: "Approval failed: [reason]"
- Deposit failure: "Deposit failed: [reason]"

Always check the `error` state and display it to the user.

## Testing

The hook includes comprehensive unit tests covering:

- ✅ Checking approval with sufficient/insufficient allowance
- ✅ Approval transaction with exact amount
- ✅ Deposit transaction with correct parameters
- ✅ Transaction hash tracking for both steps
- ✅ Loading states (isApproving, isDepositing)
- ✅ Error handling for wallet not connected
- ✅ Error handling for transaction failures
- ✅ Reset functionality

Run tests with:

```bash
npm test lib/hooks/__tests__/useDeposit.test.ts
```

## Dependencies

- `wagmi` v2 - For Web3 interactions
- `viem` - For Ethereum utilities and ABIs
- `react` - For hooks

## Related Hooks

- `useBalance` - Fetch USDC and vault share balances
- `useWithdraw` - Handle vault withdrawals
- `useYOVaults` - Fetch vault metadata
