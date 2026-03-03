# pancakeswap-farming

AI-powered assistance for yield farming, CAKE staking, and reward management on PancakeSwap.

## Metadata

| Field | Value |
|-------|-------|
| **Name** | `pancakeswap-farming` |
| **Version** | 1.0.0 |
| **Author** | PancakeSwap |
| **License** | MIT |
| **Keywords** | `pancakeswap`, `farming`, `yield`, `cake`, `staking`, `syrup-pools`, `bsc`, `bnb`, `defi` |

## Skills

### [farming-planner](/skills/farming-planner)

Plan yield farming strategies on PancakeSwap — from discovering active farms to harvesting CAKE rewards.

**Capabilities:**
- Farm discovery via CampaignManager contract and DefiLlama API
- APR/APY comparison across V2, V3, and Infinity farms
- CAKE staking options (Syrup Pools)
- Merkle-proof reward claiming for Infinity farms
- Deep link generation to PancakeSwap farming UI
- Multi-chain support (BSC, Ethereum, Arbitrum, Base, zkSync)

## Installation

::: code-group

```bash [Claude Code]
/plugin install pancakeswap-farming
```

```bash [Manual]
cp -r packages/plugins/pancakeswap-farming/skills/farming-planner/SKILL.md \
  .cursor/skills/farming-planner/SKILL.md
```

:::

## Quick Example

Ask your agent:

```
I have 500 CAKE and 2 BNB. What's the best farming strategy on PancakeSwap?
```

The agent reads the `farming-planner` skill, compares options (CAKE staking vs LP farming), and produces a plan:

```
## Farming Plan

**Option 1 — CAKE Staking (Lowest Risk)**
Stake CAKE in a Syrup Pool to earn partner tokens or more CAKE
Link: https://pancakeswap.finance/pools

**Option 2 — BNB-CAKE V3 Farm (Higher Yield)**
1. Add liquidity → https://pancakeswap.finance/add/BNB/0x0E09.../2500?chain=bsc
2. Stake in farm → https://pancakeswap.finance/liquidity/pools?chain=bsc

**Risks:** Impermanent loss if BNB/CAKE ratio shifts
```

## Key Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| MasterChef v3 | `0x556B9306...04c2Cd59e` | V3 position farming |
| CampaignManager | `0x26Bde0AC...9c9115` | Infinity farm registry |
| Distributor | `0xEA8620aA...40877` | Infinity CAKE reward claims |
| CAKE | `0x0E09FaBB...cE82` | CAKE token |
