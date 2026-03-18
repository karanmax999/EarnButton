# EarnButton — One-tap DeFi Yield on Base

> The smartest savings account in DeFi. Powered by YO Protocol.

## What is EarnButton?

EarnButton makes earning DeFi yield as simple as clicking a button. Connect your wallet, choose a vault, and start earning 5–9% APY on USDC, ETH, BTC, or EUR — automatically.

No lock-ups. No minimums. Withdraw anytime. Non-custodial.

## How YO SDK is Used

- `@yo-protocol/react` — `useVaults()` for live vault discovery (APY, TVL, risk level)
- `@yo-protocol/core` — deposit and redeem flows via the yoGateway contract
- **yoGateway** (`0xF1EeE0957267b1A474323Ff9CfF7719E964969FA`) — single entry point for all deposits and redeems on Base
- **Live vault data** from `api.yo.xyz` — APY, TVL, share price, and protocol allocations (Aave / Morpho / Compound)

## Live Contracts (Base Mainnet)

| Vault  | Address |
|--------|---------|
| yoUSD  | `0x0000000f2eb9f69274678c76222b35eec7588a65` |
| yoETH  | `0x3a43aec53490cb9fa922847385d82fe25d0e9de7` |
| yoBTC  | `0xbcbc8cb4d1e8ed048a6276a5e94a3e952660bcbc` |
| yoEUR  | `0x50c749ae210d3977adc824ae11f3c7fd10c871e9` |
| yoGateway | `0xF1EeE0957267b1A474323Ff9CfF7719E964969FA` |

## Tech Stack

Next.js 14 · TypeScript · wagmi v2 · viem v2 · RainbowKit · `@yo-protocol/react` · `@yo-protocol/core` · TailwindCSS · SWR · Anthropic Claude

## Features

- **4 YO vaults** — yoUSD, yoETH, yoBTC, yoEUR
- **Real deposit + redeem flows** via yoGateway (approve → deposit, 2-step)
- **Real APY and TVL** from YO API with live share price tracking
- **AI vault advisor** powered by Claude — answers DeFi questions in context
- **Interactive yield calculator** — see earnings before connecting
- **Portfolio dashboard** — positions, yield earned, weighted APY, withdraw
- **Transparency panel** — live protocol allocations per vault with Basescan links
- **Non-custodial** — all transactions go directly to Base mainnet contracts
- **Full landing page** — hero, marquee, how-it-works, trust section, CTA

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in: ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```
NEXT_PUBLIC_USE_TESTNET=false
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_YO_GATEWAY_ADDRESS=0xF1EeE0957267b1A474323Ff9CfF7719E964969FA
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
ANTHROPIC_API_KEY=sk-ant-...   # Server-side only, for AI advisor
```

## Judging Criteria Met

| Criterion | Implementation |
|-----------|---------------|
| **UX Simplicity** | One-tap deposit flow, clean dashboard, mobile responsive |
| **Creativity** | AI advisor, yield calculator, animated landing page, marquee |
| **Integration Quality** | Full SDK deposit/redeem via yoGateway, live APY/TVL from API |
| **Risk & Trust** | Transparent allocations, Basescan links, non-custodial, audited protocols only |
