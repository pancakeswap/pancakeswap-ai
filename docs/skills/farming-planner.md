# farming-planner

> **Plugin:** [`pancakeswap-farming`](/plugins/pancakeswap-farming) · **Model:** Sonnet · **Version:** 1.0.0

Plan yield farming, CAKE staking, and reward harvesting on PancakeSwap.

## Overview

This skill **does not execute transactions** — it plans farming strategies. The output is a deep link URL that opens the PancakeSwap interface at the relevant farming or staking page.

## Farming Types

| Type | How It Works | Reward |
|------|-------------|--------|
| V2 Farms | Stake LP tokens in MasterChef v2 | CAKE |
| V3 Farms | Stake V3 NFT positions in MasterChef v3 | CAKE |
| Infinity Farms | Provide liquidity, CAKE allocated per 8h epoch via Merkle | CAKE |
| Syrup Pools | Stake CAKE to earn partner tokens or more CAKE | Various |
| veCAKE | Lock CAKE for governance, revenue share, and farm boost | CAKE |

## Workflow

```
1. Gather Intent      → What does the user want? (farm, stake, harvest)
2. Identify Type      → V2, V3, Infinity, Syrup Pool, or veCAKE
3. Discover Farms     → Query active farms, APR data
4. Assess Opportunity → Compare yields, IL risk, lock duration
5. Generate Deep Link → Pre-filled PancakeSwap URL
6. Present Summary    → APR, risks, actionable link
```

## Farm Discovery

### Infinity Farms (CampaignManager)

Query the CampaignManager contract on BSC to discover active Infinity farm campaigns:

```bash
cast call 0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115 \
  "campaignLength()(uint256)" \
  --rpc-url https://bsc-dataseed1.binance.org
```

### APR Data (DefiLlama)

```bash
curl -s "https://yields.llama.fi/pools" | \
  jq '[.data[] | select(.project == "pancakeswap-amm-v3") | select(.chain == "BSC")]
      | sort_by(-.apy) | .[0:10]'
```

## Reward Claiming (Infinity Farms)

Infinity farms distribute CAKE every 8 hours. Claiming uses a Merkle proof flow:

1. **Fetch proof** from PancakeSwap API:

```
GET https://infinity.pancakeswap.com/farms/users/{chainId}/{address}/{timestamp}
```

2. **Call Distributor** contract with the proof:

```solidity
function claim(ClaimParams[] calldata claimParams) external;
```

## veCAKE & Farm Boost

Lock CAKE for veCAKE to unlock:

| Benefit | Details |
|---------|---------|
| **Gauge Voting** | Direct CAKE emissions to preferred farms |
| **Revenue Share** | Earn PancakeSwap protocol revenue |
| **bCAKE Boost** | Up to 2.5x multiplier on V2 farm APR, 2.0x on V3 |

## Decision Guide

| User Wants... | Recommend |
|---------------|-----------|
| Passive yield, no IL | CAKE staking or veCAKE lock |
| Highest APR | V3 Farm with tight range + bCAKE boost |
| Set-and-forget | V2 Farm (full range) |
| Partner tokens | Syrup Pools |
| Governance + revenue | veCAKE + gauge voting |
| Stablecoin yield | USDT-USDC StableSwap LP farm |

## Deep Links

```
https://pancakeswap.finance/farms              # All farms
https://pancakeswap.finance/pools              # Syrup Pools
https://pancakeswap.finance/cake-staking       # CAKE / veCAKE staking
https://pancakeswap.finance/gauges-voting      # Gauge voting
https://pancakeswap.finance/liquidity/pools?type=1  # Infinity farms
```

## Full Reference

See the [source SKILL.md](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-farming/skills/farming-planner/SKILL.md) for the complete skill with contract addresses, token tables, and anti-patterns.
