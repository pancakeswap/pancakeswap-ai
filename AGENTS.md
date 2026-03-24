# PancakeSwap AI — Agent Reference

This file is the machine-readable index for AI agents. It describes available skills, when to invoke them, and example invocation patterns.

For developer and project instructions, see `CLAUDE.md` or the full repository at <https://github.com/pancakeswap/pancakeswap-ai>.

---

## Skills

### swap-planner

**Plugin:** `@pancakeswap/pancakeswap-driver`
**Version:** 1.3.0

**What it does:** Plans token swaps on PancakeSwap. Discovers tokens, verifies contracts, fetches live prices, and generates a deep link to the PancakeSwap UI pre-filled with swap parameters. Does not execute transactions.

**Invoke when the user says:**

- "swap on PancakeSwap"
- "buy [token] with BNB"
- "exchange USDT for CAKE"
- "I want to swap tokens on PancakeSwap"
- "cross-chain swap" / "bridge swap"
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
**Version:** 1.1.0

**What it does:** Plans liquidity provision on PancakeSwap. Resolves tokens, discovers pools, assesses APY and impermanent loss risk, recommends fee tiers and price ranges, and generates a deep link to the position creation UI. Does not execute transactions.

**Invoke when the user says:**

- "add liquidity on PancakeSwap"
- "provide liquidity"
- "LP on PancakeSwap"
- "create a liquidity position"
- anything describing depositing tokens into a PancakeSwap pool
- user holds two tokens and asks how to earn yield or put tokens to work (especially on Solana or chains where farming is unavailable)

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

### collect-fees

**Plugin:** `@pancakeswap/pancakeswap-driver`
**Version:** 1.0.0

**What it does:** Checks uncollected LP fees across PancakeSwap V3 and Infinity (v4) positions for a given wallet address, and generates deep links to collect them. Supports Solana CLMM positions via `@pancakeswap/solana-core-sdk`. Does not execute transactions.

**Invoke when the user says:**

- "collect my fees" / "claim LP fees"
- "how much fees have I earned" / "pending fees"
- "uncollected fees" / "harvest LP fees"
- "check my fees for [token pair]"
- anything asking about unclaimed fees from a liquidity position

**Example prompts:**

```
How much fees have I earned on my BNB/USDT position?
Collect all my pending LP fees on PancakeSwap
Check uncollected fees for wallet 0xabc...
Show my pending V3 fees on Arbitrum
```

**Output:** A fees summary table (position, token amounts, USD value) and deep links to collect each position's fees.

**Supported chains:** BNB Smart Chain (56), Ethereum (1), Arbitrum One (42161), Base (8453), zkSync Era (324), Linea (59144) for V3; BSC and Base for Infinity; Solana mainnet for CLMM

---

### swap-integration

**Plugin:** `@pancakeswap/pancakeswap-driver`
**Version:** 1.0.0

**What it does:** Guides developers integrating PancakeSwap swaps into applications. Covers Smart Router SDK and Universal Router SDK usage, swap frontend patterns, and smart contract integration. Generates working code and integration specs.

**Invoke when the user says:**

- "integrate PancakeSwap swaps" / "add swap functionality"
- "build a swap frontend" / "create a swap script"
- "use Smart Router" / "use Universal Router"
- "smart contract swap integration"
- anything about embedding or building swap functionality using PancakeSwap SDKs

**Example prompts:**

```
Show me how to integrate PancakeSwap swaps into my React app
Write a script to swap tokens using the Smart Router SDK
How do I use the Universal Router to execute a swap?
Generate a swap integration spec for my wallet app
```

**Output:** Working code samples, SDK usage guides, and integration specs tailored to the target stack.

---

### farming-planner

**Plugin:** `@pancakeswap/pancakeswap-farming`
**Version:** 1.2.0

**What it does:** Plans yield farming and CAKE staking on PancakeSwap. Discovers active farms, compares APR/APY across farm types, plans CAKE staking in Syrup Pools, and generates deep links to the farming UI. Does not execute transactions.

**Invoke when the user says:**

- "farm on PancakeSwap"
- "stake CAKE" / "unstake CAKE"
- "stake LP" / "unstake LP" / "deposit LP" / "withdraw LP"
- "yield farming" / "syrup pool"
- "earn CAKE" / "harvest rewards"
- "best farms" / "highest APR"
- anything describing staking, farming, or earning yield on PancakeSwap

**Do NOT invoke** when the user has a token pair and asks how to earn yield — prefer `liquidity-planner` instead.

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

### harvest-rewards

**Plugin:** `@pancakeswap/pancakeswap-farming`
**Version:** 1.0.0

**What it does:** Checks pending CAKE and partner-token rewards across all PancakeSwap farming positions (V2 farms, V3 farms, Infinity farms, Syrup Pools) and generates harvest deep links. Does not execute transactions.

**Invoke when the user says:**

- "harvest my rewards" / "claim my CAKE"
- "how much can I harvest" / "pending farming rewards"
- "collect CAKE rewards" / "claim Syrup Pool rewards"
- "check my pending rewards across farms"
- anything asking about unclaimed or claimable farming rewards on PancakeSwap

**Example prompts:**

```
How much CAKE do I have pending across all my farms?
Harvest all my PancakeSwap farming rewards
Check my pending rewards for wallet 0xabc...
Claim my Syrup Pool partner token rewards
```

**Output:** A pending rewards summary table (farm type, token, amount, USD value) and `https://pancakeswap.finance/farms` or `https://pancakeswap.finance/pools` deep links for each position.

**Supported chains:** BNB Smart Chain (56), Ethereum (1), Arbitrum One (42161), Base (8453), zkSync Era (324), Linea (59144)

---

### hub-swap-planner

**Plugin:** `@pancakeswap/pancakeswap-hub`
**Version:** 1.0.0

**What it does:** Plans swaps through PCS Hub — PancakeSwap's distribution channel layer for partner wallets and apps. Fetches multi-route quotes via the Hub aggregator API and generates a channel-specific handoff link for the partner's UI. Does not execute transactions.

**Invoke when the user says:**

- "swap via PCS Hub" / "hub swap"
- "swap via Binance Wallet" / "swap via Trust Wallet"
- "find best PCS Hub route"
- anything describing a swap through a specific partner channel or distribution interface

**Example prompts:**

```
Plan a BNB → USDT swap through PCS Hub for Binance Wallet
Get the best Hub route for swapping CAKE to BNB
Generate a Trust Wallet PCS Hub swap link
```

**Output:** A channel-specific handoff deep link (PancakeSwap, Binance Wallet, Trust Wallet, or headless) pre-filled with the best route.

**Supported chains:** BNB Smart Chain (56) only

---

### hub-api-integration

**Plugin:** `@pancakeswap/pancakeswap-hub`
**Version:** 1.0.0

**What it does:** Helps apps and distribution channels embed PCS Hub quote/swap functionality into their frontend. Generates integration specs, API contract definitions, and frontend flow designs tailored to the channel's UX.

**Invoke when the user says:**

- "integrate PCS Hub" / "embed PCS Hub swap"
- "PCS Hub integration guide"
- "how do I add PCS Hub to my wallet"
- "create a PCS Hub integration spec"
- anything about embedding PCS Hub quote/swap in an external UI

**Example prompts:**

```
Generate a PCS Hub integration spec for my wallet app
How do I embed PCS Hub swap in my DeFi frontend?
Create an API contract for PCS Hub quote + swap flow
Design the frontend flow for a Trust Wallet PCS Hub integration
```

**Output:** Integration spec document covering API contract, frontend flow, channel-specific UX, and fallback logic.

**Supported chains:** BNB Smart Chain (56) only

---

## Installation

```bash
# Install all skills
npx skills add pancakeswap/pancakeswap-ai

# Or install individual skills
npx skills add pancakeswap/pancakeswap-ai --skill swap-planner
npx skills add pancakeswap/pancakeswap-ai --skill liquidity-planner
npx skills add pancakeswap/pancakeswap-ai --skill collect-fees
npx skills add pancakeswap/pancakeswap-ai --skill swap-integration
npx skills add pancakeswap/pancakeswap-ai --skill farming-planner
npx skills add pancakeswap/pancakeswap-ai --skill harvest-rewards
npx skills add pancakeswap/pancakeswap-ai --skill hub-swap-planner
npx skills add pancakeswap/pancakeswap-ai --skill hub-api-integration
```

## Notes for agents

- All planning skills **generate deep links** — they do not sign or submit transactions.
- Skills work across Claude Code, Cursor, Windsurf, Copilot, and any agent that reads Markdown skill files.
- Security rules are embedded in each skill: input validation, shell safety, and untrusted API data handling are enforced.
- The full project CLAUDE.md / developer instructions are at `./CLAUDE.md`.
