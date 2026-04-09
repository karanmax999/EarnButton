# Agent Dashboard Design Document

## Overview

The Agent Dashboard is a comprehensive trading interface for autonomous agents on the EarnButton platform. It provides a unified view of agent identity, trading capabilities, risk management, reputation metrics, and capital allocation. The dashboard integrates with existing trading infrastructure (Credora, RedStone, EigenCloud, ERC-8004) while maintaining visual consistency with the EarnButton design system.

The dashboard is accessible at the `/agent` route and consists of 8 interconnected components that work together to provide agents with complete visibility and control over their trading operations.

### Key Design Principles

1. **Unified Experience**: All agent-related information accessible from a single dashboard
2. **Progressive Disclosure**: Complex information revealed through expandable sections and tooltips
3. **Real-time Updates**: Live data feeds for risk ratings, reputation scores, and trade activity
4. **Responsive Design**: Fully functional on mobile, tablet, and desktop devices
5. **Design System Consistency**: Reuses existing EarnButton components and styling patterns
6. **Type Safety**: Full TypeScript coverage with shared type definitions

---

## Architecture

### High-Level Data Flow

```
User connects wallet (RainbowKit/wagmi)
    ↓
AgentDashboard loads and queries agent state
    ↓
Parallel data fetching:
  - Agent identity (blockchain)
  - Risk ratings (Credora API)
  - Reputation scores (ERC-8004)
  - Trade history (backend API)
  - Sandbox balance (vault contract)
    ↓
Components render with data
    ↓
User interactions trigger transactions:
  - Register agent (ERC-721)
  - Sign trade intent (EIP-712)
  - Record validation (smart contract)
  - Claim capital (vault contract)
    ↓
Transactions submitted via connected wallet
    ↓
Dashboard updates with new state
```

### Component Hierarchy

```
AgentDashboard (main layout)
├── Header (title + agent address)
├── WalletGuard (connection check)
└── Grid Layout (responsive)
    ├── AgentIdentity
    ├── TradeIntent
    ├── RiskRouter
    ├── ValidationArtifact
    ├── ReputationScore
    ├── CapitalSandbox
    ├── AgentActivity
    └── ErrorBoundary (wraps each component)
```

### State Management Strategy

**Local Component State**: Each component manages its own loading, error, and UI state using React hooks (`useState`, `useEffect`).

**Wallet State**: Managed by wagmi/RainbowKit provider at the application level. Components access via `useAccount()` hook.

**Data Caching**: Implement a simple cache layer in each component to minimize redundant API calls:
- Cache agent identity for the session
- Cache reputation scores for 30 seconds
- Cache risk ratings for 60 seconds
- Cache trade history with pagination

**Real-time Updates**: Use polling intervals for data that changes frequently:
- Risk ratings: 60-second poll
- Reputation scores: 30-second poll
- Trade activity: 10-second poll

---

## Components and Interfaces

### 1. AgentIdentity Component

**Purpose**: Display and manage agent ERC-721 registration

**Props**:
```typescript
interface AgentIdentityProps {
  walletAddress: string
  onRegistrationSuccess?: () => void
}
```

**Data Flow**:
1. Query blockchain for ERC-721 token owned by wallet
2. If token exists, display agent details in read-only mode
3. If no token, display registration form with "Register Agent" button
4. On registration, submit transaction and show pending state
5. Poll blockchain until transaction confirms

**UI States**:
- **Unregistered**: Form with input field for agent name + "Register Agent" button
- **Pending**: Shows transaction hash with "Confirming..." message
- **Registered**: Read-only card showing agent ID, name, wallet, capabilities

**Styling**: Card layout matching existing vault cards (border, shadow, hover effects)

---

### 2. TradeIntent Component

**Purpose**: Compose, preview, and sign trade intents with EIP-712

**Props**:
```typescript
interface TradeIntentProps {
  walletAddress: string
  agentId: string
  onTradeSubmitted?: (txHash: string) => void
}
```

**Data Flow**:
1. Display form with asset dropdown, amount input, direction toggle
2. Populate asset dropdown from connected vault's trading pairs
3. Validate amount input (positive number, within limits)
4. On "Sign Trade Intent" click, construct TradeIntent struct
5. Call EIP-712 signing via wallet
6. Attach RedStone price proof to signed intent
7. POST to `/api/agent/trade` endpoint
8. Display success/error message

**UI States**:
- **Form**: Input fields with validation feedback
- **Preview**: Shows exact data being signed before confirmation
- **Signing**: "Waiting for wallet signature..." message
- **Submitting**: "Submitting trade..." with spinner
- **Success**: Confirmation with transaction hash
- **Error**: Error message with retry button

**Validation**:
- Amount must be positive number
- Amount must not exceed vault balance
- Asset must be supported
- All required fields must be filled

---

### 3. RiskRouter Component

**Purpose**: Display Credora risk ratings and position limits

**Props**:
```typescript
interface RiskRouterProps {
  walletAddress: string
  vaultAddresses: string[]
}
```

**Data Flow**:
1. Fetch Credora risk ratings for each vault
2. Display in table format with columns: Vault Name, Position Limit, Max Leverage, Daily Loss Limit, Status
3. Color-code status: green (low), amber (medium), red (high)
4. Poll every 60 seconds for updates
5. Show tooltips on hover explaining each metric

**UI States**:
- **Loading**: Skeleton loaders for each row
- **Loaded**: Table with risk data and color-coded status
- **Error**: Error message with retry button

**Styling**: Table layout with responsive card-based layout on mobile

---

### 4. ValidationArtifact Component

**Purpose**: Display and record validation artifacts (TEE, EigenAI, RedStone)

**Props**:
```typescript
interface ValidationArtifactProps {
  walletAddress: string
  artifacts?: ValidationArtifactData
  onRecordingSuccess?: () => void
}
```

**Data Flow**:
1. Display three sections: TEE Attestation, EigenAI Inference, RedStone Price Proof
2. Show artifact hashes in truncated format with copy-to-clipboard
3. On "Record Validation" click, call ValidationRegistry.recordValidation()
4. Show pending state with transaction hash
5. Update to success state when transaction confirms

**UI States**:
- **Empty**: "No validation artifacts available" message
- **Loaded**: Three artifact sections with hashes and verification status
- **Recording**: "Recording validation..." with spinner
- **Success**: Confirmation with transaction hash
- **Error**: Error message with retry button

**Styling**: Card sections with monospace font for hashes

---

### 5. ReputationScore Component

**Purpose**: Display on-chain reputation metrics from ERC-8004

**Props**:
```typescript
interface ReputationScoreProps {
  walletAddress: string
  agentId: string
}
```

**Data Flow**:
1. Query ERC-8004 Reputation Registry for agent metrics
2. Display Sharpe ratio, drawdown percentage, validation score
3. Color-code based on thresholds:
   - Sharpe: green (>1.0), amber (0.5-1.0), red (<0.5)
   - Drawdown: green (<10%), amber (10-25%), red (>25%)
   - Validation: green (>95%), amber (80-95%), red (<80%)
4. Poll every 30 seconds for updates

**UI States**:
- **Loading**: Skeleton loaders for each metric
- **Loaded**: Card with three metrics and color-coded values
- **Error**: Error message with retry button

**Styling**: Card layout with large metric values and color indicators

---

### 6. CapitalSandbox Component

**Purpose**: Display sandbox vault balance and capital claim status

**Props**:
```typescript
interface CapitalSandboxProps {
  walletAddress: string
  sandboxVaultAddress: string
}
```

**Data Flow**:
1. Query sandbox vault contract for balance and claim status
2. Display balance in USDC with 2 decimal precision
3. Show claim status (claimed/unclaimed)
4. Show ETH allocation amount
5. If unclaimed, display "Claim Capital" button
6. On button click, submit claim transaction
7. Update display when transaction confirms

**UI States**:
- **Loading**: Skeleton loaders
- **Unclaimed**: Shows balance, allocation, and "Claim Capital" button
- **Claimed**: Shows balance, allocation, and "Claimed" badge
- **Claiming**: "Claiming capital..." with spinner
- **Success**: "Capital claimed" confirmation
- **Error**: Error message with retry button

**Styling**: Card layout matching existing vault cards

---

### 7. AgentActivity Component

**Purpose**: Display chronological trade history with details

**Props**:
```typescript
interface AgentActivityProps {
  walletAddress: string
  agentId: string
}
```

**Data Flow**:
1. Fetch trade history from backend API
2. Display as paginated list (10 items per page)
3. Show for each trade: timestamp, asset pair, amount, direction, execution price, status
4. On row click, expand to show details: gas used, slippage, validation artifacts
5. On transaction hash click, open block explorer
6. Poll every 10 seconds for new trades

**UI States**:
- **Loading**: Skeleton loaders for list items
- **Loaded**: List of trades with expandable details
- **Empty**: "No trades yet" message
- **Error**: Error message with retry button

**Styling**: Card-based layout on mobile, table on desktop

---

### 8. AgentDashboard Component

**Purpose**: Main layout component that orchestrates all sub-components

**Props**:
```typescript
interface AgentDashboardProps {
  walletAddress?: string
}
```

**Data Flow**:
1. Check wallet connection via wagmi
2. If not connected, display wallet connection prompt
3. If connected, render grid layout with all 8 components
4. Each component wrapped in ErrorBoundary
5. Display loading state while initial data loads
6. Handle component-level errors without affecting entire dashboard

**Responsive Layout**:
- **Mobile (<640px)**: Single column, components stack vertically
- **Tablet (640px-1024px)**: 2-column grid
- **Desktop (>1024px)**: 3-column grid

**UI States**:
- **Disconnected**: Wallet connection prompt
- **Loading**: Skeleton loaders for all components
- **Loaded**: Full dashboard with all components
- **Error**: Component-level error states (individual components show errors)

---

## Data Models

### Agent Types

```typescript
// types/agent.ts

export interface AgentIdentity {
  id: string
  name: string
  walletAddress: string
  tokenId: bigint
  capabilities: string[]
  registeredAt: number
  status: 'pending' | 'live'
}

export interface TradeIntent {
  asset: string
  amount: bigint
  direction: 'buy' | 'sell'
  timestamp: number
  signature?: string
  priceProof?: string
}

export interface RiskRating {
  vaultAddress: string
  vaultName: string
  positionLimit: bigint
  maxLeverage: number
  dailyLossLimit: bigint
  riskLevel: 'low' | 'medium' | 'high'
  updatedAt: number
}

export interface ValidationArtifact {
  teeHash: string
  teeVerified: boolean
  eigenaiSignature: string
  eigenaiModel: string
  redstoneProof: string
  redstoneTimestamp: number
}

export interface ReputationMetrics {
  sharpeRatio: number
  drawdownPercentage: number
  validationScore: number
  updatedAt: number
}

export interface CapitalSandbox {
  vaultAddress: string
  balance: bigint
  claimed: boolean
  ethAllocation: bigint
}

export interface Trade {
  id: string
  timestamp: number
  assetPair: string
  amount: bigint
  direction: 'buy' | 'sell'
  executionPrice: number
  status: 'pending' | 'confirmed' | 'failed'
  txHash?: string
  gasUsed?: bigint
  slippage?: number
  validationArtifacts?: ValidationArtifact
}
```

### API Response Types

```typescript
export interface AgentRegisterResponse {
  success: boolean
  agentId: string
  txHash: string
  message?: string
}

export interface TradeSubmitResponse {
  success: boolean
  txHash: string
  tradeId: string
  message?: string
}

export interface ValidationRecordResponse {
  success: boolean
  txHash: string
  message?: string
}

export interface ReputationResponse {
  sharpeRatio: number
  drawdownPercentage: number
  validationScore: number
  updatedAt: number
}
```

---

## API Integration Patterns

### Backend Routes

**POST /api/agent/register**
- Request: `{ agentURI: string }`
- Response: `AgentRegisterResponse`
- Error handling: Display user-friendly error message

**POST /api/agent/trade**
- Request: `{ signedIntent: TradeIntent, priceProof: string }`
- Response: `TradeSubmitResponse`
- Error handling: Display validation errors or network errors

**POST /api/agent/validate**
- Request: `{ artifacts: ValidationArtifact }`
- Response: `ValidationRecordResponse`
- Error handling: Display recording errors

**GET /api/agent/reputation**
- Query params: `?agentId=string`
- Response: `ReputationResponse`
- Error handling: Display fetch errors with retry

### Error Handling Strategy

1. **Network Errors**: Display "Network error. Please try again." with retry button
2. **Validation Errors**: Display specific field errors (e.g., "Amount must be positive")
3. **Transaction Errors**: Display error message from blockchain (e.g., "Insufficient balance")
4. **API Errors**: Display error message from backend with retry button
5. **Timeout Errors**: Display "Request timed out. Please try again." with retry button

### Retry Logic

- Automatic retry for network timeouts (max 3 attempts)
- Manual retry button for user-initiated actions
- Exponential backoff for polling (start at 1s, max 60s)

---

## Service Layer Organization

### Library Services

**lib/agent/erc8004.ts**
- `fetchReputationMetrics(agentId: string): Promise<ReputationMetrics>`
- `subscribeToReputationUpdates(agentId: string, callback: (metrics: ReputationMetrics) => void): () => void`

**lib/agent/tradeIntent.ts**
- `createTradeIntent(asset: string, amount: bigint, direction: 'buy' | 'sell'): TradeIntent`
- `signTradeIntent(intent: TradeIntent, signer: Signer): Promise<string>`
- `serializeTradeIntent(intent: TradeIntent): string`
- `parseTradeIntent(json: string): TradeIntent`

**lib/agent/redstone.ts**
- `fetchPriceProof(asset: string): Promise<string>`
- `verifyPriceProof(proof: string): Promise<boolean>`

**lib/agent/credora.ts**
- `fetchRiskRatings(vaultAddresses: string[]): Promise<RiskRating[]>`
- `subscribeToRiskUpdates(vaultAddresses: string[], callback: (ratings: RiskRating[]) => void): () => void`

**lib/agent/eigencloud.ts**
- `fetchValidationArtifacts(agentId: string): Promise<ValidationArtifact>`
- `recordValidationArtifacts(artifacts: ValidationArtifact): Promise<string>`

### Component Services

**lib/agent/agentService.ts**
- `registerAgent(name: string, walletAddress: string): Promise<AgentRegisterResponse>`
- `fetchAgentIdentity(walletAddress: string): Promise<AgentIdentity | null>`

**lib/agent/tradeService.ts**
- `submitTrade(intent: TradeIntent, priceProof: string): Promise<TradeSubmitResponse>`
- `fetchTradeHistory(agentId: string, limit: number, offset: number): Promise<Trade[]>`

**lib/agent/sandboxService.ts**
- `fetchSandboxBalance(walletAddress: string): Promise<CapitalSandbox>`
- `claimCapital(walletAddress: string): Promise<string>`

---

## Error Handling

### Component-Level Error Boundaries

Each component wrapped in ErrorBoundary to prevent cascading failures:
- Component error doesn't affect other components
- Error state shows user-friendly message with retry button
- Errors logged for debugging

### Transaction Error Handling

```typescript
try {
  const tx = await contract.method()
  const receipt = await tx.wait()
  // Success
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    showError('Insufficient balance for this transaction')
  } else if (error.code === 'USER_REJECTED') {
    showError('Transaction rejected by user')
  } else {
    showError('Transaction failed. Please try again.')
  }
}
```

### API Error Handling

```typescript
try {
  const response = await fetch('/api/agent/trade', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message)
  }
  return await response.json()
} catch (error) {
  showError(error.message || 'Request failed. Please try again.')
}
```

---

## Loading and Skeleton States

### Skeleton Components

Use existing `Skeleton` component from `components/ui/Skeleton.tsx`:

```typescript
<Skeleton width="100%" height="2rem" borderRadius="0.5rem" />
```

### Loading Patterns

**Card Loading**: Show skeleton for entire card content
```typescript
{isLoading ? (
  <div className="space-y-2">
    <Skeleton height="1.5rem" />
    <Skeleton height="1rem" />
    <Skeleton height="1rem" width="80%" />
  </div>
) : (
  // actual content
)}
```

**Table Loading**: Show skeleton rows
```typescript
{isLoading ? (
  Array(5).fill(0).map((_, i) => (
    <tr key={i}>
      <td><Skeleton height="1rem" /></td>
      <td><Skeleton height="1rem" /></td>
      <td><Skeleton height="1rem" /></td>
    </tr>
  ))
) : (
  // actual rows
)}
```

---

## Responsive Design Breakpoints

### Tailwind Breakpoints

- **sm**: 640px (mobile)
- **md**: 768px (tablet)
- **lg**: 1024px (desktop)
- **xl**: 1280px (large desktop)

### Layout Adjustments

**Mobile (<640px)**:
- Single column layout
- Full-width inputs and buttons
- Card-based table display
- Minimum 44px touch targets

**Tablet (640px-1024px)**:
- 2-column grid
- Adjusted spacing
- Responsive typography

**Desktop (>1024px)**:
- 3-column grid
- Full table display
- Optimized spacing

### Responsive Classes

```typescript
// Grid layout
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Full-width on mobile
<input className="w-full sm:w-auto" />

// Hide on mobile
<div className="hidden sm:block">

// Show only on mobile
<div className="sm:hidden">
```

---

## Type Definitions and Interfaces

### Shared Types (types/agent.ts)

All agent-related types defined in single file for consistency:
- `AgentIdentity`
- `TradeIntent`
- `RiskRating`
- `ValidationArtifact`
- `ReputationMetrics`
- `CapitalSandbox`
- `Trade`
- API response types

### Component Props

Each component has typed props interface:
```typescript
interface ComponentProps {
  walletAddress: string
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}
```

### Hook Return Types

Custom hooks return typed data:
```typescript
function useAgentIdentity(walletAddress: string): {
  data: AgentIdentity | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}
```

---

## Navigation Integration

### Route Structure

```
/agent                    → AgentDashboard main page
/agent/register          → Agent registration flow (optional)
/agent/trade/[id]        → Trade details page (optional)
```

### Navigation Link

Add to main navigation in `app/layout.tsx`:
```typescript
<nav>
  <Link href="/">Home</Link>
  <Link href="/agent">Agent</Link>  {/* New link */}
</nav>
```

### Active Link Highlighting

Use `usePathname()` to highlight active link:
```typescript
const pathname = usePathname()
const isActive = pathname.startsWith('/agent')
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing correctness properties, I need to analyze the acceptance criteria for testability.


### Acceptance Criteria Testing Prework

#### Requirement 1: Agent Identity Registration

1.1. WHEN the User navigates to the Agent Dashboard, THE System SHALL display the AgentIdentity component showing agent name, ID, wallet address, and capabilities list
  Thoughts: This is testing that a specific UI component is rendered when a page loads. We can test this by rendering the component and checking that the expected elements are present in the DOM.
  Testable: yes - example

1.2. WHEN the User clicks the "Register Agent" button, THE System SHALL call registerAgent(agentURI) on the ERC-721 contract via the connected Wallet
  Thoughts: This is testing that a button click triggers a specific contract call. We can test this by mocking the contract and verifying the call is made with the correct parameters.
  Testable: yes - property

1.3. WHEN the registration transaction is submitted, THE System SHALL display "Pending" state with transaction hash
  Thoughts: This is testing that after a transaction is submitted, the UI updates to show a pending state. We can test this by simulating a transaction submission and verifying the UI state changes.
  Testable: yes - property

1.4. WHEN the registration transaction confirms on-chain, THE System SHALL update the display to "Live" state
  Thoughts: This is testing that when a transaction confirms, the UI updates. We can test this by simulating transaction confirmation and verifying the UI state changes.
  Testable: yes - property

1.5. WHEN the User is not connected to a Wallet, THE System SHALL display a wallet connection prompt instead of the register button
  Thoughts: This is testing that when no wallet is connected, a specific UI element is shown. We can test this by rendering the component without a wallet and checking for the prompt.
  Testable: yes - example

1.6. WHEN the User already has a registered agent identity, THE System SHALL display the agent details in read-only mode without the register button
  Thoughts: This is testing that when an agent is already registered, the UI shows read-only details. We can test this by providing registered agent data and verifying the UI shows read-only mode.
  Testable: yes - property

1.7. THE AgentIdentity component SHALL render as a card with consistent styling matching existing vault cards (border, shadow, hover effects)
  Thoughts: This is testing visual styling consistency. This is not easily testable as a property without visual regression testing.
  Testable: no

1.8. THE System SHALL persist agent registration state across page reloads by querying the blockchain
  Thoughts: This is testing that state persists across page reloads by querying the blockchain. We can test this by registering an agent, reloading, and verifying the agent data is still present.
  Testable: yes - property

#### Requirement 2: Trade Intent Composition and Signing

2.1. WHEN the User accesses the TradeIntent component, THE System SHALL display a form with fields for asset selection, amount input, and direction (buy/sell) toggle
  Thoughts: This is testing that specific form fields are rendered. We can test this by rendering the component and checking for the expected form elements.
  Testable: yes - example

2.2. WHEN the User selects an asset, THE System SHALL populate a dropdown with available trading pairs from the connected vault
  Thoughts: This is testing that selecting an asset populates a dropdown. We can test this by selecting an asset and verifying the dropdown is populated with the correct pairs.
  Testable: yes - property

2.3. WHEN the User enters an amount, THE System SHALL validate the input is a positive number and display validation feedback
  Thoughts: This is testing input validation. We can test this by entering various amounts (positive, negative, zero, non-numeric) and verifying validation feedback is displayed correctly.
  Testable: yes - property

2.4. WHEN the User clicks "Sign Trade Intent", THE System SHALL construct a TradeIntent struct with asset, amount, direction, and current timestamp
  Thoughts: This is testing that a button click constructs a specific data structure. We can test this by clicking the button and verifying the TradeIntent struct is created with the correct fields.
  Testable: yes - property

2.5. WHEN the TradeIntent struct is constructed, THE System SHALL call the EIP-712 signing function via the connected Wallet
  Thoughts: This is testing that a specific function is called. We can test this by mocking the signing function and verifying it's called with the correct parameters.
  Testable: yes - property

2.6. WHEN the User approves the signature in their wallet, THE System SHALL attach the RedStone price proof to the signed intent
  Thoughts: This is testing that after wallet approval, a price proof is attached. We can test this by simulating wallet approval and verifying the price proof is attached.
  Testable: yes - property

2.7. WHEN the signature and price proof are attached, THE System SHALL send the complete trade intent to /api/agent/trade endpoint
  Thoughts: This is testing that a POST request is made to a specific endpoint. We can test this by mocking the API and verifying the request is made with the correct data.
  Testable: yes - property

2.8. WHEN the trade submission succeeds, THE System SHALL display a success message with transaction hash
  Thoughts: This is testing that a success message is displayed. We can test this by simulating a successful API response and verifying the success message is shown.
  Testable: yes - property

2.9. WHEN the trade submission fails, THE System SHALL display an error message with details
  Thoughts: This is testing that an error message is displayed on failure. We can test this by simulating an API error and verifying the error message is shown.
  Testable: yes - property

2.10. THE TradeIntent form SHALL include a preview showing the exact data being signed before confirmation
  Thoughts: This is testing that a preview is displayed. We can test this by filling out the form and verifying the preview shows the correct data.
  Testable: yes - property

2.11. THE System SHALL prevent form submission if required fields are empty or invalid
  Thoughts: This is testing form validation. We can test this by submitting the form with empty/invalid fields and verifying submission is prevented.
  Testable: yes - property

#### Requirement 3: Risk Rating Display and Monitoring

3.1. WHEN the User views the RiskRouter component, THE System SHALL fetch Credora risk ratings for all active vaults
  Thoughts: This is testing that an API call is made when the component loads. We can test this by mocking the API and verifying the call is made.
  Testable: yes - property

3.2. WHEN risk ratings are fetched, THE System SHALL display each vault with position size limits, maximum leverage, and daily loss limit
  Thoughts: This is testing that specific data is displayed. We can test this by providing risk rating data and verifying the UI displays the correct information.
  Testable: yes - property

3.3-3.6. Risk status color coding (low/medium/high)
  Thoughts: These are testing that specific colors are applied based on risk level. We can test this by providing different risk levels and verifying the correct color is applied.
  Testable: yes - property

3.7. WHEN risk data fails to load, THE System SHALL display a loading skeleton and retry mechanism
  Thoughts: This is testing error handling. We can test this by simulating an API error and verifying the skeleton and retry button are shown.
  Testable: yes - property

3.8. THE RiskRouter component SHALL update risk ratings every 60 seconds to reflect current market conditions
  Thoughts: This is testing that polling happens at the correct interval. We can test this by mocking time and verifying API calls happen at 60-second intervals.
  Testable: yes - property

3.9. THE System SHALL display risk ratings in a table format with columns: Vault Name, Position Limit, Max Leverage, Daily Loss Limit, Status
  Thoughts: This is testing that specific columns are displayed. We can test this by rendering the component and verifying the columns are present.
  Testable: yes - example

#### Requirement 4: Validation Artifact Rendering and Recording

4.1. WHEN the User views the ValidationArtifact component, THE System SHALL display three sections: TEE Attestation, EigenAI Inference, and RedStone Price Proof
  Thoughts: This is testing that specific sections are rendered. We can test this by rendering the component and checking for the expected sections.
  Testable: yes - example

4.2-4.4. Display of artifact data (hashes, signatures, proofs)
  Thoughts: These are testing that specific data is displayed. We can test this by providing artifact data and verifying the UI displays it correctly.
  Testable: yes - property

4.5. WHEN the User clicks "Record Validation", THE System SHALL call ValidationRegistry.recordValidation() with all artifact data
  Thoughts: This is testing that a button click triggers a specific contract call. We can test this by mocking the contract and verifying the call is made.
  Testable: yes - property

4.6-4.7. Success/error messages for validation recording
  Thoughts: These are testing that appropriate messages are displayed. We can test this by simulating success/error responses and verifying the messages are shown.
  Testable: yes - property

4.8-4.10. Artifact display styling and warnings
  Thoughts: These are testing UI rendering and warnings. We can test this by providing artifact data and verifying the UI renders correctly and shows warnings when needed.
  Testable: yes - property

#### Requirement 5: Reputation Score Display

5.1. WHEN the User views the ReputationScore component, THE System SHALL fetch reputation data from the ERC-8004 Reputation Registry
  Thoughts: This is testing that an API call is made. We can test this by mocking the API and verifying the call is made.
  Testable: yes - property

5.2-5.4. Display of reputation metrics (Sharpe ratio, drawdown, validation score)
  Thoughts: These are testing that specific metrics are displayed. We can test this by providing reputation data and verifying the UI displays it correctly.
  Testable: yes - property

5.5-5.10. Color coding based on metric thresholds
  Thoughts: These are testing that colors are applied based on metric values. We can test this by providing different metric values and verifying the correct colors are applied.
  Testable: yes - property

5.11. THE ReputationScore component SHALL update every 30 seconds to reflect latest on-chain data
  Thoughts: This is testing polling at a specific interval. We can test this by mocking time and verifying API calls happen at 30-second intervals.
  Testable: yes - property

5.12-5.13. Loading and error states
  Thoughts: These are testing loading and error handling. We can test this by simulating loading and error states and verifying the UI responds correctly.
  Testable: yes - property

#### Requirement 6: Capital Sandbox Status Display

6.1-6.3. Display of sandbox data (balance, claim status, ETH allocation)
  Thoughts: These are testing that specific data is displayed. We can test this by providing sandbox data and verifying the UI displays it correctly.
  Testable: yes - property

6.4. WHEN capital is unclaimed, THE System SHALL display a "Claim Capital" button
  Thoughts: This is testing that a button is displayed based on state. We can test this by providing unclaimed capital data and verifying the button is shown.
  Testable: yes - property

6.5-6.7. Claim transaction handling
  Thoughts: These are testing transaction submission and state updates. We can test this by simulating transaction submission and verifying the UI updates correctly.
  Testable: yes - property

6.8-6.10. Styling and loading states
  Thoughts: These are testing UI rendering and loading states. We can test this by rendering the component and verifying the styling and loading states are correct.
  Testable: yes - property

#### Requirement 7: Trade Activity History

7.1. WHEN the User views the AgentActivity component, THE System SHALL display a chronological list of all trades executed by the agent
  Thoughts: This is testing that trades are displayed in chronological order. We can test this by providing trade data and verifying it's sorted by timestamp.
  Testable: yes - property

7.2. WHEN trades are displayed, THE System SHALL show for each trade: timestamp, asset pair, amount, direction (buy/sell), execution price, and status
  Thoughts: This is testing that specific fields are displayed for each trade. We can test this by providing trade data and verifying all fields are shown.
  Testable: yes - property

7.3-7.5. Status indicators for trades (pending, confirmed, failed)
  Thoughts: These are testing that status indicators are displayed correctly. We can test this by providing trades with different statuses and verifying the correct indicators are shown.
  Testable: yes - property

7.6. WHEN the User clicks on a trade row, THE System SHALL display detailed information including gas used, slippage, and validation artifacts
  Thoughts: This is testing that clicking a row expands to show details. We can test this by clicking a row and verifying the details are displayed.
  Testable: yes - property

7.7. WHEN the User clicks a transaction hash, THE System SHALL open the transaction in a block explorer
  Thoughts: This is testing that a link opens in a block explorer. We can test this by clicking the link and verifying the correct URL is opened.
  Testable: yes - property

7.8. THE AgentActivity component SHALL support pagination or infinite scroll for large trade histories
  Thoughts: This is testing pagination/infinite scroll functionality. We can test this by providing many trades and verifying pagination/infinite scroll works correctly.
  Testable: yes - property

7.9-7.10. Loading, error, and update states
  Thoughts: These are testing loading, error, and update handling. We can test this by simulating these states and verifying the UI responds correctly.
  Testable: yes - property

#### Requirement 8: Agent Dashboard Main Layout

8.1. WHEN the User navigates to /agent route, THE System SHALL render the AgentDashboard component as the main layout
  Thoughts: This is testing that the correct component is rendered at a specific route. We can test this by navigating to the route and verifying the component is rendered.
  Testable: yes - example

8.2. WHEN the AgentDashboard loads, THE System SHALL display all eight sub-components in a responsive grid layout
  Thoughts: This is testing that all sub-components are rendered in a grid. We can test this by rendering the dashboard and verifying all 8 components are present.
  Testable: yes - property

8.3. WHEN the User is not connected to a Wallet, THE System SHALL display a wallet connection prompt covering the entire dashboard
  Thoughts: This is testing that a prompt is shown when no wallet is connected. We can test this by rendering without a wallet and verifying the prompt is shown.
  Testable: yes - example

8.4. WHEN the User connects a Wallet, THE System SHALL load and display all agent data
  Thoughts: This is testing that data is loaded when a wallet is connected. We can test this by connecting a wallet and verifying data is loaded.
  Testable: yes - property

8.5-8.6. Responsive layout on different devices
  Thoughts: These are testing responsive layout. We can test this by rendering at different viewport sizes and verifying the layout changes correctly.
  Testable: yes - property

8.7. THE AgentDashboard component SHALL maintain consistent spacing and padding with existing EarnButton components
  Thoughts: This is testing visual consistency. This is not easily testable without visual regression testing.
  Testable: no

8.8. THE System SHALL display a loading state while fetching initial agent data
  Thoughts: This is testing that a loading state is shown. We can test this by rendering the component while data is loading and verifying the loading state is shown.
  Testable: yes - property

8.9. WHEN any sub-component fails to load, THE System SHALL display an error state for that component only, not the entire dashboard
  Thoughts: This is testing that component-level errors don't affect the entire dashboard. We can test this by simulating a component error and verifying other components still render.
  Testable: yes - property

8.10. THE System SHALL include a header with "Agent Dashboard" title and agent address
  Thoughts: This is testing that a header is rendered with specific content. We can test this by rendering the component and verifying the header is present.
  Testable: yes - example

#### Requirement 9: Navigation Integration

9.1-9.5. Navigation link display and behavior
  Thoughts: These are testing that a navigation link is displayed and works correctly. We can test this by rendering the navigation and verifying the link is present and functional.
  Testable: yes - property

#### Requirement 10: Wallet Integration and State Management

10.1-10.7. Wallet connection, disconnection, and transaction handling
  Thoughts: These are testing wallet integration. We can test this by simulating wallet connections/disconnections and verifying the UI responds correctly.
  Testable: yes - property

#### Requirement 11: API Integration for Agent Operations

11.1-11.8. API endpoint calls and error handling
  Thoughts: These are testing that API calls are made to correct endpoints with correct data. We can test this by mocking the API and verifying calls are made correctly.
  Testable: yes - property

#### Requirement 12: Design System Consistency

12.1-12.9. Design system consistency
  Thoughts: These are testing visual consistency. Most are not easily testable without visual regression testing.
  Testable: no

#### Requirement 13: Type Safety and Code Organization

13.1-13.7. TypeScript types and file organization
  Thoughts: These are testing code organization and type safety. We can test this by checking that types are defined correctly and files are organized as specified.
  Testable: yes - property

#### Requirement 14: Error Handling and User Feedback

14.1-14.8. Error messages and user feedback
  Thoughts: These are testing that appropriate messages are displayed. We can test this by simulating errors and verifying the correct messages are shown.
  Testable: yes - property

#### Requirement 15: Performance and Loading States

15.1-15.7. Loading states, caching, and pagination
  Thoughts: These are testing loading states and performance features. We can test this by simulating loading and verifying the UI responds correctly.
  Testable: yes - property

#### Requirement 16: Responsive Design

16.1-16.7. Responsive layout at different breakpoints
  Thoughts: These are testing responsive layout. We can test this by rendering at different viewport sizes and verifying the layout changes correctly.
  Testable: yes - property

#### Requirement 17: Data Validation and Security

17.1-17.8. Input validation and security
  Thoughts: These are testing input validation and security. We can test this by providing various inputs and verifying validation works correctly.
  Testable: yes - property

#### Requirement 18: Integration with Library Services

18.1-18.7. Library service integration
  Thoughts: These are testing that library services are called correctly. We can test this by mocking the services and verifying they're called with correct parameters.
  Testable: yes - property

#### Requirement 19: Parser and Serializer for Trade Intent

19.1. WHEN a TradeIntent object is created, THE System SHALL serialize it to JSON format
  Thoughts: This is testing serialization. We can test this by creating a TradeIntent and verifying it serializes to valid JSON.
  Testable: yes - property

19.2. WHEN JSON trade intent data is received from the API, THE System SHALL parse it into a TradeIntent object
  Thoughts: This is testing deserialization. We can test this by providing JSON and verifying it parses to a TradeIntent object.
  Testable: yes - property

19.3. WHEN a TradeIntent is serialized then parsed, THE System SHALL produce an equivalent object (round-trip property)
  Thoughts: This is testing round-trip serialization. We can test this by serializing and parsing and verifying the result equals the original.
  Testable: yes - property

19.4. WHEN invalid JSON is provided, THE System SHALL return a descriptive error message
  Thoughts: This is testing error handling for invalid JSON. We can test this by providing invalid JSON and verifying an error is returned.
  Testable: yes - property

19.5-19.6. Pretty printer and round-trip parsing
  Thoughts: These are testing pretty printing and round-trip parsing. We can test this by printing and parsing and verifying the result equals the original.
  Testable: yes - property

#### Requirement 20: Validation Artifact Parser and Serializer

20.1-20.7. Serialization, deserialization, and validation of ValidationArtifact
  Thoughts: These are testing serialization/deserialization and validation. We can test this by creating artifacts, serializing, parsing, and verifying correctness.
  Testable: yes - property



### Property Reflection

After analyzing all acceptance criteria, I've identified the following testable properties. Several criteria are redundant or focus on visual/organizational aspects that aren't easily testable as properties. The key testable properties are:

**Consolidated Properties**:
- Agent registration state persistence (combines 1.2, 1.3, 1.4, 1.8)
- Trade intent round-trip serialization (combines 2.4, 2.5, 2.7, 19.3)
- Risk rating polling and updates (combines 3.1, 3.8)
- Reputation score polling and updates (combines 5.1, 5.11)
- Responsive layout at breakpoints (combines 8.5, 8.6, 16.1-16.7)
- Component-level error isolation (combines 8.9, 14.1-14.8)
- Input validation (combines 2.3, 2.11, 17.1-17.8)
- Validation artifact round-trip (combines 20.1-20.7)

---

### Correctness Properties

#### Property 1: Agent Registration State Persistence

*For any* wallet address, when an agent is registered on-chain, navigating away and back to the dashboard should display the same agent identity without requiring re-registration.

**Validates: Requirements 1.2, 1.3, 1.4, 1.8**

#### Property 2: Trade Intent Round-Trip Serialization

*For any* valid TradeIntent object, serializing it to JSON and then parsing it back should produce an equivalent object with identical asset, amount, direction, and timestamp fields.

**Validates: Requirements 2.4, 2.5, 2.7, 19.3**

#### Property 3: Risk Rating Polling Updates

*For any* set of vault addresses, the RiskRouter component should fetch updated risk ratings at 60-second intervals, and each update should reflect the latest Credora risk data.

**Validates: Requirements 3.1, 3.8**

#### Property 4: Reputation Score Polling Updates

*For any* agent ID, the ReputationScore component should fetch updated metrics at 30-second intervals, and each update should reflect the latest ERC-8004 registry data.

**Validates: Requirements 5.1, 5.11**

#### Property 5: Responsive Grid Layout

*For any* viewport width, the AgentDashboard should render components in the correct grid layout: 1 column on mobile (<640px), 2 columns on tablet (640-1024px), and 3 columns on desktop (>1024px).

**Validates: Requirements 8.5, 8.6, 16.1-16.7**

#### Property 6: Component-Level Error Isolation

*For any* sub-component failure, the AgentDashboard should display an error state for that component only, while all other components continue to render and function normally.

**Validates: Requirements 8.9, 14.1-14.8**

#### Property 7: Trade Amount Input Validation

*For any* amount input, the TradeIntent form should reject non-positive numbers and display validation feedback, while accepting positive numbers without error.

**Validates: Requirements 2.3, 2.11, 17.1-17.8**

#### Property 8: Validation Artifact Round-Trip Serialization

*For any* valid ValidationArtifact object, serializing it to JSON and then parsing it back should produce an equivalent object with identical TEE hash, EigenAI signature, and RedStone proof fields.

**Validates: Requirements 4.1-4.4, 20.1-20.7**

#### Property 9: Risk Status Color Coding

*For any* risk rating, the RiskRouter component should display the correct status color: green for low risk, amber for medium risk, and red for high risk.

**Validates: Requirements 3.3-3.6**

#### Property 10: Reputation Metric Color Coding

*For any* reputation metrics, the ReputationScore component should display the correct color for each metric based on thresholds: Sharpe ratio (green >1.0, amber 0.5-1.0, red <0.5), drawdown (green <10%, amber 10-25%, red >25%), validation score (green >95%, amber 80-95%, red <80%).

**Validates: Requirements 5.5-5.10**

#### Property 11: Trade History Chronological Ordering

*For any* set of trades, the AgentActivity component should display them in reverse chronological order (newest first) based on timestamp.

**Validates: Requirements 7.1**

#### Property 12: Wallet Connection State Synchronization

*For any* wallet connection state change, the AgentDashboard should update all components to reflect the new wallet address, and clear all agent data when disconnected.

**Validates: Requirements 10.1-10.7**

#### Property 13: API Error Handling and Retry

*For any* API request failure, the system should display an error message and provide a retry button that re-attempts the request with the same parameters.

**Validates: Requirements 11.1-11.8, 14.1-14.8**

#### Property 14: Sandbox Capital Claim State Transition

*For any* unclaimed sandbox capital, clicking "Claim Capital" should submit a transaction, and upon confirmation, the UI should transition to "claimed" state and disable the claim button.

**Validates: Requirements 6.4-6.7**

#### Property 15: Trade Intent Form Preview Accuracy

*For any* filled trade intent form, the preview should display the exact asset, amount, direction, and timestamp that will be signed, matching the form inputs exactly.

**Validates: Requirements 2.10**

---

## Testing Strategy

### Dual Testing Approach

The Agent Dashboard requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** (specific examples and edge cases):
- Agent registration with valid/invalid agent names
- Trade intent form submission with boundary amounts (0, max balance, negative)
- Risk rating display with different risk levels
- Reputation score color coding at threshold boundaries
- Wallet connection/disconnection flows
- API error responses (network errors, validation errors, timeouts)
- Component rendering with missing data
- Responsive layout at specific breakpoints (320px, 640px, 1024px, 1280px)

**Property-Based Tests** (universal properties across all inputs):
- Trade intent serialization round-trip with random valid intents
- Validation artifact serialization round-trip with random artifacts
- Risk rating polling at 60-second intervals with random vault data
- Reputation score polling at 30-second intervals with random metrics
- Responsive grid layout at random viewport widths
- Component error isolation with random component failures
- Trade amount validation with random positive/negative/zero amounts
- Risk status color coding with random risk levels
- Reputation metric color coding with random metric values
- Trade history ordering with random trade timestamps
- Wallet state synchronization with random wallet addresses
- API retry logic with random failure scenarios
- Sandbox capital claim state transitions with random initial states
- Trade intent preview accuracy with random form inputs

### Property-Based Testing Configuration

**Library**: Use `fast-check` for JavaScript/TypeScript property-based testing

**Test Structure**:
```typescript
import fc from 'fast-check'

describe('Agent Dashboard Properties', () => {
  test('Property 1: Agent Registration State Persistence', () => {
    fc.assert(
      fc.property(fc.hexaString({ minLength: 40, maxLength: 40 }), (walletAddress) => {
        // Test implementation
        // Feature: agent-dashboard, Property 1: Agent Registration State Persistence
      }),
      { numRuns: 100 }
    )
  })
})
```

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with comment: `// Feature: agent-dashboard, Property {number}: {property_text}`
- Timeout: 30 seconds per test
- Seed: Use fixed seed for reproducibility during development

### Unit Test Examples

**Agent Identity Registration**:
```typescript
test('displays register button when no agent is registered', () => {
  render(<AgentIdentity walletAddress={mockAddress} />)
  expect(screen.getByText('Register Agent')).toBeInTheDocument()
})

test('displays agent details in read-only mode when registered', () => {
  render(<AgentIdentity walletAddress={mockAddress} agentData={mockAgent} />)
  expect(screen.getByText(mockAgent.name)).toBeInTheDocument()
  expect(screen.queryByText('Register Agent')).not.toBeInTheDocument()
})
```

**Trade Intent Form Validation**:
```typescript
test('rejects negative amounts', () => {
  render(<TradeIntent walletAddress={mockAddress} />)
  const amountInput = screen.getByLabelText('Amount')
  fireEvent.change(amountInput, { target: { value: '-100' } })
  expect(screen.getByText('Amount must be positive')).toBeInTheDocument()
})

test('accepts positive amounts', () => {
  render(<TradeIntent walletAddress={mockAddress} />)
  const amountInput = screen.getByLabelText('Amount')
  fireEvent.change(amountInput, { target: { value: '100' } })
  expect(screen.queryByText('Amount must be positive')).not.toBeInTheDocument()
})
```

**Responsive Layout**:
```typescript
test('renders single column on mobile', () => {
  window.innerWidth = 320
  render(<AgentDashboard />)
  const grid = screen.getByRole('main').querySelector('.grid')
  expect(grid).toHaveClass('grid-cols-1')
})

test('renders 2 columns on tablet', () => {
  window.innerWidth = 768
  render(<AgentDashboard />)
  const grid = screen.getByRole('main').querySelector('.grid')
  expect(grid).toHaveClass('sm:grid-cols-2')
})

test('renders 3 columns on desktop', () => {
  window.innerWidth = 1280
  render(<AgentDashboard />)
  const grid = screen.getByRole('main').querySelector('.grid')
  expect(grid).toHaveClass('lg:grid-cols-3')
})
```

### Test Coverage Goals

- **Statements**: >80% coverage
- **Branches**: >75% coverage (especially error paths)
- **Functions**: >85% coverage
- **Lines**: >80% coverage

### Testing Tools

- **Unit Testing**: Jest + React Testing Library
- **Property-Based Testing**: fast-check
- **Mocking**: jest.mock() for API calls and blockchain interactions
- **E2E Testing**: Playwright (optional, for critical user flows)

---

## Summary

The Agent Dashboard design provides a comprehensive, type-safe interface for autonomous agents to manage their trading operations. Key design decisions include:

1. **Component-Based Architecture**: Eight focused components that can be tested and maintained independently
2. **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints
3. **Real-Time Updates**: Polling-based data refresh at appropriate intervals
4. **Error Isolation**: Component-level error boundaries prevent cascading failures
5. **Type Safety**: Shared type definitions in `types/agent.ts` ensure consistency
6. **Design System Consistency**: Reuses existing EarnButton components and styling patterns
7. **Comprehensive Testing**: Dual approach with unit tests for examples and property-based tests for universal properties

The design integrates seamlessly with existing infrastructure (wagmi, RainbowKit, EarnButton components) while providing the specialized functionality needed for agent trading operations.

