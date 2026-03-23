# pancakeswap-driver

AI-powered token discovery and swap planning for PancakeSwap.

## Overview

This plugin provides a `swap-planner` skill that helps users plan token swaps on PancakeSwap. It handles token discovery, on-chain verification, price data fetching, and generates ready-to-use deep links to the PancakeSwap interface.

## Installation

```bash
npx skills add https://github.com/pancakeswap/pancakeswap-ai --skill swap-planner
npx skills add https://github.com/pancakeswap/pancakeswap-ai --skill liquidity-planner
```

## Skills

### swap-planner

Plan a token swap on PancakeSwap without writing any code:

1. **Token discovery** — find tokens by name, symbol, or description
2. **Contract verification** — verify token contracts on-chain
3. **Price data** — fetch live prices from DexScreener
4. **Deep links** — generate a PancakeSwap interface URL pre-filled with your swap

## Usage Examples

- "Swap 1 BNB for CAKE on BSC"
- "I want to buy some PancakeSwap token with USDT"
- "Swap 100 USDT for ETH on Ethereum"
- "Find the best meme token on BSC and swap 0.5 BNB for it"

## Supported Chains

| Chain              | Chain ID | Deep Link Key |
|--------------------|----------|---------------|
| BNB Smart Chain    | 56       | `bsc`         |
| Ethereum           | 1        | `eth`         |
| Arbitrum One       | 42161    | `arb`         |
| Base               | 8453     | `base`        |
| Polygon            | 137      | `polygon`     |
| zkSync Era         | 324      | `zksync`      |
| Linea              | 59144    | `linea`       |
| opBNB              | 204      | `opbnb`       |

## License

MIT
