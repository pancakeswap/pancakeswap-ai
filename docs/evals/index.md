# Evaluations

PancakeSwap AI uses [Promptfoo](https://promptfoo.dev/) to evaluate skill quality through automated LLM-graded tests.

## Overview

Each skill has a corresponding eval suite that tests whether an LLM agent produces correct, complete, and secure output when given the skill as context.

```
evals/
└── suites/
    ├── swap-integration/
    │   ├── promptfoo.yaml         # Eval config
    │   ├── cases/                 # Test case prompts
    │   │   ├── basic-swap.md
    │   │   ├── permit2-flow.md
    │   │   └── multi-hop.md
    │   └── rubrics/               # Grading criteria
    │       ├── correctness.txt
    │       └── completeness.txt
    ├── swap-planner/
    │   ├── promptfoo.yaml
    │   ├── cases/
    │   └── rubrics/
    ├── liquidity-planner/
    │   ├── promptfoo.yaml
    │   ├── cases/
    │   └── rubrics/
    └── infinity-security-foundations/
        ├── promptfoo.yaml
        ├── cases/
        └── rubrics/
```

## How It Works

1. **Skill content** is injected as context via a template variable (`{{skill_content}}`)
2. **Test cases** provide user requests (e.g., "Write a swap script for USDT → CAKE on BSC")
3. The LLM generates a response
4. **Assertions** grade the response:
   - `llm-rubric` — LLM judges the output against a rubric (e.g., correctness, security)
   - `contains` — checks for required strings (e.g., `@pancakeswap/smart-router`)
   - `not-contains` — ensures dangerous patterns are absent

## Eval Configuration

Example from `swap-integration`:

```yaml
description: 'swap-integration Skill Evaluation'

prompts:
  - |
    You are an AI coding assistant. The user has loaded the following skill:

    <skill>
    {{skill_content}}
    </skill>

    Now answer the following user request:

    <user_request>
    {{case_content}}
    </user_request>

providers:
  - id: anthropic:claude-sonnet-4-5-20250929
    config:
      temperature: 0
      max_tokens: 8192

defaultTest:
  options:
    timeout: 180000
  vars:
    skill_content: file://path/to/SKILL.md

tests:
  - vars:
      case_content: file://cases/basic-swap.md
    assert:
      - type: llm-rubric
        value: file://rubrics/correctness.txt
        threshold: 0.8
      - type: contains
        value: '@pancakeswap/smart-router'
      - type: contains
        value: 'getBestTrade'
```

## Running Evals

```bash
# Set your API key
export ANTHROPIC_API_KEY=your-key

# Run individual suites
npm run test:evals:swap-integration
npm run test:evals:swap-planner
npm run test:evals:liquidity-planner
npm run test:evals:infinity-security

# Run all evals
npm run test:evals

# View results in the browser
npx promptfoo view
```

## Quality Bar

All PRs must maintain **≥ 85% pass rate** on every eval suite. This ensures skill changes don't degrade agent output quality.

## Assertion Types

| Type | Purpose | Example |
|------|---------|---------|
| `llm-rubric` | LLM grades output against criteria | "Code uses correct contract addresses" |
| `contains` | Output must include string | `@pancakeswap/smart-router` |
| `not-contains` | Output must not include string | Hardcoded private keys |
| `cost` | Keeps inference cost under budget | `< 0.50` |

## Writing New Evals

1. Create a directory under `evals/suites/your-skill/`
2. Add `promptfoo.yaml` with provider config and default test options
3. Write test cases in `cases/` — each is a Markdown file with a user request
4. Write rubrics in `rubrics/` — grading criteria the LLM judge uses
5. Add a script entry in `package.json`:
   ```json
   "test:evals:your-skill": "npx promptfoo eval --config evals/suites/your-skill/promptfoo.yaml"
   ```
6. Run and iterate until pass rate ≥ 85%
