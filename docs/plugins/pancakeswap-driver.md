# pancakeswap-driver

AI-powered assistance for planning PancakeSwap swaps and liquidity positions — without writing code.

## Metadata

| Field | Value |
|-------|-------|
| **Name** | `pancakeswap-driver` |
| **Version** | 1.0.0 |
| **Author** | PancakeSwap |
| **License** | MIT |
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

## Installation

::: code-group

```bash [Claude Code]
/plugin install pancakeswap-driver
```

```bash [Manual]
cp -r packages/plugins/pancakeswap-driver/skills/swap-planner/SKILL.md \
  .cursor/skills/swap-planner/SKILL.md
cp -r packages/plugins/pancakeswap-driver/skills/liquidity-planner/SKILL.md \
  .cursor/skills/liquidity-planner/SKILL.md
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
