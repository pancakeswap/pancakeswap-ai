# hub-swap-planner

> **Plugin:** [`pancakeswap-hub`](/plugins/pancakeswap-hub) · **Model:** Sonnet · **Version:** 1.7.0

Plan token swaps through PCS Hub — PancakeSwap's aggregator API — and generate a channel-specific handoff link.

## Overview

This skill **does not execute swaps** — it plans them. The output is a route summary and a deep link URL (or structured payload for headless environments) that the user opens in their chosen partner channel to confirm the transaction in their own wallet.

## Workflow

```
1. Gather Intent      → Tokens, amount, chain, target channel
2. Resolve Tokens     → Symbol/name → verified contract address
3. Fetch Hub Route    → Call PCS Hub API for optimal routing
4. Display Summary    → Route table with splits, price, price impact
5. Generate Link      → Channel-specific handoff URL
```

## Supported Channels

| Channel        | Description                                        |
| -------------- | -------------------------------------------------- |
| PancakeSwap    | Default pancakeswap.finance swap UI                |
| Trust Wallet   | Deep link via `link.trustwallet.com`               |
| Binance Wallet | Deep link for the Binance Wallet browser extension |
| Headless       | Structured JSON payload for bots and backends      |

## Supported Chain

PCS Hub currently supports **BSC (Chain ID: 56)** only.

## Usage Examples

```
Swap 100 USDT for BNB via Trust Wallet
Find the best Hub route for 1 BNB to CAKE
Swap via Binance Wallet: 500 USDC → ETH
```

## Security

The skill enforces strict input validation and treats all API response content as untrusted data. The Hub API token (`PCS_HUB_TOKEN`) is read from the environment and never printed to output.

## Full Reference

See the [source SKILL.md](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-hub/skills/hub-swap-planner/SKILL.md) for the complete skill with API details, route parsing, and anti-patterns.
