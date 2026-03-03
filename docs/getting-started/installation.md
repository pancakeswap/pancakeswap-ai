# Installation

## Prerequisites

- **Node.js** >= 22.x
- **npm** >= 11.7.0

## Clone & Install

```bash
git clone https://github.com/pancakeswap/pancakeswap-ai.git
cd pancakeswap-ai
npm install
```

## Validate Plugins

Run the built-in validation script to ensure all plugins are correctly structured:

```bash
node scripts/validate-plugin.cjs
```

Expected output:

```
✅ pancakeswap-driver — all checks passed
✅ pancakeswap-infinity — all checks passed
✅ pancakeswap-farming — all checks passed
```

## Install via Claude Code Marketplace

If you're using Claude Code, install directly from the plugin marketplace:

```bash
# Add all plugins
/plugin marketplace add pancakeswap/pancakeswap-ai

# Or install individual plugins
/plugin install pancakeswap-driver
/plugin install pancakeswap-infinity
/plugin install pancakeswap-farming
```

## Install in Cursor

Copy the relevant `SKILL.md` file into your Cursor workspace:

```bash
# Example: swap-planner skill
cp packages/plugins/pancakeswap-driver/skills/swap-planner/SKILL.md \
   .cursor/skills/swap-planner/SKILL.md
```

Or reference the skill path in your Cursor rules configuration.

## Environment Variables

Some features require environment variables:

| Variable | Required For | Description |
|----------|-------------|-------------|
| `ANTHROPIC_API_KEY` | LLM evals | Anthropic API key for promptfoo evals |

::: warning
Never use a mainnet private key in environment variables.
:::
