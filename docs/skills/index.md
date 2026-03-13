# Skills

Skills are the core building blocks of PancakeSwap AI. Each skill is a Markdown file (`SKILL.md`) with YAML frontmatter that tells an LLM agent exactly how to perform a task.

## All Skills

| Skill | Plugin | Model | Description |
|-------|--------|-------|-------------|
| [`swap-planner`](/skills/swap-planner) | `pancakeswap-driver` | Sonnet | Plan swaps with token discovery and deep link generation |
| [`liquidity-planner`](/skills/liquidity-planner) | `pancakeswap-driver` | Sonnet | Plan LP positions with pool assessment and APY analysis |
| [`infinity-security-foundations`](/skills/infinity-security-foundations) | `pancakeswap-infinity` | Opus | Security guide for Infinity hook development |
| [`farming-planner`](/skills/farming-planner) | `pancakeswap-farming` | Sonnet | Plan yield farming, CAKE staking, and deep links |

## Skill Anatomy

Every skill file follows the same structure:

```markdown
---
name: skill-name
description: When to activate this skill (trigger phrases)
allowed-tools: Read, Write, Edit, Bash(npm:*)
model: opus
license: MIT
metadata:
  author: pancakeswap
  version: '1.0.0'
---

# Skill Title

Content: decision guides, code templates, address tables,
validation rules, anti-patterns, and more.
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique skill identifier |
| `description` | Yes | Trigger phrases — when the agent should load this skill |
| `allowed-tools` | Yes | Tools the agent may use while executing this skill |
| `model` | No | Recommended LLM model (opus, sonnet) |
| `license` | No | License for the skill content |
| `metadata.author` | No | Author name |
| `metadata.version` | No | Semantic version |

## Design Principles

1. **Self-contained** — each skill has everything an agent needs (addresses, ABIs, code templates)
2. **Decision-first** — start with a decision guide so the agent picks the right approach
3. **Correct by default** — code templates use verified addresses and safe defaults
4. **Anti-pattern aware** — explicitly call out common mistakes with `::: danger` blocks
5. **Chain-aware** — tables map every address and behavior to specific chain IDs
6. **Testable** — each skill has a corresponding eval suite under `evals/suites/`
