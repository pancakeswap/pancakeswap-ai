# pancakeswap-ai

AI tools (skills, plugins, agents) for the PancakeSwap ecosystem. Helps developers and AI agents integrate PancakeSwap swaps, discover tokens, and interact with PancakeSwap contracts.

## Overview

This monorepo is adapted for the PancakeSwap ecosystem. It uses Nx for monorepo management, Promptfoo for AI evaluations, and follows agent-agnostic design principles.

## Repository Structure

```
pancakeswap-ai/
├── .claude/                  # Claude Code permissions
├── .claude-plugin/           # Marketplace configuration
├── evals/                    # Promptfoo evaluation suites
│   ├── promptfoo.yaml        # Root eval config
│   ├── rubrics/              # Shared evaluation rubrics
│   └── suites/               # Per-skill eval suites
│       ├── swap-planner/       # pancakeswap-driver skill evals
│       ├── liquidity-planner/  # pancakeswap-driver skill evals
│       ├── farming-planner/    # pancakeswap-farming skill evals
├── packages/
│   └── plugins/              # Claude Code plugins
│       ├── pancakeswap-driver/    # Swap planner + liquidity planner + swap integration skills
│       ├── pancakeswap-farming/   # Farming planner (CAKE staking, yield farms)
│       └── pancakeswap-hub/       # Hub swap planner + API integration skills
├── scripts/
│   └── validate-plugin.cjs   # Plugin validation
├── CLAUDE.md                 # This file — developer + project instructions
├── AGENTS.md                 # Machine-readable skill index for AI agents
├── nx.json                   # Nx workspace config
├── package.json              # Root package (workspaces)
└── tsconfig.base.json        # Base TypeScript config
```

## Plugins

### pancakeswap-driver

**Purpose:** Plan swaps and liquidity positions, generate deep links to the PancakeSwap interface.

**Skills:**

- `swap-planner` — Discover tokens, verify contracts, fetch prices, and generate pancakeswap.finance deep links.
- `liquidity-planner` — Plan LP positions (V2, V3, StableSwap), assess pool liquidity/APY, recommend fee tiers and price ranges, generate liquidity deep links.
- `collect-fees` — Check and collect LP fees from PancakeSwap V3 and Infinity (v4) positions.
- `swap-integration` — Integrate PancakeSwap swaps into applications using the Smart Router or Universal Router SDK. Use when building a swap frontend, writing swap scripts, or integrating swap functionality into a smart contract.

**Install:**

```bash
claude plugin add @pancakeswap/pancakeswap-driver
```

### pancakeswap-hub

**Purpose:** Plan and integrate swaps through PCS Hub, a distribution channel layer for partner wallets and apps.

**Skills:**

- `hub-swap-planner` — Plan swaps through PCS Hub and generate a channel-specific handoff link for partner integrations (e.g. Binance Wallet, Trust Wallet).
- `hub-api-integration` — Help apps and distribution channels embed PCS Hub quote/swap functionality into their frontend.

**Install:**

```bash
claude plugin add @pancakeswap/pancakeswap-hub
```

### pancakeswap-farming

**Purpose:** Plan yield farming and CAKE staking on PancakeSwap.

**Skills:**

- `farming-planner` — Discover active farms, compare APR/APY, plan CAKE staking (Syrup Pools), LP farming strategies, and generate deep links to PancakeSwap farming UI.
- `harvest-rewards` — Check pending CAKE and partner-token rewards across V2 farms, V3 farms, Infinity farms, and Syrup Pools. Generates harvest deep links.

**Install:**

```bash
claude plugin add @pancakeswap/pancakeswap-farming
```

## Development

### Requirements

- Node.js >= 22.x
- npm >= 11.7.0

### Setup

```bash
npm install
```

### Adding a Plugin

1. Create `packages/plugins/your-plugin-name/`
2. Add `.claude-plugin/plugin.json` (see existing plugins for format)
3. Add `skills/your-skill/SKILL.md` with frontmatter
4. Add `package.json` and `project.json`
5. Register in `.claude-plugin/marketplace.json`
6. Run `node scripts/validate-plugin.cjs` to validate
7. Add eval suite in `evals/suites/your-skill/`

### Modifying a Skill

1. Edit the `SKILL.md` file in the relevant skill directory
2. Bump the `version` in the skill frontmatter AND in `.claude-plugin/plugin.json`
3. Update the eval suite if behavior changes
4. Run evals to verify: `npx promptfoo eval --config evals/suites/swap-planner/promptfoo.yaml`

### Code Quality

```bash
# Format all files
npx nx format:write

# Lint
npx nx run-many --target=lint --all

# Validate plugins
node scripts/validate-plugin.cjs

# Lint markdown
npm exec markdownlint-cli2 -- --fix "**/*.md" "#node_modules"
```

## Evals

Evaluations use [Promptfoo](https://promptfoo.dev) with LLM-as-judge rubrics.

### Running Evals

```bash
# Run swap-planner evals
npx promptfoo eval --config evals/suites/swap-planner/promptfoo.yaml

# Run liquidity-planner evals
npx promptfoo eval --config evals/suites/liquidity-planner/promptfoo.yaml

# Run farming-planner evals
npx promptfoo eval --config evals/suites/farming-planner/promptfoo.yaml

# View results
npx promptfoo view
```

### Setting Up Eval API Keys

```bash
export ANTHROPIC_API_KEY=your-key-here
```

### Eval Pass Threshold

PRs should maintain ≥85% pass rate on all eval suites.

### Adding Eval Cases

1. Add a `.md` file to `evals/suites/<suite-name>/cases/`
2. Add a test entry in `evals/suites/<suite-name>/promptfoo.yaml`
3. Add rubric assertions appropriate to the test

## Skill Structure

Each skill is a Markdown file with YAML frontmatter:

```yaml
---
name: skill-name
description: When to invoke this skill (used by skill discovery)
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm:*), WebFetch
model: opus|sonnet
license: MIT
metadata:
  author: pancakeswap
  version: 'X.Y.Z'
---
# Skill Title

Content of the skill...
```

## Agent-Agnostic Design

This repo is designed to work with **any** LLM coding agent (Claude Code, Cursor, Copilot, etc.):

- `AGENTS.md` is a machine-readable skill index — agents fetch it to discover skills, invocation patterns, and install commands
- Skills use plain Markdown — no vendor-specific formats
- Prompts avoid Claude-specific instructions
- Tool permissions are declared in skill frontmatter (enforced by Claude Code, advisory for others)

## PancakeSwap Resources

- Developer Docs: <https://developer.pancakeswap.finance/>
- PancakeSwap App: <https://pancakeswap.finance/>
- BSCScan: <https://bscscan.com/>
- GitHub: <https://github.com/pancakeswap/>
- Smart Router SDK: `@pancakeswap/smart-router`
- Universal Router SDK: `@pancakeswap/universal-router-sdk`

## License

MIT
