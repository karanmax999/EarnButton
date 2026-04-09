# Implementation Plan: Agent Dashboard

## Overview

This implementation plan breaks down the Agent Dashboard feature into sequential, testable tasks. The approach follows a logical dependency order: shared types first, then library services, then components and API routes in dependency order, with testing integrated throughout.

The implementation uses TypeScript with React components, integrating with existing wagmi/RainbowKit wallet infrastructure and EarnButton design system. All 15 correctness properties are validated through property-based tests using fast-check.

---

## Tasks

- [x] 1. Set up project structure and shared types
  - Create `types/agent.ts` with all agent-related type definitions
  - Create `lib/agent/` directory structure
  - Create `components/agent/` directory structure
  - Create `app/agent/` directory structure
  - Export types from `types/index.ts`
  - _Requirements: 13.1-13.7_

- [x] 2. Implement library services - Part 1: Core utilities
  - [x] 2.1 Create `lib/agent/tradeIntent.ts` with serialization/parsing
    - Implement `createTradeIntent()` function
    - Implement `serializeTradeIntent()` for JSON serialization
    - Implement `parseTradeIntent()` for JSON deserialization
    - Implement `prettyPrintTradeIntent()` for display formatting
    - _Requirements: 19.1-19.6, 2.4_
  
  - [ ]* 2.2 Write property test for TradeIntent serialization
    - **Property 2: Trade Intent Round-Trip Serialization**
    - **Validates: Requirements 2.4, 2.5, 2.7, 19.3**
  
  - [x] 2.3 Create `lib/agent/validationArtifact.ts` with serialization/parsing
    - Implement `serializeValidationArtifact()` for JSON serialization
    - Implement `parseValidationArtifact()` for JSON deserialization
    - Implement `prettyPrintValidationArtifact()` for display formatting
    - Implement `validateArtifactCompleteness()` to check required fields
    - _Requirements: 20.1-20.7, 4.1-4.4_
  
  - [ ]* 2.4 Write property test for ValidationArtifact serialization
    - **Property 8: Validation Artifact Round-Trip Serialization**
    - **Validates: Requirements 4.1-4.4, 20.1-20.7**

- [x] 3. Implement library services - Part 2: Blockchain interactions
  - [x] 3.1 Create `lib/agent/erc8004.ts` for reputation registry
    - Implement `fetchReputationMetrics(agentId: string)` to query ERC-8004 registry
    - Implement `subscribeToReputationUpdates()` for polling at 30-second intervals
    - Handle errors and return null on failure
    - _Requirements: 5.1, 5.11, 18.1_
  
  - [ ]* 3.2 Write property test for reputation polling
    - **Property 4: Reputation Score Polling Updates**
    - **Validates: Requirements 5.1, 5.11**
  
  - [x] 3.2 Create `lib/agent/credora.ts` for risk ratings
    - Implement `fetchRiskRatings(vaultAddresses: string[])` to query Credora API
    - Implement `subscribeToRiskUpdates()` for polling at 60-second intervals
    - Map risk levels to color codes (low/medium/high)
    - _Requirements: 3.1, 3.8, 18.4_
  
  - [ ]* 3.3 Write property test for risk rating polling
    - **Property 3: Risk Rating Polling Updates**
    - **Validates: Requirements 3.1, 3.8**
  
  - [x] 3.4 Create `lib/agent/redstone.ts` for price feeds
    - Implement `fetchPriceProof(asset: string)` to get RedStone price proof
    - Implement `verifyPriceProof(proof: string)` to validate proof
    - _Requirements: 2.6, 18.5_
  
  - [x] 3.5 Create `lib/agent/eigencloud.ts` for TEE attestations
    - Implement `fetchValidationArtifacts(agentId: string)` to get artifacts
    - Implement `recordValidationArtifacts(artifacts: ValidationArtifact)` to record on-chain
    - _Requirements: 4.5, 18.5_

- [x] 4. Implement service layer - Agent operations
  - [x] 4.1 Create `lib/agent/agentService.ts`
    - Implement `registerAgent(name: string, walletAddress: string)` to call `/api/agent/register`
    - Implement `fetchAgentIdentity(walletAddress: string)` to query blockchain for ERC-721
    - Implement `pollAgentRegistration(walletAddress: string)` to wait for confirmation
    - _Requirements: 1.2, 1.3, 1.4, 1.8, 11.1_
  
  - [ ]* 4.2 Write property test for agent registration persistence
    - **Property 1: Agent Registration State Persistence**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.8**
  
  - [x] 4.3 Create `lib/agent/tradeService.ts`
    - Implement `submitTrade(intent: TradeIntent, priceProof: string)` to call `/api/agent/trade`
    - Implement `fetchTradeHistory(agentId: string, limit: number, offset: number)` to get trades
    - Implement `pollTradeStatus(txHash: string)` to wait for confirmation
    - _Requirements: 2.7, 7.1, 11.2_
  
  - [x] 4.4 Create `lib/agent/sandboxService.ts`
    - Implement `fetchSandboxBalance(walletAddress: string)` to query vault contract
    - Implement `claimCapital(walletAddress: string)` to submit claim transaction
    - Implement `pollClaimStatus(txHash: string)` to wait for confirmation
    - _Requirements: 6.1-6.7, 11.1_
  
  - [ ]* 4.5 Write property test for sandbox capital claim state transition
    - **Property 14: Sandbox Capital Claim State Transition**
    - **Validates: Requirements 6.4-6.7**

- [x] 5. Implement API routes
  - [x] 5.1 Create `app/agent/route.ts` for main dashboard page
    - Set up Next.js route handler for `/agent` path
    - _Requirements: 8.1_
  
  - [x] 5.2 Create `app/api/agent/register/route.ts`
    - Implement POST handler for agent registration
    - Validate agentURI parameter
    - Call ERC-721 contract via wallet
    - Return AgentRegisterResponse
    - _Requirements: 1.2, 11.1_
  
  - [x] 5.3 Create `app/api/agent/trade/route.ts`
    - Implement POST handler for trade submission
    - Validate signed intent and price proof
    - Record trade on-chain
    - Return TradeSubmitResponse
    - _Requirements: 2.7, 11.2_
  
  - [x] 5.4 Create `app/api/agent/validate/route.ts`
    - Implement POST handler for validation artifact recording
    - Validate artifact data completeness
    - Call ValidationRegistry contract
    - Return ValidationRecordResponse
    - _Requirements: 4.5, 11.3_
  
  - [x] 5.5 Create `app/api/agent/reputation/route.ts`
    - Implement GET handler for reputation data
    - Query ERC-8004 registry
    - Return ReputationResponse
    - _Requirements: 5.1, 11.4_

- [ ] 6. Implement React components - Part 1: Simple display components
  - [ ] 6.1 Create `components/agent/AgentIdentity.tsx`
    - Display agent name, ID, wallet address, capabilities
    - Show register button when unregistered
    - Show read-only mode when registered
    - Handle registration transaction flow
    - _Requirements: 1.1-1.8, 12.1-12.9_
  
  - [ ]* 6.2 Write unit tests for AgentIdentity
    - Test unregistered state displays register button
    - Test registered state displays read-only details
    - Test wallet disconnection shows prompt
    - _Requirements: 1.1, 1.5, 1.6_
  
  - [ ] 6.3 Create `components/agent/ReputationScore.tsx`
    - Fetch and display Sharpe ratio, drawdown, validation score
    - Color-code metrics based on thresholds
    - Poll every 30 seconds for updates
    - _Requirements: 5.1-5.13, 12.1-12.9_
  
  - [ ]* 6.4 Write property test for reputation metric color coding
    - **Property 10: Reputation Metric Color Coding**
    - **Validates: Requirements 5.5-5.10**
  
  - [ ] 6.5 Create `components/agent/RiskRouter.tsx`
    - Display risk ratings in table format
    - Color-code status (low/medium/high)
    - Poll every 60 seconds for updates
    - Show tooltips on hover
    - _Requirements: 3.1-3.9, 12.1-12.9_
  
  - [ ]* 6.6 Write property test for risk status color coding
    - **Property 9: Risk Status Color Coding**
    - **Validates: Requirements 3.3-3.6**
  
  - [ ] 6.7 Create `components/agent/CapitalSandbox.tsx`
    - Display sandbox balance, claim status, ETH allocation
    - Show "Claim Capital" button when unclaimed
    - Handle claim transaction flow
    - _Requirements: 6.1-6.10, 12.1-12.9_

- [ ] 7. Implement React components - Part 2: Form and interaction components
  - [ ] 7.1 Create `components/agent/TradeIntent.tsx`
    - Display form with asset dropdown, amount input, direction toggle
    - Validate amount input (positive number, within limits)
    - Show preview of data being signed
    - Handle EIP-712 signing flow
    - Attach RedStone price proof
    - Submit to `/api/agent/trade`
    - _Requirements: 2.1-2.11, 12.1-12.9_
  
  - [ ]* 7.2 Write property test for trade amount input validation
    - **Property 7: Trade Amount Input Validation**
    - **Validates: Requirements 2.3, 2.11, 17.1-17.8**
  
  - [ ]* 7.3 Write property test for trade intent form preview accuracy
    - **Property 15: Trade Intent Form Preview Accuracy**
    - **Validates: Requirements 2.10**
  
  - [ ] 7.4 Create `components/agent/ValidationArtifact.tsx`
    - Display three sections: TEE Attestation, EigenAI Inference, RedStone Price Proof
    - Show artifact hashes with copy-to-clipboard
    - Handle "Record Validation" transaction flow
    - _Requirements: 4.1-4.10, 12.1-12.9_
  
  - [ ]* 7.5 Write unit tests for ValidationArtifact
    - Test artifact sections are displayed
    - Test copy-to-clipboard functionality
    - Test recording transaction flow
    - _Requirements: 4.1-4.4_

- [ ] 8. Implement React components - Part 3: Data display and activity components
  - [ ] 8.1 Create `components/agent/AgentActivity.tsx`
    - Display chronological trade history (newest first)
    - Show timestamp, asset pair, amount, direction, price, status
    - Support expandable details (gas, slippage, artifacts)
    - Support pagination or infinite scroll
    - Poll every 10 seconds for new trades
    - _Requirements: 7.1-7.10, 12.1-12.9_
  
  - [ ]* 8.2 Write property test for trade history chronological ordering
    - **Property 11: Trade History Chronological Ordering**
    - **Validates: Requirements 7.1**
  
  - [ ]* 8.3 Write unit tests for AgentActivity
    - Test trades are sorted by timestamp (newest first)
    - Test expandable details show correct information
    - Test pagination works correctly
    - _Requirements: 7.1-7.2_

- [ ] 9. Implement main dashboard component
  - [ ] 9.1 Create `components/agent/AgentDashboard.tsx`
    - Check wallet connection via wagmi
    - Display wallet connection prompt if not connected
    - Render responsive grid layout (1/2/3 columns)
    - Wrap each component in ErrorBoundary
    - Display loading state while fetching initial data
    - _Requirements: 8.1-8.10, 12.1-12.9_
  
  - [ ]* 9.2 Write property test for responsive grid layout
    - **Property 5: Responsive Grid Layout**
    - **Validates: Requirements 8.5, 8.6, 16.1-16.7**
  
  - [ ]* 9.3 Write property test for component-level error isolation
    - **Property 6: Component-Level Error Isolation**
    - **Validates: Requirements 8.9, 14.1-14.8**
  
  - [ ]* 9.4 Write unit tests for AgentDashboard
    - Test wallet connection prompt displays when disconnected
    - Test all 8 components render when connected
    - Test loading state displays initially
    - Test component errors don't affect other components
    - _Requirements: 8.1-8.10_

- [ ] 10. Implement wallet integration and state management
  - [ ] 10.1 Create `lib/agent/walletHooks.ts`
    - Implement `useAgentWallet()` hook to access wallet state
    - Implement `useAgentData()` hook to fetch and cache agent data
    - Implement `useWalletGuard()` hook to check wallet connection
    - _Requirements: 10.1-10.7_
  
  - [ ]* 10.2 Write property test for wallet connection state synchronization
    - **Property 12: Wallet Connection State Synchronization**
    - **Validates: Requirements 10.1-10.7**

- [ ] 11. Implement error handling and API integration
  - [ ] 11.1 Create `lib/agent/apiClient.ts`
    - Implement fetch wrapper with error handling
    - Implement retry logic with exponential backoff
    - Implement timeout handling
    - _Requirements: 11.1-11.8, 14.1-14.8_
  
  - [ ]* 11.2 Write property test for API error handling and retry
    - **Property 13: API Error Handling and Retry**
    - **Validates: Requirements 11.1-11.8, 14.1-14.8**
  
  - [ ] 11.3 Create `components/agent/ErrorBoundary.tsx`
    - Catch component errors
    - Display error state with retry button
    - Log errors for debugging
    - _Requirements: 14.1-14.8_

- [ ] 12. Implement navigation integration
  - [ ] 12.1 Update `app/layout.tsx`
    - Add "Agent" link to main navigation
    - Show link only when wallet is connected
    - Highlight link as active when on `/agent` route
    - _Requirements: 9.1-9.5_
  
  - [ ]* 12.2 Write unit tests for navigation
    - Test "Agent" link displays when wallet connected
    - Test "Agent" link hidden when wallet disconnected
    - Test link navigates to `/agent` route
    - Test link is highlighted as active on `/agent` route
    - _Requirements: 9.1-9.5_

- [ ] 13. Implement data validation and security
  - [ ] 13.1 Create `lib/agent/validation.ts`
    - Implement `validateEthereumAddress(address: string)` function
    - Implement `validatePositiveNumber(value: string | number)` function
    - Implement `validateAssetSupported(asset: string)` function
    - Implement `validateTradeIntentComplete(intent: TradeIntent)` function
    - _Requirements: 17.1-17.8_
  
  - [ ]* 13.2 Write unit tests for validation functions
    - Test valid Ethereum addresses pass validation
    - Test invalid addresses fail validation
    - Test positive numbers pass validation
    - Test non-positive numbers fail validation
    - _Requirements: 17.1-17.8_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass
  - Ensure no TypeScript compilation errors
  - Ensure all components render without errors
  - Ensure all API routes respond correctly
  - Ensure all library services work correctly
  - Ensure all 15 correctness properties are validated
  - Ask the user if questions arise.

- [ ] 15. Implement responsive design and styling
  - [ ] 15.1 Apply Tailwind CSS responsive classes to all components
    - Mobile-first approach with sm/md/lg breakpoints
    - Ensure minimum 44px touch targets on mobile
    - Test layout at 320px, 640px, 1024px, 1280px viewports
    - _Requirements: 16.1-16.7, 12.1-12.9_
  
  - [ ]* 15.2 Write unit tests for responsive layout
    - Test single column on mobile (<640px)
    - Test 2 columns on tablet (640-1024px)
    - Test 3 columns on desktop (>1024px)
    - _Requirements: 16.1-16.7_

- [ ] 16. Implement loading states and skeleton loaders
  - [ ] 16.1 Create `components/agent/AgentSkeleton.tsx`
    - Implement skeleton loaders for each component
    - Use existing `Skeleton` component from `components/ui/Skeleton.tsx`
    - _Requirements: 15.1-15.7_
  
  - [ ] 16.2 Integrate skeleton loaders into all components
    - Show skeletons while data is loading
    - Replace with actual content when data arrives
    - _Requirements: 15.1-15.7_

- [ ] 17. Implement caching and performance optimization
  - [ ] 17.1 Add data caching to service layer
    - Cache agent identity for the session
    - Cache reputation scores for 30 seconds
    - Cache risk ratings for 60 seconds
    - Cache trade history with pagination
    - _Requirements: 15.4-15.5_
  
  - [ ] 17.2 Implement lazy loading for trade history
    - Load trades in batches of 10
    - Load more on scroll or pagination
    - _Requirements: 15.6-15.7_

- [ ] 18. Final checkpoint - Ensure all tests pass and integration complete
  - Ensure all unit tests pass
  - Ensure all property-based tests pass
  - Ensure no TypeScript compilation errors
  - Ensure all components render correctly
  - Ensure all API routes work correctly
  - Ensure responsive design works at all breakpoints
  - Ensure loading states display correctly
  - Ensure error handling works correctly
  - Ensure all 15 correctness properties are validated
  - Ensure all requirements are met
  - Ask the user if questions arise.

- [ ] 19. Integration testing
  - [ ] 19.1 Write end-to-end test for agent registration flow
    - Connect wallet → Register agent → Verify registration
    - _Requirements: 1.1-1.8_
  
  - [ ] 19.2 Write end-to-end test for trade submission flow
    - Connect wallet → Fill trade form → Sign intent → Submit trade → Verify submission
    - _Requirements: 2.1-2.11_
  
  - [ ] 19.3 Write end-to-end test for validation artifact recording
    - Connect wallet → View artifacts → Record validation → Verify recording
    - _Requirements: 4.1-4.10_
  
  - [ ] 19.4 Write end-to-end test for sandbox capital claim
    - Connect wallet → View sandbox → Claim capital → Verify claim
    - _Requirements: 6.1-6.10_

- [ ] 20. Documentation and code cleanup
  - [ ] 20.1 Add JSDoc comments to all exported functions and components
    - Document parameters, return types, and usage examples
    - _Requirements: 13.1-13.7_
  
  - [ ] 20.2 Create README for agent dashboard feature
    - Document component structure
    - Document service layer
    - Document API routes
    - Document testing approach
    - _Requirements: 13.1-13.7_
  
  - [ ] 20.3 Ensure all code follows project conventions
    - Consistent naming conventions
    - Consistent file organization
    - Consistent error handling patterns
    - _Requirements: 13.1-13.7_

---

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Checkpoints at tasks 14 and 18 ensure incremental validation
- All 15 correctness properties are covered by property-based tests
- Components are implemented in dependency order to minimize blocking
- API routes are implemented alongside components for parallel development
- Responsive design is implemented throughout, not as a separate phase
- Error handling is integrated into each component and service
