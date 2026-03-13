# pancakeswap-hub

AI-powered assistance for planning and integrating swaps through PCS Hub.

## Metadata

| Field        | Value                                                             |
| ------------ | ----------------------------------------------------------------- |
| **Name**     | `pancakeswap-hub`                                                 |
| **Version**  | 1.8.0                                                             |
| **Author**   | PancakeSwap                                                       |
| **License**  | MIT                                                               |
| **Keywords** | `pancakeswap`, `defi`, `hub`, `portfolio`, `bsc`, `bnb`, `cake`  |

## Skills

### [hub-swap-planner](/skills/hub-swap-planner)

Plan token swaps through PCS Hub — PancakeSwap's aggregator API — and generate a channel-specific handoff link for partner interfaces.

**Capabilities:**

- Optimal route discovery via the PCS Hub API (aggregates multiple DEXs on BSC)
- Route summary with split breakdowns and price impact
- Channel-specific deep links for PancakeSwap, Binance Wallet, Trust Wallet, or headless environments
- Token address lookup and price fetching via DexScreener

### [hub-api-integration](/skills/hub-api-integration)

Design and generate the full integration spec for embedding PCS Hub swap functionality into an external UI — wallet apps, mobile apps, webviews, or headless bots.

**Capabilities:**

- Frontend screen specifications (quote, route, confirmation, success/error)
- Hub API contract documentation (quote and execution endpoints)
- Channel UX differences across distribution interfaces
- Fallback and error-handling logic
- Code snippets for fetching quotes and parsing routing responses

## Installation

::: code-group

```bash [Claude Code]
claude plugin add @pancakeswap/pancakeswap-hub
```

```bash [Manual]
cp -r packages/plugins/pancakeswap-hub/skills/hub-swap-planner/SKILL.md \
  .cursor/skills/hub-swap-planner/SKILL.md
cp -r packages/plugins/pancakeswap-hub/skills/hub-api-integration/SKILL.md \
  .cursor/skills/hub-api-integration/SKILL.md
```

:::

## Quick Example

Ask your agent:

```
Swap 100 USDT for BNB via Trust Wallet using PCS Hub
```

The agent fetches the optimal route from the Hub API and returns a route summary plus a Trust Wallet-specific handoff link:

```
## Route Summary

100 USDT → 0.1842 BNB
Price impact: 0.03%
Route: USDT → BNB (direct, PancakeSwap V3)

Deep link (Trust Wallet):
https://link.trustwallet.com/open_url?coin_id=20000714&url=https%3A%2F%2Fpancakeswap.finance%2F...
```
