# swap-integration

> **Plugin:** [`pancakeswap-trading`](/plugins/pancakeswap-trading) · **Model:** Opus · **Version:** 1.1.0

Integrate PancakeSwap swaps into frontends, backends, and smart contracts.

## Quick Decision Guide

| Building... | Use This Method |
|-------------|-----------------|
| Quick quote or prototype | PancakeSwap Routing API (Method 1) |
| Frontend with React/Next.js | Smart Router SDK + Universal Router (Method 2) |
| Backend script or trading bot | Smart Router SDK + Universal Router (Method 2) |
| Simple V2 swap, smart contract | Direct V2 Router contract calls (Method 3) |

## Method 1: Routing API

The simplest approach — send HTTP requests to PancakeSwap's hosted routing service.

```typescript
const response = await fetch(
  'https://router-api.pancakeswap.com/v0/quote?' +
  new URLSearchParams({
    chainId: '56',
    currencyIn: '0x55d398326f99059fF775485246999027B3197955', // USDT
    currencyOut: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', // CAKE
    amount: '1000000000000000000', // 1 USDT in wei
    tradeType: 'EXACT_INPUT',
  })
)
```

**Pros:** No SDK needed, works from any language.
**Cons:** Rate-limited, less control over routing.

## Method 2: Smart Router SDK

The recommended approach for production applications.

```typescript
import { SmartRouter } from '@pancakeswap/smart-router'
import { CurrencyAmount, TradeType, Token, Percent } from '@pancakeswap/sdk'

const USDT = new Token(56, '0x55d398326f99059fF775485246999027B3197955', 18, 'USDT')
const CAKE = new Token(56, '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', 18, 'CAKE')

const amount = CurrencyAmount.fromRawAmount(USDT, 1000000000000000000n)

const trade = await SmartRouter.getBestTrade(amount, CAKE, TradeType.EXACT_INPUT, {
  gasPriceWei: await publicClient.getGasPrice(),
  maxHops: 3,
  maxSplits: 3,
})
```

**Key packages:**
- `@pancakeswap/smart-router` — route finding
- `@pancakeswap/universal-router-sdk` — calldata encoding
- `@pancakeswap/sdk` — token/amount types
- `@pancakeswap/v3-sdk` — V3 pool math
- `@pancakeswap/permit2-sdk` — gasless approvals

## Method 3: Direct V2 Router

For simple swaps on BSC via the V2 Router contract.

```typescript
const V2_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E'

const tx = await walletClient.writeContract({
  address: V2_ROUTER,
  abi: pancakeV2RouterABI,
  functionName: 'swapExactTokensForTokens',
  args: [amountIn, amountOutMin, path, to, deadline],
})
```

## Supported Protocols

| Protocol | Description | Fee Tiers | Chains |
|----------|-------------|-----------|--------|
| V2 | Classic AMM (xy=k) | 0.25% | BSC only |
| V3 | Concentrated liquidity | 0.01%, 0.05%, 0.25%, 1% | All chains |
| StableSwap | Optimized for stable pairs | ~0.04% | BSC only |

## Full Reference

The complete skill file (800+ lines) includes:

- All contract addresses per chain
- Permit2 approval workflows
- Slippage protection patterns
- Multi-hop routing strategies
- Gas optimization tips
- Error handling and recovery
- Anti-patterns and common mistakes

See the [source SKILL.md](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-trading/skills/swap-integration/SKILL.md) for the full reference.
