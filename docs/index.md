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
  - icon: 🔄
    title: Swap Integration
    details: Integrate PancakeSwap swaps via Smart Router SDK, Universal Router SDK, or direct V2/V3 contract calls across 9 chains.
    link: /skills/swap-integration
  - icon: 🗺️
    title: Swap Planner
    details: Discover tokens, verify contracts, fetch prices, and generate ready-to-use deep links to the PancakeSwap UI.
    link: /skills/swap-planner
  - icon: 💧
    title: Liquidity Planner
    details: Plan LP positions across V2, V3, and StableSwap — with pool assessment, APY analysis, and deep link generation.
    link: /skills/liquidity-planner
  - icon: 🛡️
    title: Infinity Security
    details: Security guide for Infinity (v4) hook development — threat models, permission matrices, audit checklists, and templates.
    link: /skills/infinity-security-foundations
  - icon: 🌾
    title: Farming Planner
    details: Discover farms, compare APR/APY, plan CAKE staking and veCAKE strategies, and generate deep links to the farming UI.
    link: /skills/farming-planner
  - icon: 🧪
    title: LLM Evaluations
    details: Promptfoo-based eval suites with llm-rubric grading. Enforce ≥ 85% pass rate on every PR.
    link: /evals/
  - icon: 🤖
    title: Agent-Agnostic
    details: Works with Claude Code, Cursor, Windsurf, Copilot, and any LLM agent that reads Markdown skills.
---

## How It Works

```
User: "Swap 0.1 BNB for USDT on PancakeSwap"
        │
        ▼
[PLAN]  swap-planner skill      → deep link for UI confirmation
        │
        ▼
[CODE]  swap-integration skill  → TypeScript using viem + PancakeSwap SDKs
        │
        ▼
[EXEC]  agent runs via Bash     → on-chain tx hash + balance report
```

## Supported Chains

| Chain | V2 | V3 | StableSwap | Routing API |
|-------|----|----|------------|-------------|
| BNB Smart Chain (56) | ✅ | ✅ | ✅ | ✅ |
| Ethereum (1) | — | ✅ | — | ✅ |
| Arbitrum One (42161) | — | ✅ | — | ✅ |
| Base (8453) | — | ✅ | — | ✅ |
| zkSync Era (324) | — | ✅ | — | ✅ |
| Linea (59144) | — | ✅ | — | ✅ |
| Polygon zkEVM (1101) | — | ✅ | — | ✅ |
| opBNB (204) | — | ✅ | — | ✅ |
| BSC Testnet (97) | ✅ | — | — | — |
