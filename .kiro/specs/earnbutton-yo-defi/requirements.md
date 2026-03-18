# Requirements Document: EarnButton - YO Protocol DeFi Yield Product

## Introduction

EarnButton is a DeFi yield product that enables users to deposit USDC into YO Protocol vaults on the Base network to earn passive yield. The system provides wallet connection, vault deposit and withdrawal capabilities, real-time portfolio tracking, and transparency into fund deployment across DeFi protocols. The application is built with Next.js 14, TypeScript, and integrates with YO Protocol SDK and RainbowKit for Web3 interactions.

## Glossary

- **System**: The EarnButton web application
- **User**: A person interacting with the EarnButton application
- **Wallet**: A Web3 wallet (e.g., MetaMask, Coinbase Wallet) connected via RainbowKit
- **Vault**: A YO Protocol smart contract that accepts USDC deposits and deploys funds to DeFi protocols
- **USDC**: USD Coin stablecoin token on Base network
- **Shares**: ERC-20 tokens representing proportional ownership in a vault
- **APY**: Annual Percentage Yield - the annualized rate of return
- **TVL**: Total Value Locked - the total amount of assets deposited in a vault
- **Base_Network**: Ethereum Layer 2 network where YO Protocol is deployed
- **RPC**: Remote Procedure Call endpoint for blockchain interactions
- **Transaction**: A blockchain transaction requiring wallet signature and gas fees
- **Modal**: A dialog overlay component for user interactions
- **Dashboard**: The portfolio overview interface showing user positions and earnings
- **Transparency_Panel**: Component displaying detailed fund allocation across protocols

## Requirements

### Requirement 1: Wallet Connection

**User Story:** As a user, I want to connect my Web3 wallet to the application, so that I can interact with YO Protocol vaults and manage my deposits.

#### Acceptance Criteria

1. WHEN a user visits the application without a connected wallet, THEN THE System SHALL display a "Connect Wallet" button
2. WHEN a user clicks the "Connect Wallet" button, THEN THE System SHALL display wallet options via RainbowKit
3. WHEN a user selects a wallet and approves the connection, THEN THE System SHALL establish connection to Base_Network
4. WHEN a wallet is connected, THEN THE System SHALL display the user's wallet address
5. WHEN a wallet is connected, THEN THE System SHALL fetch and display the user's USDC balance
6. WHEN a user's wallet is connected to a network other than Base_Network, THEN THE System SHALL display a warning message and provide a network switch option
7. WHEN a user disconnects their wallet, THEN THE System SHALL disable all interactive elements requiring wallet connection

### Requirement 2: Vault Information Display

**User Story:** As a user, I want to view detailed information about available YO Protocol vaults, so that I can make informed decisions about where to deposit my funds.

#### Acceptance Criteria

1. WHEN the application loads, THEN THE System SHALL fetch and display available vault metadata from YO Protocol
2. WHEN displaying vault information, THEN THE System SHALL show vault name, APY, risk level, and TVL
3. WHEN displaying risk levels, THEN THE System SHALL use color coding to distinguish between Low, Medium, and High risk
4. WHEN vault data is loading, THEN THE System SHALL display loading indicators
5. IF vault data fetch fails, THEN THE System SHALL display an error message and provide a retry option
6. WHEN a user requests detailed vault information, THEN THE System SHALL display protocol allocation breakdown with percentages and amounts
7. WHEN vault data is displayed, THEN THE System SHALL refresh the data every 5 minutes

### Requirement 3: Deposit Flow

**User Story:** As a user, I want to deposit USDC into a YO Protocol vault, so that I can earn yield on my stablecoin holdings.

#### Acceptance Criteria

1. WHEN a user clicks the "Earn with YO" button with a connected wallet, THEN THE System SHALL open the deposit modal
2. WHEN the deposit modal opens, THEN THE System SHALL display vault information including APY and risk level
3. WHEN a user enters a deposit amount, THEN THE System SHALL validate that the amount is greater than zero and does not exceed the user's USDC balance
4. WHEN a user enters an amount exceeding their USDC balance, THEN THE System SHALL display an error message and disable the deposit button
5. WHEN a user confirms a deposit, THEN THE System SHALL initiate a USDC approval transaction for the vault contract
6. WHEN the approval transaction is pending, THEN THE System SHALL display "Approving..." status with the transaction hash
7. WHEN the approval transaction confirms, THEN THE System SHALL automatically initiate the deposit transaction
8. WHEN the deposit transaction is pending, THEN THE System SHALL display "Depositing..." status with the transaction hash
9. WHEN the deposit transaction confirms, THEN THE System SHALL display a success message and close the modal
10. WHEN the deposit transaction confirms, THEN THE System SHALL update the user's USDC balance and vault share balance
11. IF a user rejects a transaction in their wallet, THEN THE System SHALL display an error message and reset the modal to the input state
12. IF a transaction fails on-chain, THEN THE System SHALL display an error message with the failure reason and transaction hash

### Requirement 4: Withdrawal Flow

**User Story:** As a user, I want to withdraw my USDC from a YO Protocol vault, so that I can access my funds and realized earnings.

#### Acceptance Criteria

1. WHEN a user views their dashboard with vault positions, THEN THE System SHALL display a "Withdraw" button for each position
2. WHEN a user clicks "Withdraw" on a position, THEN THE System SHALL fetch and display the user's vault share balance
3. WHEN a user enters a withdrawal amount, THEN THE System SHALL validate that the amount does not exceed their vault share balance
4. WHEN a user confirms a withdrawal, THEN THE System SHALL initiate a redeem transaction to burn vault shares and receive USDC
5. WHEN the withdrawal transaction is pending, THEN THE System SHALL display "Withdrawing..." status with the transaction hash
6. WHEN the withdrawal transaction confirms, THEN THE System SHALL display a success message
7. WHEN the withdrawal transaction confirms, THEN THE System SHALL update the user's USDC balance and vault share balance
8. IF a user rejects the withdrawal transaction, THEN THE System SHALL display an error message and allow retry
9. IF the withdrawal transaction fails, THEN THE System SHALL display an error message with the failure reason and transaction hash

### Requirement 5: Portfolio Dashboard

**User Story:** As a user, I want to view my portfolio overview showing all my vault positions and earnings, so that I can track my investment performance.

#### Acceptance Criteria

1. WHEN a user with vault positions views the dashboard, THEN THE System SHALL display total deposited amount across all vaults
2. WHEN displaying portfolio data, THEN THE System SHALL calculate and display current total value of all positions
3. WHEN displaying portfolio data, THEN THE System SHALL calculate and display total yield earned (current value minus deposited amount)
4. WHEN displaying portfolio data, THEN THE System SHALL calculate and display weighted average APY across all positions
5. WHEN displaying portfolio data, THEN THE System SHALL list individual vault positions with vault name, deposited amount, current value, shares, and APY
6. WHEN the dashboard is displayed, THEN THE System SHALL auto-refresh portfolio data every 30 seconds
7. WHEN a user has no vault positions, THEN THE System SHALL display a message encouraging them to make their first deposit
8. WHEN portfolio data is loading, THEN THE System SHALL display loading indicators
9. IF portfolio data fetch fails, THEN THE System SHALL display an error message and provide a retry option

### Requirement 6: Transparency and Fund Allocation

**User Story:** As a user, I want to see detailed information about how my funds are deployed across DeFi protocols, so that I understand where my money is invested and the associated risks.

#### Acceptance Criteria

1. WHEN a user views vault details, THEN THE System SHALL display a transparency panel showing protocol-by-protocol allocation
2. WHEN displaying protocol allocations, THEN THE System SHALL show protocol name, strategy description, allocation amount, and percentage
3. WHEN displaying protocol allocations, THEN THE System SHALL show APY and risk level for each protocol
4. WHEN displaying protocol allocations, THEN THE System SHALL ensure the sum of all percentages equals 100
5. WHEN displaying protocol allocations, THEN THE System SHALL visualize allocations with charts or progress bars
6. WHEN vault rebalancing occurs, THEN THE System SHALL update the transparency panel to reflect new allocations
7. WHEN displaying transparency information, THEN THE System SHALL show the timestamp of the last rebalance

### Requirement 7: Transaction Status and Feedback

**User Story:** As a user, I want clear feedback on transaction status and progress, so that I understand what is happening with my deposits and withdrawals.

#### Acceptance Criteria

1. WHEN a transaction is initiated, THEN THE System SHALL display the transaction type (approve, deposit, or withdraw)
2. WHEN a transaction is pending, THEN THE System SHALL display a loading indicator with "pending" status
3. WHEN a transaction is submitted to the blockchain, THEN THE System SHALL display the transaction hash as a clickable link to Basescan
4. WHEN a transaction is confirming, THEN THE System SHALL display "confirming" status
5. WHEN a transaction succeeds, THEN THE System SHALL display a success message with the transaction hash
6. IF a transaction fails, THEN THE System SHALL display an error message with the failure reason
7. WHEN displaying transaction status, THEN THE System SHALL show the timestamp of the transaction
8. WHEN a transaction completes, THEN THE System SHALL provide visual feedback within 500ms

### Requirement 8: Input Validation and Error Prevention

**User Story:** As a user, I want the application to validate my inputs and prevent invalid operations, so that I don't waste gas on failed transactions.

#### Acceptance Criteria

1. WHEN a user enters a deposit amount, THEN THE System SHALL validate that the amount is a valid positive number
2. WHEN a user enters a deposit amount, THEN THE System SHALL validate that the amount does not exceed their USDC balance
3. WHEN a user enters a withdrawal amount, THEN THE System SHALL validate that the amount does not exceed their vault share balance
4. WHEN a user enters an invalid amount, THEN THE System SHALL display a validation error message and disable the submit button
5. WHEN a user attempts to deposit with insufficient USDC balance, THEN THE System SHALL display "Insufficient USDC balance" error
6. WHEN a user attempts to interact without a connected wallet, THEN THE System SHALL disable all interactive elements
7. WHEN validating Ethereum addresses, THEN THE System SHALL ensure addresses are valid 42-character hexadecimal strings starting with "0x"
8. WHEN validating vault addresses, THEN THE System SHALL verify addresses against the official YO Protocol vault registry

### Requirement 9: Data Formatting and Display

**User Story:** As a user, I want financial data displayed in clear, readable formats, so that I can easily understand amounts, percentages, and rates.

#### Acceptance Criteria

1. WHEN displaying USDC amounts, THEN THE System SHALL format values with 2 decimal places and comma separators
2. WHEN displaying APY values, THEN THE System SHALL format percentages with 2 decimal places and a "%" symbol
3. WHEN displaying wallet addresses, THEN THE System SHALL truncate addresses to show first 6 and last 4 characters (e.g., "0x1234...5678")
4. WHEN displaying large numbers, THEN THE System SHALL use appropriate suffixes (K for thousands, M for millions)
5. WHEN displaying timestamps, THEN THE System SHALL format dates in human-readable format (e.g., "Jan 15, 2024")
6. WHEN displaying transaction hashes, THEN THE System SHALL truncate hashes to show first 10 and last 8 characters
7. WHEN displaying risk levels, THEN THE System SHALL use consistent color coding (green for Low, yellow for Medium, red for High)

### Requirement 10: Performance and Responsiveness

**User Story:** As a user, I want the application to load quickly and respond promptly to my interactions, so that I have a smooth user experience.

#### Acceptance Criteria

1. WHEN the application loads, THEN THE System SHALL achieve First Contentful Paint within 1.5 seconds
2. WHEN the application loads, THEN THE System SHALL achieve Time to Interactive within 3 seconds
3. WHEN fetching vault data, THEN THE System SHALL cache results for 5 minutes to reduce RPC calls
4. WHEN fetching balance data, THEN THE System SHALL cache results for 30 seconds
5. WHEN multiple contract calls are needed, THEN THE System SHALL batch calls using multicall to reduce latency
6. WHEN rendering expensive components, THEN THE System SHALL use React.memo to prevent unnecessary re-renders
7. WHEN a user interacts with the UI, THEN THE System SHALL provide visual feedback within 500ms
8. WHEN the initial JavaScript bundle loads, THEN THE System SHALL ensure bundle size is less than 200KB

### Requirement 11: Error Handling and Recovery

**User Story:** As a user, I want clear error messages and recovery options when something goes wrong, so that I can resolve issues and complete my transactions.

#### Acceptance Criteria

1. IF the RPC connection fails, THEN THE System SHALL display "Network connection issue" and retry with exponential backoff
2. IF vault data fetch fails, THEN THE System SHALL display an error state with a retry button
3. IF a transaction is rejected by the user, THEN THE System SHALL display "Transaction rejected by user" and reset to allow retry
4. IF a transaction fails on-chain, THEN THE System SHALL display the failure reason and transaction hash for debugging
5. IF the user's wallet is on the wrong network, THEN THE System SHALL display a prominent warning and provide a network switch button
6. IF an unexpected error occurs, THEN THE System SHALL log the error details and display a generic user-friendly message
7. WHEN an error is displayed, THEN THE System SHALL provide actionable recovery steps or retry options
8. WHEN a user has already approved USDC for a vault, THEN THE System SHALL skip the approval step and proceed directly to deposit

### Requirement 12: Security and Safety

**User Story:** As a user, I want the application to protect my funds and provide clear warnings about risks, so that I can make safe investment decisions.

#### Acceptance Criteria

1. WHEN requesting USDC approval, THEN THE System SHALL request exact amount approval (not infinite approval)
2. WHEN displaying transaction previews, THEN THE System SHALL show clear information about what will happen before the user signs
3. WHEN displaying vault information, THEN THE System SHALL show risk level warnings for Medium and High risk vaults
4. WHEN a user attempts to deposit into a high-risk vault, THEN THE System SHALL display a clear risk warning
5. WHEN validating user inputs, THEN THE System SHALL sanitize all inputs to prevent XSS attacks
6. WHEN making RPC calls, THEN THE System SHALL verify all data received from RPC endpoints
7. WHEN displaying vault addresses, THEN THE System SHALL verify addresses are legitimate YO Protocol vaults
8. WHEN a transaction is about to be submitted, THEN THE System SHALL estimate gas costs and display them to the user
