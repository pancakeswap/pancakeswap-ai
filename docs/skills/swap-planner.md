# swap-planner

> **Plugin:** [`pancakeswap-driver`](/plugins/pancakeswap-driver) · **Model:** Sonnet · **Version:** 1.1.0

Plan token swaps on PancakeSwap by gathering user intent, discovering and verifying tokens, fetching price data, and generating a ready-to-use deep link.

## Overview

This skill **does not execute swaps** — it plans them. The output is a deep link URL that opens the PancakeSwap interface pre-filled with swap parameters, so the user can review and confirm in their own wallet.

## Workflow

```
1. Gather Intent        → What tokens? How much? Which chain?
2. Resolve Tokens       → Name/symbol → verified contract address
3. Input Validation     → Check amounts, decimals, chain support
4. Fetch Price Data     → CoinGecko API or on-chain quotes
5. Generate Deep Link   → Pre-filled PancakeSwap URL
6. Present Summary      → Prices, slippage, link for confirmation
```

## Supported Chains

| Chain | Chain ID | Deep Link Key | Native Token | PCSX |
|-------|----------|---------------|-------------|------|
| BNB Smart Chain | 56 | `bsc` | BNB | RWAs only |
| Ethereum | 1 | `eth` | ETH | Crypto |
| Arbitrum One | 42161 | `arb` | ETH | Crypto |
| Base | 8453 | `base` | ETH | — |
| zkSync Era | 324 | `zksync` | ETH | — |
| Linea | 59144 | `linea` | ETH | — |
| opBNB | 204 | `opbnb` | BNB | — |
| Monad | 143 | `monad` | MON | — |

## Deep Link Format

```
https://pancakeswap.finance/swap?chain={chainKey}&inputCurrency={tokenIn}&outputCurrency={tokenOut}
```

**Examples:**

```
# BNB → USDT on BSC
https://pancakeswap.finance/swap?chain=bsc&inputCurrency=BNB&outputCurrency=0x55d398326f99059fF775485246999027B3197955

# ETH → USDC on Arbitrum
https://pancakeswap.finance/swap?chain=arb&inputCurrency=ETH&outputCurrency=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
```

## Token Verification

The skill instructs the agent to verify tokens on-chain before generating deep links:

1. Call `symbol()` and `decimals()` on the token contract
2. Check the contract is verified on the block explorer
3. Warn about tokens with transfer taxes or honeypot characteristics
4. Prefer well-known token lists when available

## Full Reference

See the [source SKILL.md](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-driver/skills/swap-planner/SKILL.md) for the complete skill.
