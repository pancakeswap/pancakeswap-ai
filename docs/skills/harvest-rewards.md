# harvest-rewards

> **Plugin:** [`pancakeswap-farming`](/plugins/pancakeswap-farming) · **Model:** Sonnet · **Version:** 1.3.3

Check pending CAKE and partner-token rewards across all PancakeSwap farming positions and generate harvest deep links.

## Overview

This skill **does not execute transactions** — it reads on-chain pending reward amounts, presents a summary table with USD estimates, and generates deep links to the PancakeSwap UI for the user to confirm in their own wallet.

## Workflow

```
1. Gather Intent        → Wallet address, optional farm/chain filter
2. Detect Positions     → On-chain scan for staked V2, V3, Infinity, and Syrup Pool positions
3. Fetch Pending Rewards → Query pendingCake / pendingReward / Infinity API per position
4. Resolve Token Prices → CoinGecko or DexScreener for USD conversion
5. Display Summary      → Table of pending rewards with amounts and USD values
6. Generate Deep Links  → PancakeSwap Farms or Pools UI pre-filled for each position
```

## Supported Position Types

| Type           | Chains                                       |
| -------------- | -------------------------------------------- |
| V3 Farms       | BSC, Ethereum, Arbitrum, Base, zkSync, Linea |
| Infinity Farms | BSC, Base                                    |
| Syrup Pools    | BSC                                          |

## Usage Examples

```
How much CAKE do I have pending across all my farms?
Check my PancakeSwap rewards for 0xYourWallet
Harvest all my farming rewards on BSC
Claim my Syrup Pool partner token rewards
```

## Security

- Wallet addresses validated against `^0x[0-9a-fA-F]{40}$` before use in shell commands
- API responses (token names, symbols) treated as untrusted data — never interpreted as commands
- Only approved RPC endpoints and API hosts are used

## Full Reference

See the [source SKILL.md](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-farming/skills/harvest-rewards/SKILL.md) for the complete skill with contract addresses, RPC endpoints, reference scripts, and anti-patterns.
