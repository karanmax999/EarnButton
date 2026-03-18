# Implementation Plan: EarnButton - YO Protocol DeFi Yield Product

## Overview

This implementation plan breaks down the EarnButton feature into discrete coding tasks. The feature is a Next.js 14 (App Router) application with TypeScript that integrates with YO Protocol vaults on Base network. Users can connect wallets via RainbowKit, deposit USDC into yield-generating vaults, and monitor their portfolio through a comprehensive dashboard.

The implementation follows a bottom-up approach: starting with core utilities and data models, then building custom hooks for Web3 interactions, followed by UI components, and finally integration and testing. Each task builds incrementally to ensure continuous validation.

## Tasks

- [x] 1. Project setup and configuration
  - Initialize Next.js 14 project with App Router and TypeScript
  - Install dependencies: wagmi, viem, RainbowKit, @yo-protocol/react, @yo-protocol/core, SWR, Tailwind CSS, date-fns, numeral, clsx
  - Configure Tailwind CSS with custom theme (Robinhood-inspired colors)
  - Set up RainbowKit with Base network configuration
  - Create wagmi config with Base RPC endpoint
  - Set up environment variables for RPC URLs and contract addresses
  - Configure TypeScript with strict mode
  - _Requirements: 1.1, 1.2, 1.3, 10.1, 10.2_

- [ ] 2. Core data models and validation utilities
  - [x] 2.1 Create TypeScript interfaces for data models
    - Define VaultMetadata, UserPosition, TransactionStatus, ProtocolAllocation interfaces
    - Add JSDoc comments for each interface property
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_
  
  - [x] 2.2 Implement validation functions
    - Create validateAddress function for Ethereum addresses
    - Create validateAmount function for deposit/withdrawal amounts
    - Create validateVaultMetadata function
    - Create validateUserPosition function
    - _Requirements: 8.1, 8.2, 8.3, 8.7_
  
  - [ ]* 2.3 Write property test for address validation
    - **Property 17: Ethereum Address Validation**
    - **Validates: Requirements 8.7**
  
  - [ ]* 2.4 Write property test for deposit amount validation
    - **Property 3: Deposit Amount Validation**
    - **Validates: Requirements 3.3, 8.1, 8.2**
  
  - [ ]* 2.5 Write property test for withdrawal amount validation
    - **Property 5: Withdrawal Amount Validation**
    - **Validates: Requirements 4.3, 8.3**

- [ ] 3. Formatting utilities
  - [x] 3.1 Create formatting utility functions
    - Implement formatUSDC (2 decimal places, comma separators)
    - Implement formatAPY (2 decimal places with % symbol)
    - Implement formatAddress (truncate to first 6 + last 4 chars)
    - Implement formatLargeNumber (K/M suffixes)
    - Implement formatTimestamp (human-readable dates)
    - Implement formatTxHash (truncate to first 10 + last 8 chars)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 3.2 Write property tests for formatting functions
    - **Property 18: USDC Amount Formatting**
    - **Property 19: APY Formatting**
    - **Property 20: Address Truncation Correctness**
    - **Property 21: Large Number Suffix Appropriateness**
    - **Property 22: Timestamp Human-Readable Format**
    - **Property 23: Transaction Hash Truncation**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

- [ ] 4. Input sanitization and security utilities
  - [x] 4.1 Create input sanitization function
    - Implement sanitizeInput to escape XSS characters
    - Add tests for common XSS attack vectors
    - _Requirements: 12.5_
  
  - [ ]* 4.2 Write property test for input sanitization
    - **Property 27: Input Sanitization**
    - **Validates: Requirements 12.5**

- [ ] 5. Custom hooks for Web3 interactions
  - [x] 5.1 Implement useBalance hook
    - Create hook to fetch USDC and vault share balances
    - Support both token types with single interface
    - Include formatted balance output
    - Add loading and error states
    - Implement refetch functionality
    - _Requirements: 3.2, 4.2, 5.1, 5.2_
  
  - [x] 5.2 Implement useYOVaults hook
    - Create hook to fetch vault metadata from YO Protocol
    - Integrate with SWR for caching (5-minute stale time)
    - Parse and validate vault data
    - Add loading and error states
    - Implement refetch functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 5.3 Implement useDeposit hook
    - Create hook for USDC approval transaction
    - Create hook for vault deposit transaction
    - Track approval and deposit states separately
    - Return transaction hashes for both steps
    - Handle errors with user-friendly messages
    - Check existing approval before requesting new one
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 12.1_
  
  - [x] 5.4 Implement useWithdraw hook
    - Create hook for vault share redemption
    - Track withdrawal transaction state
    - Return transaction hash
    - Handle errors with user-friendly messages
    - _Requirements: 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 5.5 Write unit tests for custom hooks
    - Test useBalance with mocked wagmi responses
    - Test useYOVaults with mocked YO Protocol data
    - Test useDeposit approval and deposit flows
    - Test useWithdraw redemption flow
    - Test error handling in all hooks

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Portfolio calculation utilities
  - [x] 7.1 Create portfolio calculation functions
    - Implement calculateTotalDeposited (sum of all position deposits)
    - Implement calculateTotalValue (sum of all position current values)
    - Implement calculateYieldEarned (total value - total deposited)
    - Implement calculateWeightedAPY (weighted by position values)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 7.2 Write property tests for portfolio calculations
    - **Property 7: Portfolio Total Deposited Calculation**
    - **Property 8: Portfolio Total Value Calculation**
    - **Property 9: Yield Calculation Correctness**
    - **Property 10: Weighted Average APY Bounds**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [ ] 8. EarnButton component
  - [x] 8.1 Create EarnButton component
    - Build button component with Tailwind styling
    - Implement disabled state when wallet not connected
    - Add click handler to open modal
    - Apply Robinhood-inspired design (rounded, gradient, shadow)
    - Add hover and active states
    - _Requirements: 1.4, 1.5_
  
  - [ ]* 8.2 Write unit tests for EarnButton
    - Test render with enabled/disabled states
    - Test click handler invocation
    - Test styling classes applied correctly

- [ ] 9. VaultInfo component
  - [x] 9.1 Create VaultInfo component
    - Integrate useYOVaults hook to fetch vault data
    - Display vault name, APY, risk level, TVL
    - Implement risk level color coding (green/yellow/red)
    - Show protocol allocation breakdown
    - Add loading skeleton
    - Add error state with retry button
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.7_
  
  - [ ]* 9.2 Write property test for vault info display
    - **Property 1: Vault Information Completeness**
    - **Property 2: Risk Level Color Consistency**
    - **Validates: Requirements 2.2, 2.3, 9.7**
  
  - [ ]* 9.3 Write unit tests for VaultInfo
    - Test data display with mocked vault data
    - Test loading state rendering
    - Test error state and retry functionality

- [ ] 10. TransparencyPanel component
  - [x] 10.1 Create TransparencyPanel component
    - Fetch protocol allocations from vault
    - Display protocol name, strategy, allocation amount, percentage, APY, risk level
    - Visualize allocations with progress bars
    - Add color coding for risk levels
    - Show loading state
    - Add error handling
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 10.2 Write property tests for transparency panel
    - **Property 12: Protocol Allocation Completeness**
    - **Property 13: Allocation Percentage Sum Invariant**
    - **Validates: Requirements 6.2, 6.3, 6.4**
  
  - [ ]* 10.3 Write unit tests for TransparencyPanel
    - Test allocation display with mocked data
    - Test percentage sum validation
    - Test loading and error states

- [ ] 11. EarnModal component
  - [x] 11.1 Create EarnModal base structure
    - Build modal dialog with overlay
    - Implement open/close functionality
    - Add close button and click-outside-to-close
    - Create modal header with vault info
    - Add Tailwind styling for modern fintech aesthetic
    - _Requirements: 3.1_
  
  - [x] 11.2 Implement deposit amount input
    - Create amount input field with validation
    - Show user's USDC balance
    - Add "Max" button to fill entire balance
    - Display validation errors inline
    - Disable submit when amount invalid
    - _Requirements: 3.2, 3.3, 8.1, 8.2_
  
  - [x] 11.3 Implement two-step transaction flow
    - Create step indicator (Approve → Deposit)
    - Integrate useDeposit hook
    - Handle approval transaction
    - Handle deposit transaction
    - Show transaction status for each step
    - Display transaction hashes with Basescan links
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 7.2, 7.3_
  
  - [x] 11.4 Implement success and error states
    - Show success message with transaction details
    - Auto-close modal after successful deposit
    - Display error messages with recovery options
    - Add retry functionality for failed transactions
    - _Requirements: 3.10, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [ ]* 11.5 Write property tests for modal behavior
    - **Property 4: Deposit Balance Update Consistency**
    - **Property 14: Transaction Type Display**
    - **Property 15: Transaction Hash Link Format**
    - **Property 16: Transaction Timestamp Presence**
    - **Property 24: Error Recovery Options Presence**
    - **Property 25: Exact Approval Amount**
    - **Validates: Requirements 3.10, 7.1, 7.3, 7.7, 11.7, 12.1**
  
  - [ ]* 11.6 Write unit tests for EarnModal
    - Test modal open/close behavior
    - Test amount input validation
    - Test step transitions
    - Test transaction status display
    - Test error handling and recovery

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Dashboard component
  - [x] 13.1 Create Dashboard base structure
    - Build dashboard layout with grid
    - Create portfolio summary section (total deposited, current value, yield earned, weighted APY)
    - Add auto-refresh functionality (30-second interval)
    - Implement loading skeleton
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 13.2 Implement position list display
    - Fetch user positions from all vaults
    - Display position cards with vault name, deposited amount, current value, shares, APY
    - Calculate and display individual position yields
    - Add empty state when no positions
    - _Requirements: 5.5, 5.6_
  
  - [x] 13.3 Implement withdraw functionality
    - Add withdraw button to each position card
    - Create withdraw modal/form
    - Integrate useWithdraw hook
    - Show withdrawal transaction status
    - Update balances after successful withdrawal
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 13.4 Write property tests for dashboard calculations
    - **Property 11: Position Display Completeness**
    - **Property 6: Withdrawal Balance Update Consistency**
    - **Validates: Requirements 5.5, 4.7**
  
  - [ ]* 13.5 Write unit tests for Dashboard
    - Test portfolio summary calculations
    - Test position list rendering
    - Test withdraw functionality
    - Test auto-refresh behavior
    - Test empty state

- [ ] 14. Network and wallet connection handling
  - [x] 14.1 Implement network validation
    - Check if user is connected to Base network
    - Show warning banner when on wrong network
    - Add "Switch to Base" button using RainbowKit
    - Disable all interactions when on wrong network
    - _Requirements: 1.2, 11.5_
  
  - [ ] 14.2 Implement wallet connection states
    - Show "Connect Wallet" button when disconnected
    - Disable EarnButton when wallet not connected
    - Display connected address in header
    - Show USDC balance in header
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [ ]* 14.3 Write unit tests for network and wallet handling
    - Test network validation logic
    - Test wallet connection state handling
    - Test UI state changes based on connection status

- [ ] 15. Error handling and user feedback
  - [x] 15.1 Create error boundary component
    - Implement React error boundary
    - Show user-friendly error messages
    - Add error reporting (console logging)
    - Provide recovery options
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [ ] 15.2 Implement toast notification system
    - Create toast component for success/error messages
    - Show toasts for transaction confirmations
    - Show toasts for errors with recovery actions
    - Auto-dismiss after timeout
    - _Requirements: 7.4, 7.5, 7.6, 7.7_
  
  - [ ] 15.3 Add risk warnings
    - Display risk warnings for Medium/High risk vaults
    - Show warning modal before depositing into high-risk vaults
    - Add "I understand the risks" checkbox
    - _Requirements: 12.3_
  
  - [ ]* 15.4 Write property test for risk warnings
    - **Property 26: Risk Warning Display**
    - **Validates: Requirements 12.3**

- [ ] 16. Main page layout and routing
  - [x] 16.1 Create main app layout
    - Build app/layout.tsx with RainbowKit providers
    - Add wagmi config provider
    - Add SWR config provider
    - Include global styles and Tailwind
    - _Requirements: 1.1, 10.1, 10.2_
  
  - [ ] 16.2 Create home page
    - Build app/page.tsx with hero section
    - Add EarnButton component
    - Display featured vaults with VaultInfo
    - Add link to dashboard
    - _Requirements: 1.4, 1.5, 2.1_
  
  - [ ] 16.3 Create dashboard page
    - Build app/dashboard/page.tsx
    - Add Dashboard component
    - Require wallet connection
    - Show redirect message when not connected
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 17. Performance optimizations
  - [ ] 17.1 Implement data caching strategy
    - Configure SWR with appropriate stale times (vault data: 5 min, balance: 30 sec)
    - Implement optimistic UI updates for transactions
    - Add request deduplication
    - _Requirements: 10.3, 10.4_
  
  - [ ] 17.2 Optimize component rendering
    - Add React.memo to Dashboard and TransparencyPanel
    - Optimize dependency arrays in useEffect/useMemo
    - Lazy load EarnModal component
    - _Requirements: 10.5_
  
  - [ ] 17.3 Implement multicall for batch contract reads
    - Use wagmi multicall for fetching multiple vault data
    - Batch balance checks for multiple positions
    - _Requirements: 10.6_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Integration and end-to-end wiring
  - [ ] 19.1 Wire all components together
    - Connect EarnButton to EarnModal
    - Connect EarnModal to Dashboard updates
    - Connect Dashboard to withdraw flow
    - Ensure state updates propagate correctly
    - Test full user flows manually
    - _Requirements: All requirements_
  
  - [ ] 19.2 Add loading states and transitions
    - Implement smooth transitions between states
    - Add loading spinners for all async operations
    - Show skeleton loaders for data fetching
    - _Requirements: 10.7_
  
  - [ ] 19.3 Verify transaction confirmations
    - Ensure all transactions wait for on-chain confirmation
    - Update UI only after confirmation
    - Show pending state during confirmation
    - _Requirements: 7.2, 7.4_

- [ ]* 20. Integration testing with Playwright
  - [ ]* 20.1 Set up Playwright test environment
    - Configure Playwright with Base testnet
    - Set up test wallet with test USDC
    - Configure test YO Protocol vault addresses
  
  - [ ]* 20.2 Write end-to-end deposit flow test
    - Test: Connect wallet → View vaults → Open modal → Approve → Deposit → View dashboard
    - Verify state updates at each step
    - Verify transaction confirmations
  
  - [ ]* 20.3 Write end-to-end withdraw flow test
    - Test: View dashboard → Select position → Withdraw → Confirm → Verify balance
    - Verify balance updates after withdrawal
  
  - [ ]* 20.4 Write multi-vault interaction test
    - Test depositing into multiple vaults
    - Verify dashboard shows all positions
    - Verify total calculations are accurate
  
  - [ ]* 20.5 Write error recovery flow tests
    - Test transaction rejection recovery
    - Test network switch recovery
    - Test RPC failure recovery

- [ ] 21. Final checkpoint and validation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements are met
  - Test on Base testnet with real transactions
  - Validate performance metrics (FCP < 1.5s, TTI < 3s)
  - Review security checklist (exact approvals, input sanitization, address validation)

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check library
- Integration tests use Playwright with Base testnet
- All components use TypeScript with strict mode
- Styling follows Robinhood-inspired design with Tailwind CSS
- Web3 interactions use wagmi v2 and viem v2
- Data fetching uses SWR for caching and real-time updates
