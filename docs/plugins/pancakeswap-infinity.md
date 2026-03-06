# pancakeswap-infinity

Security-first AI tools for developing PancakeSwap Infinity (v4) hooks.

## Metadata

| Field | Value |
|-------|-------|
| **Name** | `pancakeswap-infinity` |
| **Version** | 1.0.0 |
| **Author** | PancakeSwap |
| **License** | MIT |
| **Keywords** | `pancakeswap`, `infinity`, `hooks`, `v4`, `security`, `audit`, `cl-pool`, `bin-pool`, `solidity` |

## Skills

### [infinity-security-foundations](/skills/infinity-security-foundations)

A comprehensive security guide for building hooks on PancakeSwap Infinity, covering:

- **Architecture Overview** — Vault-centric design, CL Pool Manager, Bin Pool Manager
- **Threat Model** — Attack vectors specific to Infinity hooks
- **Permission Flags Risk Matrix** — Which permissions are dangerous and why
- **NoOp Rug Pull Attack** — The classic hook attack pattern and how to prevent it
- **Delta Accounting Security** — Ensuring hooks settle all deltas correctly
- **Access Control** — Pool-only, owner-only, and time-locked patterns
- **Gas Budgeting** — Per-callback gas limits to avoid griefing
- **Audit Checklist** — Step-by-step review for pre-deployment
- **Base Templates** — CL and Bin pool hook starters with security built in

## Installation

::: code-group

```bash [Claude Code]
/plugin install pancakeswap-infinity
```

```bash [Manual]
cp -r packages/plugins/pancakeswap-infinity/skills/infinity-security-foundations/SKILL.md \
  .cursor/skills/infinity-security-foundations/SKILL.md
```

:::

## Quick Example

Ask your agent:

```
Write a secure Infinity CL pool hook that takes a 0.1% fee on swaps,
with proper access control and delta accounting
```

The agent reads the `infinity-security-foundations` skill and generates a Solidity hook with:

- Correct `getHooksRegistrationBitmap` flags
- `poolManagerOnly` modifier on all callbacks
- Proper `vault.take()` / `vault.settle()` delta accounting
- Gas budget enforcement
- Re-entrancy protection
