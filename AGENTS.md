# PancakeSwap AI — Agent Reference

This file is the machine-readable index for AI agents. It describes available skills, when to invoke them, and example invocation patterns.

This is a standalone machine-readable manifest for the agents defined in `CLAUDE.md` in this repository: <https://github.com/pancakeswap/pancakeswap-ai>.

---

## Skills

### swap-planner

**Plugin:** `@pancakeswap/pancakeswap-driver`
**Version:** 1.0.0

**What it does:** Plans token swaps on PancakeSwap. Discovers tokens, verifies contracts, fetches live prices, and generates a deep link to the PancakeSwap UI pre-filled with swap parameters. Does not execute transactions.

**Invoke when the user says:**
- "swap on PancakeSwap"
- "buy [token] with BNB"
- "exchange USDT for CAKE"
- "I want to swap tokens on PancakeSwap"
- anything describing exchanging one token for another on PancakeSwap

**Example prompts:**
```
Swap 0.5 BNB for USDT on PancakeSwap
Buy 100 CAKE with my USDT on BSC
Swap ETH for USDC on Arbitrum via PancakeSwap
```

**Output:** A `https://pancakeswap.finance/swap?...` deep link the user opens to confirm in their wallet.

**Supported chains:** BNB Smart Chain (56), Ethereum (1), Arbitrum One (42161), Base (8453), zkSync Era (324), Linea (59144), opBNB (204), Monad (143)

---

### liquidity-planner

**Plugin:** `@pancakeswap/pancakeswap-driver`
**Version:** 1.0.0

**What it does:** Plans liquidity provision on PancakeSwap. Resolves tokens, discovers pools, assesses APY and impermanent loss risk, recommends fee tiers and price ranges, and generates a deep link to the position creation UI. Does not execute transactions.

**Invoke when the user says:**
- "add liquidity on PancakeSwap"
- "provide liquidity"
- "LP on PancakeSwap"
- "create a liquidity position"
- anything describing depositing tokens into a PancakeSwap pool

**Example prompts:**
```
Add liquidity to the BNB/USDT pool on PancakeSwap
Provide liquidity for ETH/USDC on Arbitrum
Create a V3 LP position for CAKE/BNB with a tight range
```

**Output:** A `https://pancakeswap.finance/add/...` deep link with pool type, fee tier, and price range pre-filled.

**Pool types:** V2 (BSC only), V3 (all chains), StableSwap (BSC stable pairs), Infinity
**Fee tiers:** 0.01%, 0.05%, 0.25%, 1%

---

### farming-planner

**Plugin:** `@pancakeswap/pancakeswap-farming`
**Version:** 1.0.0

**What it does:** Plans yield farming and CAKE staking on PancakeSwap. Discovers active farms, compares APR/APY across farm types, plans CAKE staking in Syrup Pools, and generates deep links to the farming UI. Does not execute transactions.

**Invoke when the user says:**
- "farm on PancakeSwap"
- "stake CAKE" / "unstake CAKE"
- "stake LP" / "unstake LP" / "deposit LP" / "withdraw LP"
- "yield farming" / "syrup pool"
- "earn CAKE" / "harvest rewards"
- "best farms" / "highest APR"
- anything describing staking, farming, or earning yield on PancakeSwap

**Example prompts:**
```
Show me the best farms on PancakeSwap by APR
Stake my CAKE in the highest APY syrup pool
Deposit my BNB/USDT LP tokens into a farm
Harvest my pending CAKE rewards
```

**Output:** APR/APY comparison tables and `https://pancakeswap.finance/farms` or `https://pancakeswap.finance/pools` deep links.

**Farm types:** V2 farms, V3 farms, Infinity farms, Syrup Pools (CAKE staking)

---

## Installation

```bash
# Swap + liquidity skills
claude plugin add @pancakeswap/pancakeswap-driver

# Farming + CAKE staking skill
claude plugin add @pancakeswap/pancakeswap-farming
```

## Notes for agents

- All skills **plan** actions and generate deep links — they do not sign or submit transactions.
- Skills work across Claude Code, Cursor, Windsurf, Copilot, and any agent that reads Markdown skill files.
- Security rules are embedded in each skill: input validation, shell safety, and untrusted API data handling are enforced.
- The full project CLAUDE.md / developer instructions are at `./CLAUDE.md`.
