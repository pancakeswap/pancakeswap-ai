# liquidity-planner

> **Plugin:** [`pancakeswap-driver`](/plugins/pancakeswap-driver) · **Model:** Sonnet · **Version:** 1.0.0

Plan liquidity provision on PancakeSwap with pool assessment, APY analysis, and deep link generation.

## Overview

This skill **does not execute transactions** — it plans liquidity provision. The output is a deep link URL that opens the PancakeSwap position creation interface pre-filled with LP parameters.

## 9-Step Workflow

```
1. Gather Intent       → Which pair? How much? Which chain?
2. Resolve Tokens      → Verify contract addresses on-chain
3. Input Validation    → Check amounts, decimals, pool support
4. Discover Pools      → Find available V2, V3, StableSwap pools
5. Assess Liquidity    → TVL, volume, depth analysis
6. Fetch APY Metrics   → Yield data from DefiLlama
7. Recommend Range     → Price range for concentrated liquidity
8. Select Fee Tier     → Optimal fee tier based on pair type
9. Generate Deep Link  → Pre-filled PancakeSwap LP URL
```

## Pool Types

| Type | Description | Fee | Best For | Chains |
|------|-------------|-----|----------|--------|
| V2 | Classic 50/50 AMM | 0.25% | Simple pairs, low maintenance | BSC only |
| V3 | Concentrated liquidity | 0.01%–1% | Active management, higher yields | All chains |
| StableSwap | Optimized stable curve | ~0.04% | USDT/USDC/BUSD pairs | BSC only |

## Fee Tier Selection

| Fee Tier | Best For | Example Pairs |
|----------|----------|---------------|
| 0.01% | Stablecoin pairs | USDT/USDC |
| 0.05% | High-volume blue chips | BNB/USDT |
| 0.25% | Standard pairs | CAKE/BNB |
| 1% | Exotic or low-liquidity | New tokens |

## Deep Link Format

```
# V3 Position
https://pancakeswap.finance/add/{tokenA}/{tokenB}/{feeAmount}?chain={chainKey}

# V2 Position (BSC only)
https://pancakeswap.finance/v2/add/{tokenA}/{tokenB}?chain={chainKey}

# StableSwap (BSC only)
https://pancakeswap.finance/stable/add/{tokenA}/{tokenB}?chain=bsc
```

## Key Features

- **Impermanent loss warnings** — alerts for volatile pairs
- **APY breakdown** — trading fees vs CAKE farming rewards
- **StableSwap detection** — auto-recommends StableSwap for stable pairs on BSC
- **Multi-chain support** — 9 networks: BSC, Ethereum, Arbitrum, Base, zkSync Era, Linea, opBNB, Monad, BSC Testnet

## Full Reference

See the [source SKILL.md](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-driver/skills/liquidity-planner/SKILL.md) for the complete skill.
