# infinity-security-foundations

> **Plugin:** [`pancakeswap-infinity`](/plugins/pancakeswap-infinity) · **Model:** Opus · **Version:** 1.0.0

A comprehensive security guide for developing hooks on PancakeSwap Infinity (v4).

## Overview

PancakeSwap Infinity uses a vault-centric architecture with two pool managers:

- **CL Pool Manager** — Concentrated Liquidity pools (similar to Uniswap V4)
- **Bin Pool Manager** — Discretized liquidity bins (unique to PancakeSwap)

Hooks attach to pools and execute custom logic at key lifecycle points (swap, add/remove liquidity, donate).

## Table of Contents

The skill covers these security topics in depth:

### 1. Architecture Overview
Vault-centric design, pool manager roles, hook lifecycle, and how CL and Bin pools differ.

### 2. Threat Model
Attack vectors specific to Infinity hooks — reentrancy, price manipulation, flash loan attacks, access control bypasses.

### 3. Permission Flags Risk Matrix
Each hook permission flag rated by risk level, with guidance on which flags to enable and why.

### 4. NoOp Rug Pull Attack
The most dangerous hook pattern — how a malicious hook can steal funds by returning custom deltas via `beforeSwap` NoOp. Detection and prevention strategies.

### 5. Delta Accounting Security
Ensuring hooks properly settle all deltas with `vault.take()` and `vault.settle()`. Common mistakes that lead to stuck funds.

### 6. Access Control Patterns
- `poolManagerOnly` — restrict callbacks to the pool manager
- `ownerOnly` — admin functions
- Time-locked operations for governance

### 7. Gas Budgeting
Per-callback gas limits to prevent griefing attacks where a hook consumes excessive gas.

### 8. Audit Checklist
Step-by-step review checklist for pre-deployment security review.

### 9. Base Templates
Starter Solidity contracts for both CL and Bin pool hooks with security best practices built in.

## Example: CL Pool Hook

```solidity
contract MySwapFeeHook is CLBaseHook {
    using PoolIdLibrary for PoolKey;

    constructor(ICLPoolManager _poolManager)
        CLBaseHook(_poolManager) {}

    function getHooksRegistrationBitmap()
        external pure override returns (uint16) {
        return _hooksRegistrationBitmapFrom(
            Permissions({
                beforeSwap: true,
                afterSwap: false,
                // ... other permissions
            })
        );
    }

    function beforeSwap(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external override poolManagerOnly returns (bytes4, BeforeSwapDelta, uint24) {
        // Custom swap fee logic here
        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
}
```

## Full Reference

See the [source SKILL.md](https://github.com/pancakeswap/pancakeswap-ai/blob/main/packages/plugins/pancakeswap-infinity/skills/infinity-security-foundations/SKILL.md) for the complete 1,100+ line security guide.
