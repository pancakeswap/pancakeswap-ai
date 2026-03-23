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
│       └── farming-planner/    # pancakeswap-farming skill evals
├── packages/
│   └── plugins/              # Claude Code plugins
│       ├── pancakeswap-driver/    # Swap planner + liquidity planner skills
│       └── pancakeswap-farming/   # Farming planner (CAKE staking, yield farms)
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

**Install:**
```bash
npx skills add https://github.com/pancakeswap/pancakeswap-ai --skill swap-planner
npx skills add https://github.com/pancakeswap/pancakeswap-ai --skill liquidity-planner
```

### pancakeswap-farming

**Purpose:** Plan yield farming, CAKE staking, and reward harvesting on PancakeSwap.

**Skills:**
- `farming-planner` — Discover active farms, compare APR/APY, plan CAKE staking (Syrup Pools), LP farming strategies, and generate deep links to PancakeSwap farming UI.

**Install:**
```bash
npx skills add https://github.com/pancakeswap/pancakeswap-ai --skill farming-planner
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

To update the `pcs-skill` router itself, edit `skills/pcs-skill/SKILL.md` then run `node scripts/sync-pcs-skill.cjs` to mirror it into the plugin package.

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

- `AGENTS.md` is a machine-readable **namespace registry** — agents fetch it to discover skill groups, trigger conditions, and links to full skill documents. It is intentionally lightweight (~200 tokens) so agents load only the namespaces they need.
- Each namespace links to a `SKILL.md` file containing the full operational instructions, parameter definitions, and examples. Agents fetch individual skill documents on demand (progressive disclosure).
- Skills use plain Markdown — no vendor-specific formats
- Prompts avoid Claude-specific instructions
- Tool permissions are declared in skill frontmatter (enforced by Claude Code, advisory for others)

### Namespace organization

Skills are grouped into DeFi primitive namespaces: `pcs-trading` (swaps), `pcs-liquidity` (LP positions), `pcs-yield` (farming/staking). When adding new skills, register them in the appropriate namespace or propose a new one in `AGENTS.md` before writing the `SKILL.md`.

## PancakeSwap Resources

- Developer Docs: <https://developer.pancakeswap.finance/>
- PancakeSwap App: <https://pancakeswap.finance/>
- BSCScan: <https://bscscan.com/>
- GitHub: <https://github.com/pancakeswap/>
- Smart Router SDK: `@pancakeswap/smart-router`
- Universal Router SDK: `@pancakeswap/universal-router-sdk`

## License

MIT
