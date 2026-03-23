# pancakeswap-driver

AI-powered assistance for planning PancakeSwap swaps and liquidity positions — without writing code.

## Metadata

| Field        | Value                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| **Name**     | `pancakeswap-driver`                                                                                    |
| **Version**  | 1.15.2                                                                                                  |
| **Author**   | PancakeSwap                                                                                             |
| **License**  | MIT                                                                                                     |
| **Keywords** | `pancakeswap`, `swap`, `liquidity`, `lp`, `defi`, `deep-links`, `token-discovery`, `bsc`, `bnb`, `cake` |

## Skills

### [swap-planner](/skills/swap-planner)

Plan token swaps by gathering user intent and generating deep links to the PancakeSwap UI.

**Capabilities:**

- Token discovery and contract verification via on-chain calls
- Price fetching from CoinGecko and on-chain quotes
- Multi-chain deep link generation (BSC, Ethereum, Arbitrum, Base, and more)
- Slippage recommendations based on token type
- Scam/honeypot detection warnings

### [liquidity-planner](/skills/liquidity-planner)

Plan LP positions with pool assessment and APY analysis.

**Capabilities:**

- 9-step workflow: intent → tokens → validation → pools → liquidity → APY → price range → fee tier → deep link
- V2, V3, and StableSwap pool support
- Fee tier guidance (0.01%, 0.05%, 0.25%, 1%)
- Impermanent loss warnings and yield data from DefiLlama
- StableSwap optimization for stable pairs on BSC

### [collect-fees](/skills/collect-fees)

Discover and collect pending LP fees across V3, Infinity (v4), and Solana positions.

**Capabilities:**

- On-chain position discovery for V3 (NonfungiblePositionManager) and Infinity (PoolManager)
- USD fee estimates via token price lookups
- Solana farm position support via `@pancakeswap/solana-core-sdk`
- Multi-chain: 7 EVM networks for V3, BSC and Base for Infinity, Solana mainnet
- Deep link generation to PancakeSwap collect UI

### [swap-integration](/skills/swap-integration)

Integrate PancakeSwap swaps into frontends, backends, and smart contracts using the Smart Router or Universal Router SDK.

**Capabilities:**

- Quick routing via PancakeSwap Routing API
- SDK-based integration with Smart Router + Universal Router
- Direct V2 Router contract calls for simple use cases
- Code templates for React/Next.js frontends, Node.js scripts, and Solidity contracts
- Protocol guidance: V2, V3, StableSwap, and mixed routes

## Installation

::: code-group

```bash [Claude Code]
claude plugin add @pancakeswap/pancakeswap-driver
```

```bash [Manual]
cp -r packages/plugins/pancakeswap-driver/skills/swap-planner/SKILL.md \
  .cursor/skills/swap-planner/SKILL.md
cp -r packages/plugins/pancakeswap-driver/skills/liquidity-planner/SKILL.md \
  .cursor/skills/liquidity-planner/SKILL.md
cp -r packages/plugins/pancakeswap-driver/skills/collect-fees/SKILL.md \
  .cursor/skills/collect-fees/SKILL.md
cp -r packages/plugins/pancakeswap-driver/skills/swap-integration/SKILL.md \
  .cursor/skills/swap-integration/SKILL.md
```

:::

## Quick Example

Ask your agent:

```
I want to swap 0.5 BNB for CAKE on PancakeSwap
```

The agent produces a verified deep link:

```
https://pancakeswap.finance/swap?chain=bsc&inputCurrency=BNB&outputCurrency=0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
```
