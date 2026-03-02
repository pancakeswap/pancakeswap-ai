# Plugins

PancakeSwap AI ships two plugins, each packaging one or more skills for a specific domain.

## Plugin Architecture

```
packages/plugins/
├── pancakeswap-driver/         # Swap & liquidity planning + deep links
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── skills/
│       ├── swap-planner/
│       │   └── SKILL.md
│       └── liquidity-planner/
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
| [`pancakeswap-driver`](/plugins/pancakeswap-driver) | `swap-planner`, `liquidity-planner` | Plan swaps and LP positions with deep links to the PancakeSwap UI |
| [`pancakeswap-farming`](/plugins/pancakeswap-farming) | `farming-planner` | Plan yield farming, CAKE staking, and reward harvesting |

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
  "name": "pancakeswap-driver",
  "version": "1.0.0",
  "description": "AI-powered planning for PancakeSwap swaps and liquidity",
  "author": {
    "name": "PancakeSwap",
    "email": "chef.sanji@pancakeswap.com"
  },
  "keywords": ["pancakeswap", "swap", "liquidity", "defi"],
  "license": "MIT",
  "skills": ["./skills/swap-planner", "./skills/liquidity-planner"]
}
```

## Adding a New Plugin

1. Create `packages/plugins/your-plugin-name/`
2. Add `.claude-plugin/plugin.json` with skill declarations
3. Add `skills/your-skill/SKILL.md` with YAML frontmatter
4. Run `node scripts/validate-plugin.cjs` to validate
5. Add an eval suite under `evals/suites/your-skill/`
6. Update this docs site with a new plugin page
