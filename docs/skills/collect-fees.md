# collect-fees

> **Plugin:** [`pancakeswap-driver`](/plugins/pancakeswap-driver) · **Model:** Sonnet · **Version:** 2.0.1

Check and collect pending LP fees across PancakeSwap V3, Infinity (v4), and Solana positions.

## Overview

This skill **does not execute transactions** — it reads on-chain state, shows pending fee amounts with USD estimates, and generates deep links to the PancakeSwap collect UI for the user to confirm in their own wallet.

## Workflow

```
1. Gather Intent        → Wallet address, optional pair/chain filter
2. Discover Positions   → On-chain lookup via NonfungiblePositionManager (V3) or Explorer API (Infinity)
3. Resolve Tokens       → Contract addresses → symbols, decimals, prices
4. Display Fee Summary  → Table of pending fees with USD values
5. Generate Deep Links  → PancakeSwap collect UI pre-filled for each position
```

## Supported Position Types

| Type          | Discovery Method                                 | Chains                                                  |
| ------------- | ------------------------------------------------ | ------------------------------------------------------- |
| V3            | `NonfungiblePositionManager` ERC-721 enumeration | BSC, Ethereum, Arbitrum, Base, zkSync Era, Linea, opBNB |
| Infinity (v4) | Explorer API + `@pancakeswap/infinity-sdk`       | BSC, Base                                               |
| Solana Farms  | `@pancakeswap/solana-core-sdk`                   | Solana mainnet                                          |
| V2            | Not supported (fees embedded in LP token value)  | —                                                       |

## Usage Examples

```
Check my LP fees on BSC for 0xYourWallet
How much ETH/USDC fees have I earned on Arbitrum?
Collect my CAKE/BNB fees — wallet 0xYourWallet
Check my uncollected fees on PancakeSwap Solana farms — wallet <base58-pubkey>
```

## Security

The skill enforces strict input validation:

- EVM wallet addresses must match `^0x[0-9a-fA-F]{40}$`
- Solana wallet addresses must match base58 format
- Shell variables are always single-quoted to prevent injection
- Only approved RPC endpoints are used

## Full Reference

See the [source SKILL.md](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-driver/skills/collect-fees/SKILL.md) for the complete skill with contract addresses, SDK usage, and anti-patterns.
