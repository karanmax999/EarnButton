# Agent Dashboard

The Agent Dashboard is a feature for managing autonomous on-chain trading agents. It integrates with ERC-721 identity NFTs, Credora risk ratings, RedStone price feeds, EigenCloud TEE attestations, and the ERC-8004 reputation registry.

## Component Structure

All components live in `components/agent/` and are exported from `components/agent/index.ts`.

| Component | Purpose |
|---|---|
| `AgentDashboard` | Root layout — orchestrates all sub-components in a responsive 3-column grid |
| `AgentIdentity` | ERC-721 registration status and registration form |
| `TradeIntent` | Compose, preview, and EIP-712 sign trade orders |
| `RiskRouter` | Credora risk ratings table for vault positions |
| `ValidationArtifact` | Display and record TEE/EigenAI/RedStone proof bundles |
| `ReputationScore` | On-chain ERC-8004 metrics (Sharpe ratio, drawdown, validation score) |
| `CapitalSandbox` | Sandbox vault balance and capital claim flow |
| `AgentActivity` | Paginated trade history with expandable details |
| `AgentSkeleton` | Loading skeletons for each component above |

### Design System

All components follow the dark design system:
- Card background: `#111827`
- Card border: `1px solid rgba(255,255,255,0.06)`
- Border radius: `20px`
- Accent gradient: `linear-gradient(90deg, #6366f1, #8b5cf6)`
- Hover: `translateY(-4px)` with indigo border glow

## Service Layer

Services live in `lib/agent/` and are exported from `lib/agent/index.ts`.

| Service | Purpose |
|---|---|
| `agentService.ts` | Register agents, fetch identity, poll registration confirmation |
| `tradeService.ts` | Submit trades, fetch trade history, poll trade status |
| `sandboxService.ts` | Fetch sandbox balance, claim capital, poll claim status |
| `validationArtifact.ts` | Serialize/parse/validate artifact bundles |
| `tradeIntent.ts` | Create/serialize/parse trade intent objects |
| `erc8004.ts` | Fetch and subscribe to reputation metrics |
| `credora.ts` | Fetch and subscribe to risk ratings |
| `redstone.ts` | Fetch and verify RedStone price proofs |
| `eigencloud.ts` | Fetch and record validation artifacts |
| `apiClient.ts` | Fetch wrapper with retry, timeout, and error handling |
| `validation.ts` | Input validation and sanitization utilities |
| `walletHooks.ts` | React hooks: `useAgentWallet`, `useAgentData`, `useWalletGuard`, `useAgentDataCache` |

## API Routes

All routes live under `app/api/agent/`.

| Route | Method | Purpose |
|---|---|---|
| `/api/agent/register` | POST | Register agent with ERC-721 NFT |
| `/api/agent/trade` | POST | Submit signed trade intent with price proof |
| `/api/agent/validate` | POST | Record validation artifacts on-chain |
| `/api/agent/reputation` | GET | Fetch ERC-8004 reputation metrics by `agentId` |

## Testing Approach

Tests are co-located with source files using the `__tests__/` convention.

- **Unit tests** (`lib/agent/__tests__/`, `components/agent/__tests__/`) — test individual functions and components with mocked dependencies
- **Integration tests** (`lib/agent/__tests__/integration/`) — test end-to-end flows: agent registration, trade submission, sandbox claim, validation artifact recording
- **Component tests** use `@testing-library/react` with `vitest`
- **Service tests** use `vitest` with `vi.fn()` mocks for `fetch`

Run all tests:
```bash
cd EarnButton && npx vitest run
```

Run agent-specific tests:
```bash
cd EarnButton && npx vitest run lib/agent components/agent
```
