# Quick Start

This guide walks you through using PancakeSwap AI to execute your first swap — from planning to execution — in under 5 minutes.

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

## 2. Generate Swap Code

The agent then loads the **swap-integration** skill and generates TypeScript:

```typescript
import { createPublicClient, createWalletClient, http } from 'viem'
import { bsc } from 'viem/chains'
import { SmartRouter, V3_SUBGRAPH } from '@pancakeswap/smart-router'
import { CurrencyAmount, Token, Percent } from '@pancakeswap/sdk'

const USDT = new Token(56, '0x55d398326f99059fF775485246999027B3197955', 18, 'USDT')
const WBNB = new Token(56, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 18, 'WBNB')

const amount = CurrencyAmount.fromRawAmount(WBNB, 100000000000000000n) // 0.1 BNB

const trade = await SmartRouter.getBestTrade(amount, USDT, TradeType.EXACT_INPUT, {
  gasPriceWei: await publicClient.getGasPrice(),
  maxHops: 3,
  maxSplits: 3,
})
```

## 3. Execute On-Chain

With a testnet wallet configured, the agent executes the swap and reports:

```
✅ Swap executed successfully
   TX Hash: 0xabc...def
   Input:  0.1 BNB
   Output: 57.23 USDT
   Gas:    0.0003 BNB
```

## Run the Agent Demo

Try the full 3-phase agent demo with a BSC testnet wallet:

```bash
# Get testnet BNB from https://testnet.bnbchain.org/faucet-smart
export PRIVATE_KEY=0x<your-testnet-private-key>
node tests/agent-swap-demo.mjs
```

## Run Unit Tests

```bash
npm test
```

## Run LLM Evaluations

```bash
export ANTHROPIC_API_KEY=your-key
npm run test:evals:swap-integration
npm run test:evals:swap-planner
npm run test:evals:liquidity-planner
npm run test:evals:infinity-security
npx promptfoo view  # browse results in the browser
```

## Next Steps

- [Swap Integration Skill](/skills/swap-integration) — full reference for all three integration methods
- [Liquidity Planner](/skills/liquidity-planner) — plan LP positions with APY analysis
- [Infinity Security](/skills/infinity-security-foundations) — build secure Infinity hooks
