# pancakeswap-driver

AI-powered token discovery, swap planning, liquidity management, and swap integration for PancakeSwap.

## Installation

```bash
claude plugin add @pancakeswap/pancakeswap-driver
```

## Skills

### swap-planner

Plan a token swap on PancakeSwap without writing any code:

1. **Token discovery** — find tokens by name, symbol, or description
2. **Contract verification** — verify token contracts on-chain
3. **Price data** — fetch live prices from DexScreener
4. **Deep links** — generate a PancakeSwap interface URL pre-filled with your swap

**Usage examples:**

- "Swap 1 BNB for CAKE on BSC"
- "I want to buy some PancakeSwap token with USDT"
- "Swap 100 USDT for ETH on Ethereum"
- "Find the best meme token on BSC and swap 0.5 BNB for it"

### liquidity-planner

Plan LP positions on PancakeSwap (V2, V3, StableSwap):

- Assess pool liquidity and APY
- Recommend fee tiers and price ranges for V3
- Generate deep links to the PancakeSwap liquidity UI

**Usage examples:**

- "Add liquidity to the BNB/CAKE pool"
- "Provide liquidity on V3 with a tight range"
- "What fee tier should I use for a stablecoin pair?"

### collect-fees

Check and collect accumulated LP fees from PancakeSwap V3 and Infinity (v4) positions.

**Usage examples:**

- "How much fees have I earned on my BNB/USDT position?"
- "Collect my pending LP fees"

### swap-integration

Integrate PancakeSwap swaps into applications using the Smart Router or Universal Router SDK. Provides code snippets and guidance for swap scripts, frontends, and smart contract integrations.

**Usage examples:**

- "Integrate PancakeSwap swaps into my dApp"
- "Write a swap script using the Smart Router"
- "How do I use the Universal Router to swap tokens?"

## Supported Chains

| Chain           | Chain ID | Deep Link Key |
| --------------- | -------- | ------------- |
| BNB Smart Chain | 56       | `bsc`         |
| Ethereum        | 1        | `eth`         |
| Arbitrum One    | 42161    | `arb`         |
| Base            | 8453     | `base`        |
| Polygon         | 137      | `polygon`     |
| zkSync Era      | 324      | `zksync`      |
| Linea           | 59144    | `linea`       |
| opBNB           | 204      | `opbnb`       |

## License

MIT
