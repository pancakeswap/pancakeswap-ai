# PancakeSwap AI — Agent Reference

This file is the machine-readable **namespace registry** for AI agents. It lists skill groups, their trigger conditions, and links to full skill documents. Fetch the linked skill document only for the namespace you need — do not load all skill documents upfront.

For developer and project instructions, see `CLAUDE.md` or the full repository at <https://github.com/pancakeswap/pancakeswap-ai>.

## Installation

```bash
npx skills add https://github.com/pancakeswap/pancakeswap-ai \
  --skill pcs-skill \
  --skill swap-planner \
  --skill liquidity-planner \
  --skill farming-planner
```

`pcs-skill` is the router — it routes to the others based on your intent. All four install together so sub-skills are available locally with no network calls at runtime.

---

## Namespaces

### pcs-trading

**Skill doc:** [`packages/plugins/pancakeswap-driver/skills/swap-planner/SKILL.md`](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-driver/skills/swap-planner/SKILL.md)

Token discovery, price verification, and swap planning across 8 chains. Generates `pancakeswap.finance/swap` deep links. Use when the user wants to swap, buy, or exchange tokens on PancakeSwap.

---

### pcs-liquidity

**Skill doc:** [`packages/plugins/pancakeswap-driver/skills/liquidity-planner/SKILL.md`](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-driver/skills/liquidity-planner/SKILL.md)

Pool assessment, fee tier recommendations, price range planning, and LP position creation across V2, V3, StableSwap, and Infinity pool types. Generates `pancakeswap.finance/add` deep links. Use when the user wants to add liquidity, create an LP position, or provide liquidity to a pool.

---

### pcs-yield

**Skill doc:** [`packages/plugins/pancakeswap-farming/skills/farming-planner/SKILL.md`](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-farming/skills/farming-planner/SKILL.md)

Farm discovery, APR/APY comparison, CAKE staking in Syrup Pools, LP farming, and reward harvesting. Generates `pancakeswap.finance/farms` and `pancakeswap.finance/pools` deep links. Use when the user wants to farm, stake CAKE, deposit LP tokens, harvest rewards, or earn yield on PancakeSwap.

---

## Composition Recipes

Multi-step workflows that chain namespaces. Each step produces a deep link or plan that feeds the next step naturally.

### Swap then add liquidity

> "Swap BNB for USDT, then add BNB/USDT liquidity on PancakeSwap"

1. **pcs-trading** — plan the BNB→USDT swap, output a `/swap` deep link
2. **pcs-liquidity** — plan the BNB/USDT LP position using the acquired amounts, output an `/add` deep link

### Harvest rewards then restake

> "Harvest my CAKE rewards and stake them in the highest APY pool"

1. **pcs-yield** — identify pending rewards and generate a harvest deep link
2. **pcs-yield** — find the best Syrup Pool and generate a stake deep link for the harvested CAKE

### Full DeFi loop

> "Swap for CAKE and BNB, add liquidity, then farm the LP tokens"

1. **pcs-trading** — plan swaps to acquire CAKE and BNB in the right ratio
2. **pcs-liquidity** — plan the CAKE/BNB LP position, output an `/add` deep link
3. **pcs-yield** — find the CAKE/BNB farm and generate a deposit deep link for the resulting LP tokens

---

## Keyword Index

Use this index to map user terms to the correct namespace when the intent is ambiguous.

| Keywords | Namespace |
|---|---|
| swap, buy, sell, exchange, trade, price, token discovery | pcs-trading |
| liquidity, LP, pool, add liquidity, provide liquidity, position, range, fee tier | pcs-liquidity |
| farm, farming, stake, unstake, harvest, yield, APR, APY, CAKE, syrup pool, deposit LP, withdraw LP | pcs-yield |

---

## Notes for agents

- All skills **plan** actions and generate deep links — they do not sign or submit transactions.
- Skills work across Claude Code, Cursor, Windsurf, Copilot, and any agent that reads Markdown skill files.
- Fetch only the skill document(s) relevant to the current user intent. For multi-step workflows, fetch each namespace's skill document as that step begins.
- Security rules are embedded in each skill: input validation, shell safety, and untrusted API data handling are enforced.
