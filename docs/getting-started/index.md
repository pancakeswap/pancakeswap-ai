# Introduction

PancakeSwap AI is a collection of **AI-consumable skills and plugins** that teach coding agents how to integrate the PancakeSwap ecosystem — swaps, liquidity, and yield farming — correctly and securely.

## What Are Skills?

A **skill** is a Markdown file (`SKILL.md`) with YAML frontmatter that an LLM agent reads as a structured instruction set. Skills contain:

- **Decision guides** — which integration method to choose
- **Code templates** — working TypeScript/Solidity snippets
- **Contract addresses** — verified, per-chain address tables
- **Validation rules** — security checks, slippage bounds, gas budgets
- **Anti-patterns** — common mistakes with explicit warnings

When a user says _"swap 0.1 BNB for USDT on PancakeSwap"_, the agent loads the relevant skill, follows its instructions, and generates correct, production-ready code.

## What Are Plugins?

A **plugin** bundles one or more skills into a distributable package with metadata (`plugin.json`). PancakeSwap AI ships three core plugins:

| Plugin                | Skills                              | Purpose                                                 |
| --------------------- | ----------------------------------- | ------------------------------------------------------- |
| `pancakeswap-driver`  | `swap-planner`, `liquidity-planner` | Plan swaps and LP positions with deep links             |
| `pancakeswap-farming` | `farming-planner`                   | Plan yield farming, CAKE staking, and reward harvesting |

## Agent-Agnostic Design

Skills are plain Markdown — they work with any LLM agent:

- **Claude Code** — install via plugin marketplace
- **Cursor** — add as a cursor rule or skill
- **Windsurf** — load as context
- **GitHub Copilot** — reference from `.github/copilot-instructions.md`

## Next Steps

- [Installation](/getting-started/installation) — set up the repo and install plugins
- [Quick Start](/getting-started/quick-start) — run your first swap in under 5 minutes
- [Plugins](/plugins/) — browse all plugins
- [Skills](/skills/) — read the full skill reference
