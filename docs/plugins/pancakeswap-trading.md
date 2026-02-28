# pancakeswap-trading

Integrate PancakeSwap swaps into frontends, backends, and smart contracts.

## Metadata

| Field | Value |
|-------|-------|
| **Name** | `pancakeswap-trading` |
| **Version** | 1.0.0 |
| **Author** | PancakeSwap |
| **License** | MIT |
| **Keywords** | `pancakeswap`, `swap`, `defi`, `smart-router`, `universal-router`, `permit2`, `bsc`, `bnb` |

## Skills

### [swap-integration](/skills/swap-integration)

The primary skill — a comprehensive reference for integrating PancakeSwap swaps using three methods:

| Method | Best For |
|--------|----------|
| **Routing API** | Quick quotes, prototypes, serverless functions |
| **Smart Router SDK + Universal Router** | Production frontends, trading bots, backends |
| **Direct V2 Router** | Simple swaps, smart contract integrations |

Covers all 9 supported chains, Permit2 gasless approvals, slippage protection, multi-hop routing, and gas optimization.

## Agents

### swap-integration-expert

An advanced agent prompt (`agents/swap-integration-expert.md`) for complex swap scenarios:

- Multi-hop routing with split paths
- Permit2 signature workflows
- StableSwap integration for stable pairs
- Gas optimization strategies
- Error recovery and fallback routing

## Installation

::: code-group

```bash [Claude Code]
/plugin install pancakeswap-trading
```

```bash [Manual]
cp -r packages/plugins/pancakeswap-trading/skills/swap-integration/SKILL.md \
  .cursor/skills/swap-integration/SKILL.md
```

:::

## Quick Example

Ask your agent:

```
Write a TypeScript script to swap 100 USDT for CAKE on BSC using the Smart Router SDK
```

The agent reads the `swap-integration` skill and generates production-ready code with correct contract addresses, proper slippage handling, and Permit2 approvals.
