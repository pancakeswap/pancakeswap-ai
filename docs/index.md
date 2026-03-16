---
layout: home

hero:
  name: PancakeSwap AI
  text: AI-Powered DeFi Tools
  tagline: Skills, plugins, and agents for integrating PancakeSwap into any AI coding assistant.
  image:
    src: /hero-rabbit.png
    alt: PancakeSwap AI Rabbit
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/
    - theme: alt
      text: View on GitHub
      link: https://github.com/pancakeswap/pancakeswap-ai

features:
  - icon: 🗺️
    title: Swap Planner
    details: Discover tokens, verify contracts, fetch prices, and generate ready-to-use deep links to the PancakeSwap UI.
    link: /skills/swap-planner
  - icon: 💧
    title: Liquidity Planner
    details: Plan LP positions across V2, V3, and StableSwap — with pool assessment, APY analysis, and deep link generation.
    link: /skills/liquidity-planner
  - icon: 🌾
    title: Farming Planner
    details: Discover farms, compare APR/APY, plan CAKE staking strategies, and generate deep links to the farming UI.
    link: /skills/farming-planner
  - icon: 🧪
    title: LLM Evaluations
    details: Promptfoo-based eval suites with llm-rubric grading. Enforce ≥ 85% pass rate on every PR.
    link: /evals/
  - icon: 🤖
    title: Agent-Agnostic
    details: Works with Claude Code, Cursor, Windsurf, Copilot, and any LLM agent that reads Markdown skills.
    link: /getting-started/#agent-agnostic-design
---

<div class="vp-doc home-extra">

## How It Works

```
User: "Swap 0.1 BNB for USDT on PancakeSwap"
        │
        ▼
[PLAN]  swap-planner skill      → deep link for UI confirmation
        │
        ▼
[PLAN]  liquidity-planner skill → LP plan with fee tier + range suggestions
```

## Supported Chains

| Chain                | V2  | V3  | Infinity | Infinity Stable | StableSwap |
| -------------------- | --- | --- | -------- | --------------- | ---------- |
| BNB Smart Chain (56) | ✅  | ✅  | ✅       | ✅              | ✅         |
| Ethereum (1)         | ✅  | ✅  | —        | —               | ✅         |
| Arbitrum One (42161) | ✅  | ✅  | —        | —               | ✅         |
| Base (8453)          | ✅  | ✅  | ✅       | —               | —          |
| zkSync Era (324)     | ✅  | ✅  | —        | —               | —          |
| Linea (59144)        | ✅  | ✅  | —        | —               | —          |
| opBNB (204)          | ✅  | ✅  | —        | —               | —          |
| Monad (143)          | ✅  | ✅  | —        | —               | —          |
</div>
