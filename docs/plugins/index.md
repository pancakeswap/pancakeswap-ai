# Plugins

PancakeSwap AI ships four plugins, each packaging one or more skills for a specific domain.

## Plugin Architecture

```
packages/plugins/
├── pancakeswap-trading/        # Swap integration (SDK + contracts)
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── skills/
│   │   └── swap-integration/
│   │       └── SKILL.md
│   └── agents/
│       └── swap-integration-expert.md
├── pancakeswap-driver/         # Swap & liquidity planning + deep links
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── skills/
│       ├── swap-planner/
│       │   └── SKILL.md
│       └── liquidity-planner/
│           └── SKILL.md
├── pancakeswap-infinity/       # Infinity (v4) hook security
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── skills/
│       └── infinity-security-foundations/
│           └── SKILL.md
└── pancakeswap-farming/        # Yield farming & CAKE staking
    ├── .claude-plugin/
    │   └── plugin.json
    └── skills/
        └── farming-planner/
            └── SKILL.md
```

## At a Glance

| Plugin | Skills | Description |
|--------|--------|-------------|
| [`pancakeswap-trading`](/plugins/pancakeswap-trading) | `swap-integration` | Integrate swaps via Routing API, Smart Router SDK, or direct V2/V3 contracts |
| [`pancakeswap-driver`](/plugins/pancakeswap-driver) | `swap-planner`, `liquidity-planner` | Plan swaps and LP positions with deep links to the PancakeSwap UI |
| [`pancakeswap-infinity`](/plugins/pancakeswap-infinity) | `infinity-security-foundations` | Security guide for Infinity hook development |
| [`pancakeswap-farming`](/plugins/pancakeswap-farming) | `farming-planner` | Plan yield farming, CAKE staking, veCAKE, and reward harvesting |

## Plugin Structure

Every plugin follows the same structure:

```
your-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata, skill declarations
├── skills/
│   └── your-skill/
│       └── SKILL.md         # Skill definition (YAML frontmatter + Markdown)
└── agents/                  # Optional: agent prompts
    └── agent-name.md
```

### plugin.json

Each plugin declares its metadata and skill paths in `plugin.json`:

```json
{
  "name": "pancakeswap-trading",
  "version": "1.0.0",
  "description": "Integrate PancakeSwap swaps via Smart Router SDK...",
  "author": {
    "name": "PancakeSwap",
    "email": "chef.sanji@pancakeswap.com"
  },
  "keywords": ["pancakeswap", "swap", "defi"],
  "license": "MIT",
  "skills": ["./skills/swap-integration"],
  "agents": ["./agents/swap-integration-expert.md"]
}
```

## Adding a New Plugin

1. Create `packages/plugins/your-plugin-name/`
2. Add `.claude-plugin/plugin.json` with skill declarations
3. Add `skills/your-skill/SKILL.md` with YAML frontmatter
4. Run `node scripts/validate-plugin.cjs` to validate
5. Add an eval suite under `evals/suites/your-skill/`
6. Update this docs site with a new plugin page
