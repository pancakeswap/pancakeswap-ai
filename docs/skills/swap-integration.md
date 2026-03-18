# swap-integration

> **Plugin:** [`pancakeswap-driver`](/plugins/pancakeswap-driver) · **Model:** Opus · **Version:** 1.1.0

Integrate PancakeSwap swaps into frontends, backends, and smart contracts.

## Overview

This skill **produces integration code** — not deep links. The output is a working implementation using the Smart Router SDK, Universal Router SDK, or direct V2 Router contract calls, depending on the use case.

## Quick Decision Guide

| Building...                          | Use This Method                                |
| ------------------------------------ | ---------------------------------------------- |
| Quick quote or prototype             | PancakeSwap Routing API (Method 1)             |
| Frontend with React/Next.js          | Smart Router SDK + Universal Router (Method 2) |
| Backend script or trading bot        | Smart Router SDK + Universal Router (Method 2) |
| Simple V2 swap via smart contract    | Direct V2 Router contract calls (Method 3)     |
| Need exact Universal Router encoding | Universal Router SDK directly (Method 2)       |

## Protocol Types

| Protocol   | Description                               | Fee Tiers (bps)         | Chains        |
| ---------- | ----------------------------------------- | ----------------------- | ------------- |
| V2         | Classic AMM (xy=k)                        | 25 (0.25%)              | BSC only      |
| V3         | Concentrated liquidity                    | 1, 5, 25, 100 (0.01–1%) | All chains    |
| StableSwap | Low-slippage for correlated/pegged assets | 1, 4 (0.01–0.04%)       | BSC only      |
| Mixed      | Split route across V2 + V3 + StableSwap   | N/A (composite)         | BSC primarily |

## Supported Chains

| Chain           | Chain ID | V2  | V3  | StableSwap |
| --------------- | -------- | --- | --- | ---------- |
| BNB Smart Chain | 56       | ✅  | ✅  | ✅         |
| BSC Testnet     | 97       | ✅  | ❌  | ❌         |
| Ethereum        | 1        | ❌  | ✅  | ❌         |
| Arbitrum One    | 42161    | ❌  | ✅  | ❌         |
| Base            | 8453     | ❌  | ✅  | ❌         |
| Polygon         | 137      | ❌  | ✅  | ❌         |
| zkSync Era      | 324      | ❌  | ✅  | ❌         |
| Linea           | 59144    | ❌  | ✅  | ❌         |
| opBNB           | 204      | ❌  | ✅  | ❌         |

## Key SDKs

```bash
npm install @pancakeswap/smart-router @pancakeswap/universal-router-sdk viem
```

## Usage Examples

```
Integrate PancakeSwap swaps into my Next.js dApp
Write a Node.js script to swap BNB for CAKE using the Smart Router
How do I use the Universal Router to execute a V3 swap on BSC?
Add swap functionality to my trading bot
```

## Full Reference

See the [source SKILL.md](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-driver/skills/swap-integration/SKILL.md) for the complete skill with code templates, address tables, and anti-patterns.
