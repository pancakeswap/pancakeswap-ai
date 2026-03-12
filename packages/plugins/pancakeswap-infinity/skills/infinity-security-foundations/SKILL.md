---
name: infinity-security-foundations
description: Security guide for PancakeSwap Infinity hook development. Covers threat models, permission flags, delta accounting, access control, and common vulnerabilities for CL and Bin pool hooks.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash:forge:*
  - Bash:cast:*
  - WebFetch
model: opus
license: MIT
metadata:
  author: pancakeswap
  version: 1.1.0
---

# PancakeSwap Infinity Security Foundations

A comprehensive security guide for developing hooks on PancakeSwap Infinity. This skill adapts Uniswap v4's security principles for Infinity's vault-centric, dual pool architecture (Concentrated Liquidity and Bin pools).

## No-Argument Invocation

If this skill was invoked with no specific request — the user simply typed the skill name
(e.g. `/infinity-security-foundations`) without asking about a specific security topic — output
the help text below **exactly as written** and then stop. Do not begin any workflow.

---

**PancakeSwap Infinity Security Foundations**

A security guide for developing hooks on PancakeSwap Infinity (v4) — covering threat models,
permission flags, delta accounting, access control patterns, and common vulnerabilities.

**How to use:** Ask about a specific security topic, request a hook template, or describe
your hook and ask for a security review.

**Examples:**
- `Give me a base CL pool hook template`
- `What permission flags should I use for a before-swap hook?`
- `Review my hook for reentrancy and delta accounting issues`

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Threat Model](#threat-model)
3. [Permission Flags Risk Matrix](#permission-flags-risk-matrix)
4. [NoOp Rug Pull Attack Pattern](#noop-rug-pull-attack-pattern)
5. [Delta Accounting Security](#delta-accounting-security)
6. [Access Control & Verification](#access-control--verification)
7. [Router Verification & Allowlisting](#router-verification--allowlisting)
8. [Token Handling Hazards](#token-handling-hazards)
9. [Base Hook Template](#base-hook-template)
10. [Security Checklist](#security-checklist)
11. [Gas Budget Guidelines](#gas-budget-guidelines)
12. [Risk Scoring System](#risk-scoring-system)
13. [Bin Pool Considerations](#bin-pool-considerations)

---

## Architecture Overview

PancakeSwap Infinity differs fundamentally from Uniswap v4 in its core architecture:

### Key Architectural Differences

| Component               | Uniswap v4                         | PancakeSwap Infinity                            |
| ----------------------- | ---------------------------------- | ----------------------------------------------- |
| **Settlement Model**    | PoolManager.unlock                 | Vault.lock + lockAcquired                       |
| **Pool Types**          | Single (concentrated)              | Dual: CL (CLPoolManager) + Bin (BinPoolManager) |
| **Hook Base Contracts** | BaseHook                           | CLBaseHook, BinBaseHook                         |
| **Entry Point**         | poolManager.execute()              | vault.lock(data)                                |
| **Permission Bits**     | 8 CL hooks                         | 14 CL hooks + Bin-specific                      |
| **Fee Override**        | beforeSwap returns BeforeSwapDelta | returns (bytes4, BeforeSwapDelta, uint24)       |
| **Token Transfer**      | Direct transfers                   | vault.sync() → transfer → vault.settle()        |

### Critical Imports (PancakeSwap Infinity)

```solidity
// CORRECT for PancakeSwap Infinity
import {CLBaseHook} from "infinity-hooks/src/pool-cl/CLBaseHook.sol";
import {ICLPoolManager} from "infinity-core/src/pool-cl/interfaces/ICLPoolManager.sol";
import {IVault} from "infinity-core/src/interfaces/IVault.sol";
import {PoolKey} from "infinity-core/src/types/PoolKey.sol";
import {BalanceDelta} from "infinity-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta} from "infinity-core/src/types/BeforeSwapDelta.sol";

// INCORRECT - Do NOT use Uniswap v4 imports
// import {BaseHook} from "v4-core/BaseHook.sol";
// import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
```

---

## Threat Model

### 1. **Vault Caller Impersonation**

**Risk**: Attacker contracts may impersonate legitimate callers to vault.lock()

**Attack Vector**:

```solidity
// VULNERABLE: Hook doesn't verify true caller
function beforeSwap(address sender, PoolKey calldata key, ICLPoolManager.SwapParams calldata params, bytes calldata)
    external
    override
    returns (bytes4, BeforeSwapDelta, uint24)
{
    // sender could be ANY address in the execution chain
    // attacker could craft a transaction where sender != actual user
    balances[sender] += params.amountSpecified;
    return (this.beforeSwap.selector, BeforeSwapDelta.wrap(0), 0);
}
```

**Mitigation**: Verify vault in constructor; hooks are always called from vault context

```solidity
constructor(ICLPoolManager _poolManager, IVault _vault) {
    poolManager = _poolManager;
    vault = _vault;
}

function beforeSwap(...) external override returns (bytes4, BeforeSwapDelta, uint24) {
    // Vault verification is implicit; only vault can call this hook
    // sender parameter is trusted within vault.lock(data) execution
}
```

### 2. **Hook Permission Escalation**

**Risk**: Hooks registered with excessive permissions can be exploited

**Attack**: Hook registered with ALL 14 permissions but only needs 2

**Mitigation**: Register hooks with minimum required permissions during pool initialization

### 3. **Delta Accounting Manipulation**

**Risk**: Incorrect BalanceDelta reporting during vault settlement

**Attack Vector**: Hook reports delta that doesn't match actual token transfers

**Mitigation**: Ensure strict accounting in vault.lock() → sync() → transfer → settle() flow

### 4. **Dual Pool Type Confusion**

**Risk**: CL hook called on Bin pool or vice versa

**Attack**: CLBaseHook used for Bin pool, causing interface mismatch

**Mitigation**: Explicitly validate pool type in beforeInitialize callback

---

## Permission Flags Risk Matrix

### CL Pool Hook Permissions (14 bits)

| Permission | Hook Callback                   | Risk Level | Ability                                         |
| ---------- | ------------------------------- | ---------- | ----------------------------------------------- |
| 0x0001     | beforeInitialize                | CRITICAL   | Prevent pool creation, observe key              |
| 0x0002     | afterInitialize                 | HIGH       | Observe initial state                           |
| 0x0004     | beforeAddLiquidity              | CRITICAL   | Drain liquidity, reject deposits                |
| 0x0008     | afterAddLiquidity               | HIGH       | State changes after LP adds                     |
| 0x0010     | beforeRemoveLiquidity           | CRITICAL   | Prevent exits, DOS liquidity providers          |
| 0x0020     | afterRemoveLiquidity            | HIGH       | Track LP exits                                  |
| 0x0040     | beforeSwap                      | CRITICAL   | Prevent swaps, manipulate pricing, fee override |
| 0x0080     | afterSwap                       | HIGH       | Track swap data                                 |
| 0x0100     | beforeDonate                    | MEDIUM     | Reject donations                                |
| 0x0200     | afterDonate                     | MEDIUM     | Track donations                                 |
| 0x0400     | beforeSwapReturnDelta           | CRITICAL   | Return arbitrary delta, cause vault loss        |
| 0x0800     | afterSwapReturnDelta            | CRITICAL   | Modify output amounts                           |
| 0x1000     | afterAddLiquidityReturnDelta    | CRITICAL   | Mint more LP tokens than earned                 |
| 0x2000     | afterRemoveLiquidityReturnDelta | CRITICAL   | Give away vault tokens                          |

### Risk Classification

- **CRITICAL**: Permission can directly steal funds or DOS protocol
- **HIGH**: Permission can cause state inconsistencies or prevent legitimate operations
- **MEDIUM**: Permission can reduce LP/user convenience but no direct loss

### Bin Pool Permissions (Unique)

Bin pools have slightly different callback signatures. Verify with BinPoolManager interface:

- beforeInitialize, afterInitialize (same as CL)
- beforeSwap, afterSwap (different signature - uses binDelta)
- beforeAddLiquidity, beforeRemoveLiquidity (Bin-specific delta types)

---

## NoOp Rug Pull Attack Pattern

### The Attack

A malicious hook can extract user funds while appearing to execute legitimate operations:

```solidity
// MALICIOUS HOOK EXAMPLE
contract MaliciousHook is CLBaseHook {
    address attacker;

    constructor(ICLPoolManager _poolManager, IVault _vault)
        CLBaseHook(_poolManager, _vault)
    {
        attacker = msg.sender;
    }

    // Registered with beforeSwap + afterSwapReturnDelta permissions
    function beforeSwap(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        // Silently allow the swap
        return (this.beforeSwap.selector, BeforeSwapDelta.wrap(0), 0);
    }

    function afterSwapReturnDelta(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        BalanceDelta calldata swapDelta,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (int128)
    {
        // Return negative delta to extract funds from vault
        // If swap output was 100 tokens, return -50 to pocket 50 tokens
        int128 stealAmount = int128(int256(swapDelta.amount0()) / 2);

        // Transfer stolen tokens to attacker
        IERC20(key.currency0).transfer(attacker, uint128(stealAmount));

        // Return modified delta to fool vault accounting
        return swapDelta.amount0() - stealAmount;
    }
}
```

### Why This Works

1. Hook is approved during pool initialization
2. `afterSwapReturnDelta` is called AFTER swap execution completes
3. Hook modifies the reported delta without vault verification
4. Vault settles based on **hook's reported delta**, not actual token transfers
5. Difference is pocketed by attacker

### Mitigation Pattern

```solidity
// SECURE: Validate all deltas before returning
contract SecureHook is CLBaseHook {
    function afterSwapReturnDelta(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        BalanceDelta calldata swapDelta,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (int128)
    {
        // NEVER modify swap amounts
        // Return exact delta received from pool

        // Optionally: Log, emit events, or update state
        // BUT: Do not steal from vault

        // Returning swapDelta.amount0() passes through the full delta
        // unmodified — the hook takes nothing. Returning 0 is only valid
        // when the hook has already settled any claimed amounts via the vault.
        return swapDelta.amount0(); // Return unmodified
    }
}
```

**Key Rule**: `*ReturnDelta` hooks MUST return values that match actual pool execution. Auditors will specifically check for delta manipulation.

---

## Delta Accounting Security

### The Vault Settlement Flow

Understanding this flow is critical for security:

```
1. vault.lock(bytes data)
   ↓
2. poolManager.swap() → calls beforeSwap hook
   ↓
3. Swap execution in pool (tokens NOT transferred yet)
   ↓
4. poolManager calls afterSwap hook
   ↓
5. poolManager calls afterSwapReturnDelta hook (may modify delta)
   ↓
6. Control returns to vault.lockAcquired callback
   ↓
7. vault.sync() - read balances before transfers
   ↓
8. User transfers tokens OUT / receives tokens IN
   ↓
9. vault.settle(currency, amount, payer) - verify balances match deltas
   ↓
10. Complete
```

### Critical Security Points

#### Point A: Don't Lie About Balances

```solidity
// VULNERABLE
function lockAcquired(bytes calldata data) external returns (bytes memory) {
    (PoolKey memory key, uint256 amountIn) = abi.decode(data, (PoolKey, uint256));

    // WRONG: Assume vault has amountIn without checking
    uint256 balance = IERC20(address(key.currency0)).balanceOf(address(vault));
    require(balance >= amountIn); // May fail - sync not called yet!
}
```

#### Point B: Call sync() Before Transfers

```solidity
// CORRECT: Sync must happen before all transfers
function lockAcquired(bytes calldata data) external returns (bytes memory) {
    // 1. Execute swaps (via vault.lock callback)
    // 2. Call vault.sync() to update internal balance state
    vault.sync(key.currency0);

    // 3. NOW transfer tokens
    IERC20(address(key.currency0)).transferFrom(sender, address(vault), amountIn);

    // 4. Call vault.settle() to verify
    vault.settle(key.currency0, int256(amountIn), sender);
}
```

#### Point C: Return Deltas Match Actual Transfers

```solidity
// SECURE: Deltas must match reality
function afterSwapReturnDelta(...) external override returns (int128) {
    // swapDelta.amount0() = what pool calculated
    // Must return exactly this (or audit-approved logic)
    return swapDelta.amount0();
}
```

### Gas Considerations in Delta Accounting

Avoid excessive state reads in callbacks:

```solidity
// INEFFICIENT: Multiple balance reads
function beforeSwap(...) external override returns (...) {
    uint256 bal1 = IERC20(token0).balanceOf(vault); // Gas: 2600
    uint256 bal2 = IERC20(token1).balanceOf(vault); // Gas: 2600
    // ... more reads ...
}

// EFFICIENT: Store in constructor, read once per tx if needed
mapping(address => uint256) cachedBalances;

function beforeSwap(...) external override returns (...) {
    // Use cached or accept single read
}
```

---

## Access Control & Verification

### CLBaseHook onlyPoolManager Pattern

PancakeSwap Infinity's `CLBaseHook` provides `onlyPoolManager` modifier:

```solidity
contract MyHook is CLBaseHook {
    constructor(ICLPoolManager _poolManager, IVault _vault)
        CLBaseHook(_poolManager, _vault)
    {}

    // ALL hook callbacks must use onlyPoolManager
    function beforeSwap(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        bytes calldata data
    )
        external
        override
        onlyPoolManager  // <-- REQUIRED
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        // Code here is only reachable from poolManager
        return (this.beforeSwap.selector, BeforeSwapDelta.wrap(0), 0);
    }
}
```

### Vault Verification

The vault is immutable and verified at construction:

```solidity
contract MyHook is CLBaseHook {
    IVault public immutable vault;
    ICLPoolManager public immutable poolManager;

    constructor(ICLPoolManager _poolManager, IVault _vault)
        CLBaseHook(_poolManager, _vault)
    {
        // CLBaseHook constructor stores these immutably
        vault = _vault;
        poolManager = _poolManager;
    }

    function getPoolManager() external view returns (ICLPoolManager) {
        return poolManager;
    }

    function getVault() external view returns (IVault) {
        return vault;
    }
}
```

### No Admin Keys

Infinity hooks should NOT have upgradeable admin patterns:

```solidity
// DANGEROUS: Avoid this pattern
contract BadHook is CLBaseHook {
    address admin;

    function updateAdmin(address newAdmin) external {
        require(msg.sender == admin);
        admin = newAdmin; // <-- Can change behavior post-deployment
    }
}

// CORRECT: Immutable after deployment
contract GoodHook is CLBaseHook {
    // No admin; immutable from CLBaseHook constructor
}
```

---

## Router Verification & Allowlisting

### Caller Verification Pattern

For hooks that interact with routers or swappers:

```solidity
contract RouterAwareHook is CLBaseHook {
    mapping(address => bool) allowlistedRouters;

    constructor(
        ICLPoolManager _poolManager,
        IVault _vault,
        address[] memory routers
    )
        CLBaseHook(_poolManager, _vault)
    {
        for (uint256 i = 0; i < routers.length; i++) {
            allowlistedRouters[routers[i]] = true;
        }
    }

    function beforeSwap(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        // Verify sender is allowlisted router
        require(allowlistedRouters[sender], "RouterAwareHook: unauthorized sender");

        // Process swap
        return (this.beforeSwap.selector, BeforeSwapDelta.wrap(0), 0);
    }
}
```

### Allowlist Registration

```solidity
contract AllowlistHook is CLBaseHook {
    mapping(address => bool) public allowlist;
    address public constant PANCAKESWAP_ROUTER = address(0) /* INSERT ROUTER ADDRESS */;

    constructor(ICLPoolManager _poolManager, IVault _vault)
        CLBaseHook(_poolManager, _vault)
    {
        allowlist[PANCAKESWAP_ROUTER] = true;
    }

    function beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4)
    {
        require(allowlist[sender], "Not allowlisted");
        return this.beforeAddLiquidity.selector;
    }
}
```

---

## Token Handling Hazards

### Fee-on-Transfer Tokens

**Problem**: Token reduces amount during transfer

```solidity
// VULNERABLE
function beforeSwap(...) external override returns (...) {
    IERC20 token = IERC20(address(key.currency0));
    uint256 balanceBefore = token.balanceOf(address(vault));

    // Simulate transfer
    uint256 simulatedAmount = 1000 * 10**18;

    // WRONG: Assume 1000 received, but FOT token gives only 950
    require(balanceBefore >= simulatedAmount);
}
```

**Mitigation**:

```solidity
// SECURE: Check actual balance change
function beforeSwap(...) external override returns (...) {
    IERC20 token = IERC20(address(key.currency0));
    uint256 balanceBefore = token.balanceOf(address(vault));

    // Perform transfer
    token.transferFrom(sender, address(vault), 1000 * 10**18);

    // Check actual received
    uint256 balanceAfter = token.balanceOf(address(vault));
    uint256 actualReceived = balanceAfter - balanceBefore;

    require(actualReceived > 0, "No tokens received (FOT?)");
}
```

### Rebasing Tokens

**Problem**: Balance changes without transfers (e.g., staking rewards)

```solidity
// VULNERABLE: Assume balance stability in callback
function beforeSwap(...) external override returns (...) {
    uint256 vaultBalance = IERC20(token).balanceOf(address(vault)); // 100
    // ... processing ...
    uint256 sameBalance = IERC20(token).balanceOf(address(vault)); // 105 (rebased!)
    // State corruption
}
```

**Mitigation**: Use vault.sync() to normalize state before operations

### ERC-777 Reentrancy

**Problem**: Hooks triggered during token transfers via ERC-777

```solidity
// VULNERABLE: ERC-777 sender can trigger external calls
function beforeSwap(...) external override returns (...) {
    // If token is ERC-777, this transfer triggers tokensToSend hook
    // Attacker's hook can reenter this contract
    IERC20(token).transferFrom(sender, vault, amount);

    // Balance may change due to reentrancy
}
```

**Mitigation**: Use checks-effects-interactions pattern; complete state updates before transfers

```solidity
// SECURE: Update state BEFORE transfers
function beforeSwap(...) external override returns (...) {
    // 1. Update internal state
    swapState.recorded = true;

    // 2. Only then transfer (last interaction)
    IERC20(token).transferFrom(sender, vault, amount);
}
```

### Blocklist Tokens

**Problem**: Some tokens can blacklist addresses (USDC with blacklist), causing transfers to fail

**Mitigation**: Assume any transfer can fail; have fallback logic or revert gracefully

---

## Base Hook Template

### Minimal Secure CL Hook

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {CLBaseHook} from "infinity-hooks/src/pool-cl/CLBaseHook.sol";
import {ICLPoolManager} from "infinity-core/src/pool-cl/interfaces/ICLPoolManager.sol";
import {IVault} from "infinity-core/src/interfaces/IVault.sol";
import {PoolKey} from "infinity-core/src/types/PoolKey.sol";
import {BalanceDelta} from "infinity-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta} from "infinity-core/src/types/BeforeSwapDelta.sol";

contract SecureHookTemplate is CLBaseHook {
    // ===== State =====

    // Track hook state
    mapping(bytes32 => uint256) public poolStates;

    // ===== Constructor =====

    constructor(ICLPoolManager _poolManager, IVault _vault)
        CLBaseHook(_poolManager, _vault)
    {}

    // ===== Hook Callbacks (14 CL permissions) =====

    function beforeInitialize(
        address sender,
        PoolKey calldata key,
        uint160 sqrtPriceX96,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4)
    {
        // Validate pool configuration
        require(sqrtPriceX96 > 0, "Invalid price");
        return this.beforeInitialize.selector;
    }

    function afterInitialize(
        address sender,
        PoolKey calldata key,
        uint160 sqrtPriceX96,
        int24 tick,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4)
    {
        // Record pool initialization
        bytes32 poolId = keccak256(abi.encode(key));
        poolStates[poolId] = uint256(sqrtPriceX96);
        return this.afterInitialize.selector;
    }

    function beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4)
    {
        // Validate liquidity additions
        require(params.liquidityDelta > 0, "Invalid delta");
        return this.beforeAddLiquidity.selector;
    }

    function afterAddLiquidity(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.ModifyLiquidityParams calldata params,
        BalanceDelta calldata delta,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4)
    {
        // Log LP additions
        return this.afterAddLiquidity.selector;
    }

    function beforeRemoveLiquidity(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4)
    {
        return this.beforeRemoveLiquidity.selector;
    }

    function afterRemoveLiquidity(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.ModifyLiquidityParams calldata params,
        BalanceDelta calldata delta,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4)
    {
        return this.afterRemoveLiquidity.selector;
    }

    function beforeSwap(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        // Optional: fee override logic
        uint24 feeOverride = 0; // Use default fee
        return (this.beforeSwap.selector, BeforeSwapDelta.wrap(0), feeOverride);
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        BalanceDelta calldata swapDelta,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4)
    {
        return this.afterSwap.selector;
    }

    function beforeDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4)
    {
        return this.beforeDonate.selector;
    }

    function afterDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (bytes4)
    {
        return this.afterDonate.selector;
    }

    // ===== Return Delta Hooks (CRITICAL SECURITY) =====

    function beforeSwapReturnDelta(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (int128)
    {
        // Return 0 - no delta modification
        return 0;
    }

    function afterSwapReturnDelta(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        BalanceDelta calldata swapDelta,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (int128)
    {
        // Returning swapDelta.amount0() passes through the full delta
        // unmodified (hook takes nothing). Returning 0 is only valid when
        // the hook has already settled any claimed amounts via the vault.
        return swapDelta.amount0();
    }

    function afterAddLiquidityReturnDelta(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.ModifyLiquidityParams calldata params,
        BalanceDelta calldata delta,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (int128, int128)
    {
        // Return unmodified deltas
        return (delta.amount0(), delta.amount1());
    }

    function afterRemoveLiquidityReturnDelta(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.ModifyLiquidityParams calldata params,
        BalanceDelta calldata delta,
        bytes calldata data
    )
        external
        override
        onlyPoolManager
        returns (int128, int128)
    {
        // Return unmodified deltas
        return (delta.amount0(), delta.amount1());
    }
}
```

---

## Security Checklist

Before deploying any Infinity hook, verify:

1. **Hook Permissions**

   - [ ] Only minimum required permissions are registered
   - [ ] No unnecessary CRITICAL permissions (beforeSwap, \*ReturnDelta)
   - [ ] Pool manager verifies permissions during initialization

2. **Access Control**

   - [ ] All callbacks use `onlyPoolManager` modifier
   - [ ] No external functions that modify hook state
   - [ ] Constructor stores poolManager and vault as immutable

3. **Delta Accounting**

   - [ ] All `*ReturnDelta` hooks return unmodified or audit-approved deltas
   - [ ] No stealing from vault via delta manipulation
   - [ ] Delta math is overflow/underflow safe

4. **Token Safety**

   - [ ] Handles fee-on-transfer tokens gracefully
   - [ ] Uses vault.sync() before critical operations
   - [ ] Checks actual balance changes, not assumed amounts
   - [ ] No reentrancy vulnerabilities with ERC-777

5. **State Management**

   - [ ] No upgradeable patterns or admin keys
   - [ ] State changes are idempotent where possible
   - [ ] Events emitted for critical operations

6. **Gas Efficiency**

   - [ ] Callbacks execute within gas budgets
   - [ ] No excessive state reads in hot paths
   - [ ] Avoid loops in hooks unless bounded

7. **Testing**

   - [ ] Unit tests for all callbacks
   - [ ] Integration tests with vault settlement
   - [ ] Fuzz tests with 10k+ runs
   - [ ] Run with `forge test --isolate`

8. **Dual Pool Support** (if applicable)

   - [ ] CLBaseHook used only for CL pools
   - [ ] Validate pool type in beforeInitialize
   - [ ] No assumptions about pool structure

9. **Fee Override Logic** (if used)

   - [ ] Fee override is deterministic
   - [ ] Fee does not exceed MAX_FEE
   - [ ] No reentrancy in fee calculation

10. **Router Verification** (if applicable)

    - [ ] Router/sender allowlisting is enforced
    - [ ] Allowlist can't be modified post-deployment
    - [ ] No logic bypasses on missing sender

11. **Error Handling**

    - [ ] Clear error messages for debugging
    - [ ] Invalid input validation in callbacks
    - [ ] No silent failures in state updates

12. **Documentation**

    - [ ] README explaining hook behavior
    - [ ] NatSpec comments on all functions
    - [ ] Security assumptions documented

13. **Audits**
    - [ ] Professional audit before mainnet
    - [ ] Report issues fixed before deployment
    - [ ] Gas optimization review

---

## Gas Budget Guidelines

Hook callbacks have strict gas budgets. Exceed them and transactions revert.

### Per-Callback Gas Limits

| Callback                        | Approx Budget | Notes                       |
| ------------------------------- | ------------- | --------------------------- |
| beforeInitialize                | 20,000        | Validation only             |
| afterInitialize                 | 20,000        | State updates okay          |
| beforeAddLiquidity              | 50,000        | May check LP status         |
| afterAddLiquidity               | 50,000        | Update tracking             |
| beforeRemoveLiquidity           | 50,000        | Validate removal            |
| afterRemoveLiquidity            | 50,000        | Cleanup                     |
| beforeSwap                      | 100,000       | Can be expensive; fee logic |
| afterSwap                       | 50,000        | Log swap data               |
| beforeDonate                    | 20,000        | Minimal                     |
| afterDonate                     | 20,000        | Minimal                     |
| beforeSwapReturnDelta           | 20,000        | Return only                 |
| afterSwapReturnDelta            | 20,000        | Return delta                |
| afterAddLiquidityReturnDelta    | 20,000        | Return delta                |
| afterRemoveLiquidityReturnDelta | 20,000        | Return delta                |

### Optimization Tips

```solidity
// INEFFICIENT: 3 storage reads = 6000 gas
function beforeSwap(...) external override returns (...) {
    uint256 a = state.value1;
    uint256 b = state.value2;
    uint256 c = state.value3;
    return (...);
}

// EFFICIENT: 1 storage read via immutable
uint256 public immutable staticValue;

function beforeSwap(...) external override returns (...) {
    uint256 value = staticValue; // Only 3 gas
    return (...);
}
```

---

## Risk Scoring System

Use this framework when evaluating hooks for audit:

### Scoring (1-10, higher = riskier)

**Permission Risk**: Number of CRITICAL permissions used

- 0 CRITICAL = 1 point
- 1 CRITICAL = 5 points
- 2+ CRITICAL = 10 points

**Delta Manipulation Risk**: Does hook modify deltas?

- Never modifies = 1 point
- Modifies with clear audit trail = 5 points
- Modifies without documentation = 10 points

**State Complexity**: Number of storage mappings

- < 3 = 1 point
- 3-10 = 5 points
- > 10 = 10 points

**External Call Risk**: Calls to other contracts

- No calls = 1 point
- Calls to audited contracts = 5 points
- Calls to user-supplied contracts = 10 points

**Gas Risk**: Expected gas usage vs budget

- < 50% budget = 1 point
- 50-80% budget = 5 points
- > 80% budget = 10 points

### Final Score

```
Total = (Permission + Delta + State + External + Gas) / 5

1-2   = Green (low risk)
2-5   = Yellow (medium risk, audit recommended)
5-8   = Orange (high risk, deep audit required)
8-10  = Red (critical risk, redesign recommended)
```

---

## Bin Pool Considerations

PancakeSwap Infinity's Bin pools are unique to PancakeSwap and differ from CL pools:

### Key Differences

| Aspect                     | CL Pools                  | Bin Pools                          |
| -------------------------- | ------------------------- | ---------------------------------- |
| **Liquidity Distribution** | Concentrated around ticks | Distributed across bins            |
| **Tick Size**              | Dynamic (1.0001^n)        | Fixed bin width (0.5%)             |
| **Hook Type**              | CLBaseHook                | BinBaseHook                        |
| **Delta Types**            | int128 (amount0, amount1) | BinDelta (similar but bin-indexed) |
| **Fee Model**              | Per-basis-points          | Can vary per bin                   |
| **Callback Signature**     | Uses tick-based params    | Uses bin-based params              |

### BinBaseHook Import

```solidity
import {BinBaseHook} from "infinity-hooks/src/pool-bin/BinBaseHook.sol";
import {IBinPoolManager} from "infinity-core/src/pool-bin/interfaces/IBinPoolManager.sol";

contract MyBinHook is BinBaseHook {
    constructor(IBinPoolManager _poolManager, IVault _vault)
        BinBaseHook(_poolManager, _vault)
    {}
}
```

### Bin-Specific Callbacks

Bin pools don't have all 14 CL callbacks. Key differences:

- **beforeSwap/afterSwap**: Different signature (uses bins, not ticks)
- **beforeAddLiquidity/afterAddLiquidity**: Bin-specific amounts
- **No tick-based callbacks**

### Migration from CL to Bin

If bridging CL hooks to Bin:

1. Create separate BinBaseHook contract (don't reuse CL hook)
2. Map CL tick logic to Bin bucket logic
3. Revalidate all permission assumptions
4. Test thoroughly - Bin math differs significantly

**Never assume CL logic works on Bin pools without explicit testing.**

---

---

## Additional Resources

- **PancakeSwap Infinity Documentation**: [infinity.pancakeswap.finance/docs](https://docs.pancakeswap.finance)
- **Existing Audits**: Hexens, OtterSec, Zellic reports (in infinity-core repo)
- **Hook Examples**: [infinity-hooks repository](https://github.com/pancakeswap/pancakeswap-infinity-hooks)
- **Testing Framework**: Foundry (`forge test --isolate`)

---

## Summary

Developing hooks for PancakeSwap Infinity requires:

1. **Understanding vault-centric architecture** — Not like Uniswap v4
2. **Minimizing permissions** — Only enable required callbacks
3. **Never manipulating deltas** — Return accurate BalanceDelta values
4. **Careful token handling** — Account for edge cases
5. **Extensive testing** — Especially fuzz tests and integration tests
6. **Audit readiness** — Clear code, NatSpec, security patterns

Hook security is **shared responsibility**. Protocol can enforce onlyPoolManager, but hooks must not betray that trust.

---

**Last Updated**: February 2026
**License**: MIT
**Maintainer**: PancakeSwap Team
