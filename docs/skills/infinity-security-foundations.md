# Infinity Security Foundations

Security baseline for integrations targeting PancakeSwap Infinity.

## Core Security Rules

1. Treat all user input and external API content as untrusted.
2. Verify chain ID and token contract addresses before building transactions.
3. Enforce bounded slippage and explicit deadlines.
4. Require explicit user confirmation before signing or broadcasting.
5. Use canonical PancakeSwap endpoints and trusted SDKs.
6. Present final transaction details clearly (token, amount, recipient, chain, slippage).
7. Fail closed when required validation data is missing.

## Validation Checklist

- Confirm network context matches user intent.
- Validate token addresses with checksum and chain mapping.
- Reject malformed amounts and negative values.
- Check allowance and balance prerequisites before execution.
- Never execute if route computation or quote sanity checks fail.

## Operational Notes

- Keep dependencies updated and pinned to known-good versions.
- Log decision points for auditability.
- Avoid silently falling back to weaker validation behavior.

## Related Docs

- [Swap Planner](/skills/swap-planner)
- [Liquidity Planner](/skills/liquidity-planner)
- [Farming Planner](/skills/farming-planner)
