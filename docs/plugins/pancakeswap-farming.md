# pancakeswap-farming

AI-powered assistance for yield farming, CAKE staking, and reward management on PancakeSwap.

## Metadata

| Field | Value |
|-------|-------|
| **Name** | `pancakeswap-farming` |
| **Version** | 1.0.0 |
| **Author** | PancakeSwap |
| **License** | MIT |
| **Keywords** | `pancakeswap`, `farming`, `yield`, `cake`, `staking`, `syrup-pools`, `vecake`, `bsc`, `bnb`, `defi` |

## Skills

### [farming-planner](/skills/farming-planner)

Plan yield farming strategies on PancakeSwap — from discovering active farms to harvesting CAKE rewards.

**Capabilities:**
- Farm discovery via CampaignManager contract and DefiLlama API
- APR/APY comparison across V2, V3, and Infinity farms
- CAKE staking options (Syrup Pools, veCAKE lock)
- veCAKE gauge voting and revenue sharing
- bCAKE farm boost calculations (up to 2.5x)
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

The agent reads the `farming-planner` skill, compares options (CAKE staking vs LP farming vs veCAKE), and produces a plan:

```
## Farming Plan

**Option 1 — veCAKE Lock (Lowest Risk)**
Lock 500 CAKE for veCAKE → earn revenue share + 2.5x farm boost
Link: https://pancakeswap.finance/cake-staking

**Option 2 — BNB-CAKE V3 Farm (Higher Yield)**
1. Add liquidity → https://pancakeswap.finance/liquidity/add/v3/BNB/0x0E09...?chain=bsc
2. Stake in farm → https://pancakeswap.finance/farms?chain=bsc

**Risks:** Impermanent loss if BNB/CAKE ratio shifts
```

## Key Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| MasterChef v3 | `0x556B9306...04c2Cd59e` | V3 position farming |
| CampaignManager | `0x26Bde0AC...9c9115` | Infinity farm registry |
| Distributor | `0xEA8620aA...40877` | Infinity CAKE reward claims |
| veCAKE | `0x5692DB81...C1bAB` | Vote-escrowed CAKE |
| CAKE | `0x0E09FaBB...cE82` | CAKE token |
