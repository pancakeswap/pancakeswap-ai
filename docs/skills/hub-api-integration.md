# hub-api-integration

> **Plugin:** [`pancakeswap-hub`](/plugins/pancakeswap-hub) · **Model:** Sonnet · **Version:** 1.1.0

Design and generate the integration spec for embedding PCS Hub swap functionality into an external UI.

## Overview

This skill **produces an integration specification and deliverables** — not a swap planner. The output is a complete, ready-to-implement spec covering frontend screens, API contract, channel UX differences, and fallback logic for wallet apps, mobile apps, webviews, or headless bots.

## What It Produces

- Frontend screen specs (quote, route, confirmation, success/error states)
- Hub API contract reference (quote and execution endpoints, request/response shapes)
- Channel-specific UX guidance (PancakeSwap, Trust Wallet, Binance Wallet, headless)
- Error handling and fallback strategies
- Code snippets for fetching quotes and parsing routing data

## Integration Flow

```
1. Gather Requirements   → Target chains, UI type, channel, auth setup
2. Design Screens        → Quote → Route → Confirm → Execute → Result
3. API Contract          → Quote endpoint, route parsing, execution handoff
4. Channel UX            → Deep link format or headless payload per channel
5. Error Handling        → Slippage, price impact, token resolution failures
6. Deliver Spec          → Markdown spec + code snippets
```

## Supported Chain

PCS Hub currently supports **BSC (Chain ID: 56)** only.

## Usage Examples

```
I'm building a mobile wallet — how do I embed PCS Hub swaps?
Generate an integration spec for a browser extension that needs token swaps
Show me how to fetch Hub quotes and route data via API
How do I add PCS Hub to my wallet app?
```

## Full Reference

See the [source SKILL.md](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-hub/skills/hub-api-integration/SKILL.md) for the complete integration guide.
