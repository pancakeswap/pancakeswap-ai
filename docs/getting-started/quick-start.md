# Quick Start

This guide walks you through using PancakeSwap AI skills in under 5 minutes.

## 1. Plan a Swap

Ask your agent:

```
Swap 0.1 BNB for USDT on PancakeSwap
```

The agent loads the **swap-planner** skill and generates a deep link:

```
https://pancakeswap.finance/swap?chain=bsc&inputCurrency=BNB&outputCurrency=0x55d398326f99059fF775485246999027B3197955
```

Click the link to verify the swap parameters in the PancakeSwap UI.

## 2. Plan a Liquidity Position

Ask your agent:

```
Plan a USDT/WBNB V3 LP position on BSC with moderate risk
```

The agent loads the **liquidity-planner** skill and returns:

- Recommended fee tier (for example, 0.05% or 0.25%)
- Suggested price range based on volatility
- A liquidity deep link to open the position in the UI

## 3. Check and Collect LP Fees

Ask your agent:

```
How much fees have I earned on my V3 positions for wallet 0xabc...?
```

The agent loads the **collect-fees** skill and returns:

- A table of uncollected fees per position (token amounts + USD value)
- Deep links to collect fees for each position on V3, Infinity, or Solana CLMM

## 4. Farm and Stake CAKE

Ask your agent:

```
Show me the best PancakeSwap farms by APR on BSC
```

The agent loads the **farming-planner** skill and returns APR/APY comparison tables with deep links to start farming or staking CAKE in Syrup Pools.

To check pending rewards:

```
How much CAKE do I have pending across all my farms for wallet 0xabc...?
```

The agent loads **harvest-rewards** and returns a rewards summary with harvest deep links.

## 5. Integrate Swaps into Your App

Ask your agent:

```
Show me how to integrate PancakeSwap swaps into my React app using the Smart Router SDK
```

The agent loads the **swap-integration** skill and generates working code, SDK usage guides, and integration specs.

## 6. Swap via PCS Hub

If you're building a partner wallet or distribution channel:

```
Plan a BNB → USDT swap through PCS Hub for Binance Wallet
```

The agent loads the **hub-swap-planner** skill and returns a channel-specific handoff deep link. For embedding the full flow, ask:

```
Generate a PCS Hub integration spec for my wallet app
```

This invokes **hub-api-integration** and produces an API contract and frontend flow document.

## Run Unit Tests

```bash
npm test
```

## Run LLM Evaluations

```bash
export ANTHROPIC_API_KEY=your-key
npm run test:evals:swap-planner
npm run test:evals:liquidity-planner
npm run test:evals:farming-planner
npx promptfoo view  # browse results in the browser
```

## Next Steps

- [Swap Planner](/skills/swap-planner) — token discovery + deep links
- [Liquidity Planner](/skills/liquidity-planner) — LP fee tier/range planning
- [Collect Fees](/skills/collect-fees) — check and collect V3/Infinity/Solana LP fees
- [Farming Planner](/skills/farming-planner) — CAKE staking and farm strategy
- [Harvest Rewards](/skills/harvest-rewards) — check and claim pending farming rewards
- [Swap Integration](/skills/swap-integration) — integrate swaps into your app
- [Hub Swap Planner](/skills/hub-swap-planner) — plan swaps through PCS Hub
- [Hub API Integration](/skills/hub-api-integration) — embed PCS Hub in your frontend
