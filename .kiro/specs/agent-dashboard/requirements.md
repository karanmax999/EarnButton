# Agent Dashboard Requirements Document

## Introduction

The Agent Dashboard is a comprehensive trading interface for autonomous agents on the EarnButton platform. It enables agents to register their ERC-721 identity, compose and sign trade intents using EIP-712, monitor risk ratings, validate trading artifacts, track reputation scores, and manage capital in sandbox environments. The dashboard integrates with existing trading infrastructure including Credora risk ratings, RedStone price feeds, EigenCloud TEE attestations, and on-chain reputation registries. All components maintain visual consistency with the existing EarnButton design system and integrate seamlessly with the wagmi/RainbowKit wallet provider.

## Glossary

- **Agent**: An autonomous trading entity registered on-chain with an ERC-721 identity NFT
- **Agent_Identity**: The ERC-721 NFT representing an agent's on-chain registration and capabilities
- **Trade_Intent**: A structured data object specifying asset, amount, and direction (buy/sell) for a proposed trade
- **EIP-712**: Ethereum Improvement Proposal 712 standard for typed, structured data signing
- **Risk_Rating**: A Credora-provided risk assessment for vault positions including leverage limits and loss thresholds
- **Validation_Artifact**: A cryptographic proof bundle containing TEE attestation, EigenAI inference signature, and RedStone price proof
- **Reputation_Score**: An on-chain metric from ERC-8004 Reputation Registry measuring agent performance (Sharpe ratio, drawdown, validation score)
- **Capital_Sandbox**: A test environment vault where agents can trade with allocated capital before live trading
- **TEE_Attestation**: Trusted Execution Environment cryptographic proof of code execution integrity
- **EigenAI_Inference**: Machine learning model inference signature from EigenCloud
- **RedStone_Price_Proof**: Cryptographic proof of asset price from RedStone oracle network
- **Validation_Registry**: Smart contract storing validation artifacts on-chain
- **ERC-8004**: Ethereum standard for on-chain reputation tracking
- **Sharpe_Ratio**: Risk-adjusted return metric (yield / volatility)
- **Drawdown**: Maximum peak-to-trough decline in portfolio value
- **System**: The Agent Dashboard application
- **User**: An agent operator interacting with the dashboard
- **Wallet**: Connected Ethereum wallet via wagmi/RainbowKit provider
- **API_Server**: Backend service handling agent registration, trade submission, and validation
- **Design_System**: Existing EarnButton UI components and styling (globals.css, components/ui/)

---

## Requirements

### Requirement 1: Agent Identity Registration

**User Story:** As an agent operator, I want to register my agent with an ERC-721 identity NFT, so that I can establish my on-chain presence and trading eligibility.

#### Acceptance Criteria

1. WHEN the User navigates to the Agent Dashboard, THE System SHALL display the AgentIdentity component showing agent name, ID, wallet address, and capabilities list
2. WHEN the User clicks the "Register Agent" button, THE System SHALL call registerAgent(agentURI) on the ERC-721 contract via the connected Wallet
3. WHEN the registration transaction is submitted, THE System SHALL display "Pending" state with transaction hash
4. WHEN the registration transaction confirms on-chain, THE System SHALL update the display to "Live" state
5. WHEN the User is not connected to a Wallet, THE System SHALL display a wallet connection prompt instead of the register button
6. WHEN the User already has a registered agent identity, THE System SHALL display the agent details in read-only mode without the register button
7. THE AgentIdentity component SHALL render as a card with consistent styling matching existing vault cards (border, shadow, hover effects)
8. THE System SHALL persist agent registration state across page reloads by querying the blockchain

---

### Requirement 2: Trade Intent Composition and Signing

**User Story:** As an agent operator, I want to compose trade intents specifying asset, amount, and direction, then sign them with EIP-712, so that I can submit authenticated trade orders.

#### Acceptance Criteria

1. WHEN the User accesses the TradeIntent component, THE System SHALL display a form with fields for asset selection, amount input, and direction (buy/sell) toggle
2. WHEN the User selects an asset, THE System SHALL populate a dropdown with available trading pairs from the connected vault
3. WHEN the User enters an amount, THE System SHALL validate the input is a positive number and display validation feedback
4. WHEN the User clicks "Sign Trade Intent", THE System SHALL construct a TradeIntent struct with asset, amount, direction, and current timestamp
5. WHEN the TradeIntent struct is constructed, THE System SHALL call the EIP-712 signing function via the connected Wallet
6. WHEN the User approves the signature in their wallet, THE System SHALL attach the RedStone price proof to the signed intent
7. WHEN the signature and price proof are attached, THE System SHALL send the complete trade intent to /api/agent/trade endpoint
8. WHEN the trade submission succeeds, THE System SHALL display a success message with transaction hash
9. WHEN the trade submission fails, THE System SHALL display an error message with details
10. THE TradeIntent form SHALL include a preview showing the exact data being signed before confirmation
11. THE System SHALL prevent form submission if required fields are empty or invalid

---

### Requirement 3: Risk Rating Display and Monitoring

**User Story:** As an agent operator, I want to view Credora risk ratings for my active vaults, so that I can understand position limits and manage leverage responsibly.

#### Acceptance Criteria

1. WHEN the User views the RiskRouter component, THE System SHALL fetch Credora risk ratings for all active vaults
2. WHEN risk ratings are fetched, THE System SHALL display each vault with position size limits, maximum leverage, and daily loss limit
3. WHEN a vault has low risk, THE System SHALL display a green status indicator
4. WHEN a vault has medium risk, THE System SHALL display an amber status indicator
5. WHEN a vault has high risk, THE System SHALL display a red status indicator
6. WHEN the User hovers over a risk metric, THE System SHALL display a tooltip explaining the metric
7. WHEN risk data fails to load, THE System SHALL display a loading skeleton and retry mechanism
8. THE RiskRouter component SHALL update risk ratings every 60 seconds to reflect current market conditions
9. THE System SHALL display risk ratings in a table format with columns: Vault Name, Position Limit, Max Leverage, Daily Loss Limit, Status

---

### Requirement 4: Validation Artifact Rendering and Recording

**User Story:** As an agent operator, I want to view validation artifacts including TEE attestation, EigenAI inference signature, and RedStone price proof, so that I can verify the integrity of my trades.

#### Acceptance Criteria

1. WHEN the User views the ValidationArtifact component, THE System SHALL display three sections: TEE Attestation, EigenAI Inference, and RedStone Price Proof
2. WHEN the TEE Attestation section is displayed, THE System SHALL show the attestation hash and verification status
3. WHEN the EigenAI Inference section is displayed, THE System SHALL show the inference signature and model version
4. WHEN the RedStone Price Proof section is displayed, THE System SHALL show the price proof root and timestamp
5. WHEN the User clicks "Record Validation", THE System SHALL call ValidationRegistry.recordValidation() with all artifact data
6. WHEN the validation recording succeeds, THE System SHALL display a confirmation message with transaction hash
7. WHEN the validation recording fails, THE System SHALL display an error message and allow retry
8. THE ValidationArtifact component SHALL render each artifact section with consistent card styling
9. THE System SHALL display artifact hashes in truncated format with copy-to-clipboard functionality
10. WHEN validation artifacts are missing or incomplete, THE System SHALL display a warning message

---

### Requirement 5: Reputation Score Display

**User Story:** As an agent operator, I want to view my live on-chain reputation score including Sharpe ratio, drawdown percentage, and validation score, so that I can track my trading performance.

#### Acceptance Criteria

1. WHEN the User views the ReputationScore component, THE System SHALL fetch reputation data from the ERC-8004 Reputation Registry
2. WHEN reputation data is fetched, THE System SHALL display Sharpe ratio as a decimal number (e.g., 1.45)
3. WHEN reputation data is fetched, THE System SHALL display drawdown percentage as a percentage (e.g., 12.5%)
4. WHEN reputation data is fetched, THE System SHALL display validation score as a percentage (e.g., 98%)
5. WHEN the Sharpe ratio is above 1.0, THE System SHALL display it in green
6. WHEN the Sharpe ratio is between 0.5 and 1.0, THE System SHALL display it in amber
7. WHEN the Sharpe ratio is below 0.5, THE System SHALL display it in red
8. WHEN the drawdown is below 10%, THE System SHALL display it in green
9. WHEN the drawdown is between 10% and 25%, THE System SHALL display it in amber
10. WHEN the drawdown is above 25%, THE System SHALL display it in red
11. THE ReputationScore component SHALL update every 30 seconds to reflect latest on-chain data
12. WHEN reputation data fails to load, THE System SHALL display a loading skeleton and retry mechanism
13. THE System SHALL display reputation metrics in a card format with labels and color-coded values

---

### Requirement 6: Capital Sandbox Status Display

**User Story:** As an agent operator, I want to view my capital sandbox vault balance, capital claimed status, and ETH allocation, so that I can manage my test trading environment.

#### Acceptance Criteria

1. WHEN the User views the CapitalSandbox component, THE System SHALL display the sandbox vault balance in USDC
2. WHEN the User views the CapitalSandbox component, THE System SHALL display the capital claimed status (claimed/unclaimed)
3. WHEN the User views the CapitalSandbox component, THE System SHALL display the ETH allocation amount
4. WHEN capital is unclaimed, THE System SHALL display a "Claim Capital" button
5. WHEN the User clicks "Claim Capital", THE System SHALL submit a claim transaction to the sandbox vault contract
6. WHEN the claim transaction succeeds, THE System SHALL update the display to show claimed status
7. WHEN the claim transaction fails, THE System SHALL display an error message
8. THE CapitalSandbox component SHALL reuse the vault card visual language (border, shadow, hover effects) from existing components
9. THE System SHALL display sandbox balance with appropriate decimal precision (2 decimals for USDC)
10. WHEN sandbox data fails to load, THE System SHALL display a loading skeleton

---

### Requirement 7: Trade Activity History

**User Story:** As an agent operator, I want to view a log of my trade history, so that I can track all executed trades and their outcomes.

#### Acceptance Criteria

1. WHEN the User views the AgentActivity component, THE System SHALL display a chronological list of all trades executed by the agent
2. WHEN trades are displayed, THE System SHALL show for each trade: timestamp, asset pair, amount, direction (buy/sell), execution price, and status
3. WHEN a trade is pending, THE System SHALL display a pending status indicator
4. WHEN a trade is confirmed, THE System SHALL display a confirmed status indicator with transaction hash
5. WHEN a trade failed, THE System SHALL display a failed status indicator with error details
6. WHEN the User clicks on a trade row, THE System SHALL display detailed information including gas used, slippage, and validation artifacts
7. WHEN the User clicks a transaction hash, THE System SHALL open the transaction in a block explorer
8. THE AgentActivity component SHALL support pagination or infinite scroll for large trade histories
9. WHEN trade history fails to load, THE System SHALL display a loading skeleton and retry mechanism
10. THE System SHALL update trade history every 10 seconds to reflect new trades

---

### Requirement 8: Agent Dashboard Main Layout

**User Story:** As an agent operator, I want to access a unified dashboard that displays all agent-related information, so that I can manage my trading operations from a single interface.

#### Acceptance Criteria

1. WHEN the User navigates to /agent route, THE System SHALL render the AgentDashboard component as the main layout
2. WHEN the AgentDashboard loads, THE System SHALL display all eight sub-components in a responsive grid layout
3. WHEN the User is not connected to a Wallet, THE System SHALL display a wallet connection prompt covering the entire dashboard
4. WHEN the User connects a Wallet, THE System SHALL load and display all agent data
5. WHEN the User is on a mobile device, THE System SHALL stack dashboard components vertically
6. WHEN the User is on a desktop device, THE System SHALL arrange components in a 2-column or 3-column grid
7. THE AgentDashboard component SHALL maintain consistent spacing and padding with existing EarnButton components
8. THE System SHALL display a loading state while fetching initial agent data
9. WHEN any sub-component fails to load, THE System SHALL display an error state for that component only, not the entire dashboard
10. THE System SHALL include a header with "Agent Dashboard" title and agent address

---

### Requirement 9: Navigation Integration

**User Story:** As a user, I want to navigate to the Agent Dashboard from the main navigation, so that I can access agent features from anywhere in the application.

#### Acceptance Criteria

1. WHEN the User views the main navigation in layout.tsx, THE System SHALL display an "Agent" link
2. WHEN the User clicks the "Agent" link, THE System SHALL navigate to /agent route
3. WHEN the User is on the /agent route, THE System SHALL highlight the "Agent" link as active
4. THE "Agent" link SHALL be positioned consistently with other navigation items
5. THE System SHALL only display the "Agent" link when a Wallet is connected

---

### Requirement 10: Wallet Integration and State Management

**User Story:** As an agent operator, I want the dashboard to use my connected wallet for all transactions, so that I can sign and submit trades securely.

#### Acceptance Criteria

1. WHEN the User connects a Wallet via RainbowKit, THE System SHALL use the same wagmi provider instance for all dashboard components
2. WHEN the User disconnects their Wallet, THE System SHALL clear all agent data and display the wallet connection prompt
3. WHEN the User switches to a different Wallet, THE System SHALL reload all agent data for the new wallet address
4. WHEN a transaction is submitted, THE System SHALL use the connected Wallet to sign the transaction
5. WHEN a transaction fails due to insufficient balance, THE System SHALL display a clear error message
6. WHEN a transaction fails due to user rejection, THE System SHALL display a cancellation message
7. THE System SHALL persist wallet connection state across page reloads using RainbowKit's built-in persistence

---

### Requirement 11: API Integration for Agent Operations

**User Story:** As a system, I want to integrate with backend API endpoints for agent operations, so that I can register agents, submit trades, and record validations.

#### Acceptance Criteria

1. WHEN the User registers an agent, THE System SHALL POST to /api/agent/register/route.ts with agentURI
2. WHEN the User submits a trade intent, THE System SHALL POST to /api/agent/trade/route.ts with signed intent and price proof
3. WHEN the User records a validation artifact, THE System SHALL POST to /api/agent/validate/route.ts with artifact data
4. WHEN the System needs reputation data, THE System SHALL GET from /api/agent/reputation/route.ts
5. WHEN an API request succeeds, THE System SHALL update the UI with the response data
6. WHEN an API request fails, THE System SHALL display an error message and allow retry
7. THE System SHALL include appropriate error handling and timeout logic for all API calls
8. THE System SHALL send all requests with proper authentication headers if required

---

### Requirement 12: Design System Consistency

**User Story:** As a designer, I want all dashboard components to maintain visual consistency with existing EarnButton components, so that the interface feels cohesive.

#### Acceptance Criteria

1. WHEN dashboard components are rendered, THE System SHALL use the same color palette as existing components
2. WHEN dashboard components are rendered, THE System SHALL use the same typography and font sizes
3. WHEN dashboard components are rendered, THE System SHALL use the same spacing and padding conventions
4. WHEN dashboard cards are displayed, THE System SHALL apply the same border, shadow, and hover effects as vault cards
5. WHEN dashboard buttons are displayed, THE System SHALL use the same button styles and hover states
6. WHEN dashboard forms are displayed, THE System SHALL use the same input field styles and validation feedback
7. THE System SHALL import and use components from components/ui/ directory where applicable
8. THE System SHALL use Tailwind CSS classes consistent with existing components
9. WHEN animations are used, THE System SHALL respect prefers-reduced-motion media query

---

### Requirement 13: Type Safety and Code Organization

**User Story:** As a developer, I want the agent dashboard to have proper TypeScript types and organized file structure, so that the codebase is maintainable and type-safe.

#### Acceptance Criteria

1. WHEN the System is built, THE TypeScript compiler SHALL find no type errors in agent dashboard code
2. WHEN agent types are needed, THE System SHALL define them in types/agent.ts
3. WHEN agent services are needed, THE System SHALL define them in lib/agent/ directory
4. WHEN agent components are created, THE System SHALL place them in components/agent/ directory
5. WHEN agent routes are created, THE System SHALL place them in app/agent/ directory
6. THE System SHALL export all types and utilities from appropriate index files
7. WHEN components use external libraries, THE System SHALL import types from those libraries

---

### Requirement 14: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and feedback when operations fail, so that I can understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a transaction fails, THE System SHALL display a user-friendly error message
2. WHEN an API request fails, THE System SHALL display the error message and a retry button
3. WHEN a wallet is not connected, THE System SHALL display a clear prompt to connect
4. WHEN a required field is empty, THE System SHALL display validation feedback
5. WHEN an operation succeeds, THE System SHALL display a success message with relevant details
6. WHEN a long-running operation is in progress, THE System SHALL display a loading indicator
7. THE System SHALL use the existing Toast component for notifications
8. WHEN an error occurs, THE System SHALL log it for debugging purposes

---

### Requirement 15: Performance and Loading States

**User Story:** As a user, I want the dashboard to load quickly and display loading states while data is being fetched, so that I have a smooth experience.

#### Acceptance Criteria

1. WHEN the AgentDashboard first loads, THE System SHALL display skeleton loaders for all components
2. WHEN data is being fetched, THE System SHALL display appropriate loading indicators
3. WHEN data finishes loading, THE System SHALL replace skeleton loaders with actual content
4. THE System SHALL cache agent data to minimize redundant API calls
5. WHEN the User navigates away and back to the dashboard, THE System SHALL use cached data initially
6. THE System SHALL implement pagination or lazy loading for large data sets (e.g., trade history)
7. WHEN the User scrolls to the bottom of a list, THE System SHALL load additional items if available

---

### Requirement 16: Responsive Design

**User Story:** As a user on mobile or tablet, I want the dashboard to be fully functional and readable, so that I can manage my agent from any device.

#### Acceptance Criteria

1. WHEN the User views the dashboard on a mobile device (< 640px), THE System SHALL stack all components vertically
2. WHEN the User views the dashboard on a tablet (640px - 1024px), THE System SHALL display components in a 2-column layout
3. WHEN the User views the dashboard on a desktop (> 1024px), THE System SHALL display components in a 3-column layout
4. WHEN the User views forms on mobile, THE System SHALL display full-width input fields
5. WHEN the User views tables on mobile, THE System SHALL display a card-based layout instead of a table
6. WHEN the User views the dashboard on any device, THE System SHALL ensure all buttons and interactive elements are easily tappable (minimum 44px height)
7. THE System SHALL use Tailwind CSS responsive classes for all layout adjustments

---

### Requirement 17: Data Validation and Security

**User Story:** As a system, I want to validate all user inputs and ensure secure handling of sensitive data, so that the application is secure and reliable.

#### Acceptance Criteria

1. WHEN the User enters an amount in a form, THE System SHALL validate it is a positive number
2. WHEN the User selects an asset, THE System SHALL validate it is a supported asset
3. WHEN the User submits a trade intent, THE System SHALL validate all required fields are present
4. WHEN the System receives data from the API, THE System SHALL validate the response structure
5. WHEN the System handles wallet addresses, THE System SHALL validate they are valid Ethereum addresses
6. THE System SHALL never store private keys or sensitive wallet data
7. THE System SHALL use HTTPS for all API communications
8. WHEN the User signs a transaction, THE System SHALL display the exact data being signed

---

### Requirement 18: Integration with Library Services

**User Story:** As a developer, I want the dashboard to use existing library services for blockchain interactions, so that I can leverage proven implementations.

#### Acceptance Criteria

1. WHEN the System needs ERC-8004 registry calls, THE System SHALL use erc8004.ts service
2. WHEN the System needs EIP-712 signing, THE System SHALL use tradeIntent.ts service
3. WHEN the System needs price feeds, THE System SHALL use redstone.ts service
4. WHEN the System needs risk ratings, THE System SHALL use credora.ts service
5. WHEN the System needs TEE attestations, THE System SHALL use eigencloud.ts service
6. THE System SHALL import these services from lib/agent/ directory
7. WHEN a service call fails, THE System SHALL handle the error gracefully and display user feedback

---

### Requirement 19: Parser and Serializer for Trade Intent

**User Story:** As a system, I want to parse and serialize trade intents to/from JSON format, so that I can reliably transmit and store trade data.

#### Acceptance Criteria

1. WHEN a TradeIntent object is created, THE System SHALL serialize it to JSON format
2. WHEN JSON trade intent data is received from the API, THE System SHALL parse it into a TradeIntent object
3. WHEN a TradeIntent is serialized then parsed, THE System SHALL produce an equivalent object (round-trip property)
4. WHEN invalid JSON is provided, THE System SHALL return a descriptive error message
5. THE System SHALL include a pretty printer that formats TradeIntent objects for display
6. WHEN a TradeIntent is printed then parsed, THE System SHALL produce an equivalent object

---

### Requirement 20: Validation Artifact Parser and Serializer

**User Story:** As a system, I want to parse and serialize validation artifacts to/from JSON format, so that I can reliably store and retrieve validation proofs.

#### Acceptance Criteria

1. WHEN a ValidationArtifact object is created, THE System SHALL serialize it to JSON format
2. WHEN JSON validation artifact data is received from the API, THE System SHALL parse it into a ValidationArtifact object
3. WHEN a ValidationArtifact is serialized then parsed, THE System SHALL produce an equivalent object (round-trip property)
4. WHEN invalid JSON is provided, THE System SHALL return a descriptive error message
5. THE System SHALL include a pretty printer that formats ValidationArtifact objects for display
6. WHEN a ValidationArtifact is printed then parsed, THE System SHALL produce an equivalent object
7. THE System SHALL validate that all required artifact fields (TEE hash, EigenAI signature, RedStone proof) are present

---

## Acceptance Criteria Mapping to Judging Criteria

- **Requirement 1 (Agent Identity)** → Eligibility Requirement: ERC-721 registration
- **Requirement 4 (Validation Artifact)** → Validation Quality Score: Artifact integrity verification
- **Requirement 5 (Reputation Score)** → Reputation Leaderboard Column: On-chain reputation metrics
- **Requirement 3 (Risk Rating)** → Drawdown Control Score: Risk management and position limits
- **Requirement 7 (Trade Activity)** → On-chain Trade History: Complete trade execution log
