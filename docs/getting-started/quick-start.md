# Quick Start

This guide walks you through using PancakeSwap AI to plan a swap and liquidity position in under 5 minutes.

## 1. Plan the Swap

Ask your agent:

```
Swap 0.1 BNB for USDT on PancakeSwap
```

The agent loads the **swap-planner** skill and generates a deep link:

```
https://pancakeswap.finance/swap?chain=bsc&inputCurrency=BNB&outputCurrency=0x55d398326f99059fF775485246999027B3197955
```

Click the link to verify the swap parameters in the PancakeSwap UI.

## 2. Plan Liquidity

Ask your agent:

```
Plan a USDT/WBNB V3 LP position on BSC with moderate risk
```

The agent loads the **liquidity-planner** skill and returns:

- Recommended fee tier (for example, 0.05% or 0.25%)
- Suggested price range based on volatility
- A liquidity deep link to open the position in the UI

## 3. Run Unit Tests

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
- [Farming Planner](/skills/farming-planner) — CAKE staking and farm strategy
