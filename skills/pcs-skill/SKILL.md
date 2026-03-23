---
name: pcs-skill
slug: pcs-skill
description: PancakeSwap AI — swap tokens, add liquidity, farm, stake CAKE, and earn yield on PancakeSwap across BNB Chain, Ethereum, Arbitrum, Base, and more.
homepage: https://github.com/pancakeswap/pancakeswap-ai
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(curl:*), Bash(jq:*), Bash(cast:*), Bash(python3:*), Bash(node:*), Bash(xdg-open:*), Bash(open:*), WebFetch, WebSearch, Task(subagent_type:Explore), AskUserQuestion
model: sonnet
license: MIT
metadata:
  author: pancakeswap
  version: '1.0.0'
---

# PancakeSwap Skill Router

Identify the user's intent, fetch the matching sub-skill, and follow its instructions.

## Routing Table

| Intent | Sub-skill |
|---|---|
| swap, buy, sell, exchange, token price, token discovery | `swap-planner` |
| add liquidity, LP, pool, provide liquidity, position, fee tier, price range | `liquidity-planner` |
| farm, stake CAKE, unstake, harvest, yield, APR, APY, syrup pool, deposit LP, withdraw LP | `farming-planner` |

## Steps

1. Match the user's request to a sub-skill name in the routing table.
2. Use Glob to find the sub-skill file. Try these patterns in order:
   - `.agents/skills/<name>/SKILL.md`
   - `.claude/skills/<name>/SKILL.md`
   - `~/.agents/skills/<name>/SKILL.md`
   - `~/.claude/skills/<name>/SKILL.md`
3. Read the matched file and follow its instructions.

For multi-step requests (e.g. "swap then add liquidity"), find and follow each sub-skill in sequence.
