# PancakeSwap Infinity Hook Templates

## Overview

This document provides production-ready templates for PancakeSwap Infinity hooks implementing the CL (Concentrated Liquidity) and Bin pool architectures. All templates follow security best practices from the audit checklist.

---

## Template 1: CL Base Hook (Concentrated Liquidity)

Complete template for hooks on CL pools with correct imports and patterns.

### File: `InfinityCLHook.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {CLBaseHook} from "infinity-hooks/src/pool-cl/CLBaseHook.sol";
import {ICLPoolManager} from "infinity-core/src/pool-cl/interfaces/ICLPoolManager.sol";
import {PoolKey} from "infinity-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "infinity-core/src/types/PoolId.sol";
import {BalanceDelta} from "infinity-core/src/types/BalanceDelta.sol";
import {Currency} from "infinity-core/src/types/Currency.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title InfinityCLHook
/// @notice PancakeSwap Infinity CL hook that charges a 0.1% protocol fee on every swap.
/// @dev Fee is taken from the *unspecified* token:
///        - exactInput  → deducted from user's output (user receives less)
///        - exactOutput → added to user's cost     (user pays more)
///      afterSwap returns the fee amount so the PoolManager deducts it from the user's
///      settlement. The hook simultaneously mints vault ERC-6909 claims to itself to
///      settle its own delta. Accrued claims are withdrawn by the owner at any time
///      via withdrawFees(), which burns the claims and calls vault.take().
contract InfinityCLHook is CLBaseHook, Ownable2Step {
    using PoolIdLibrary for PoolKey;

    // ── Constants ───────────────────────────────────────────────────────────

    /// @notice 0.1% fee — 10 bps (10 / 10_000)
    uint256 private constant FEE_BIPS = 10;
    uint256 private constant FEE_DENOMINATOR = 10_000;

    // ── State ────────────────────────────────────────────────────────────────

    /// @notice Accumulated vault ERC-6909 credits per currency, claimable by owner
    mapping(Currency currency => uint256 amount) public accruedFees;

    // ── Events ───────────────────────────────────────────────────────────────

    event FeeAccrued(PoolId indexed poolId, Currency indexed currency, uint256 amount);
    event FeesWithdrawn(Currency indexed currency, address indexed recipient, uint256 amount);

    // ── Errors ───────────────────────────────────────────────────────────────

    error ZeroAddress();
    error InsufficientAccruedFees();

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(ICLPoolManager _poolManager) CLBaseHook(_poolManager) Ownable(msg.sender) {}

    // ── Permissions ──────────────────────────────────────────────────────────

    /// @notice Returns the hook's registration bitmap
    function getHooksRegistrationBitmap() external pure override returns (uint16) {
        return _hooksRegistrationBitmapFrom(
            Permissions({
                beforeInitialize: false,
                afterInitialize: false,
                beforeAddLiquidity: false,
                afterAddLiquidity: false,
                beforeRemoveLiquidity: false,
                afterRemoveLiquidity: false,
                beforeSwap: false,
                afterSwap: true,
                beforeDonate: false,
                afterDonate: false,
                beforeSwapReturnDelta: false,
                afterSwapReturnDelta: true,
                afterAddLiquidityReturnDelta: false,
                afterRemoveLiquidityReturnDelta: false
            })
        );
    }

    // ── Hook Callback ────────────────────────────────────────────────────────

    /// @notice Deducts 0.1% from the unspecified token of every swap.
    /// @param params  Original swap parameters (used to determine exact/output direction).
    /// @param delta   Actual balance changes from the swap (from the pool's perspective).
    /// @return        Function selector, and fee amount to deduct from unspecified token.
    function afterSwap(
        address, // sender — not used; PoolManager is trusted
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata
    ) external override poolManagerOnly returns (bytes4, int128) {
        // ── 1. Identify the unspecified currency ───────────────────────────
        //
        // "Unspecified" is the token whose amount the router did NOT fix:
        //   zeroForOne + exactInput  → unspecified = currency1 (output)
        //   zeroForOne + exactOutput → unspecified = currency0 (input)
        //   oneForZero + exactInput  → unspecified = currency0 (output)
        //   oneForZero + exactOutput → unspecified = currency1 (input)
        //
        // Pattern: unspecified is currency1  if (zeroForOne == exactInput)
        bool exactInput = params.amountSpecified < 0;
        bool unspecifiedIsCurrency1 = (params.zeroForOne == exactInput);

        Currency feeCurrency = unspecifiedIsCurrency1 ? key.currency1 : key.currency0;
        int128 unspecifiedDelta = unspecifiedIsCurrency1 ? delta.amount1() : delta.amount0();

        // ── 2. Compute absolute unspecified amount ──────────────────────────
        //
        // exactInput  → delta is negative (pool sends tokens out) → abs
        // exactOutput → delta is positive (pool receives tokens)  → use directly
        uint256 unspecifiedAbs =
            unspecifiedDelta < 0 ? uint256(uint128(-unspecifiedDelta)) : uint256(uint128(unspecifiedDelta));

        // ── 3. Calculate fee ────────────────────────────────────────────────
        uint256 fee = (unspecifiedAbs * FEE_BIPS) / FEE_DENOMINATOR;
        if (fee == 0) return (this.afterSwap.selector, 0);

        // ── 4. Delta accounting ─────────────────────────────────────────────
        //
        // Returning +fee in afterSwap tells the PoolManager:
        //   "the hook claims `fee` of the unspecified token."
        // This creates a positive balance delta for the hook in the vault.
        // We must settle it in the same lock context by minting vault ERC-6909
        // claims. These claims represent tokens the hook can later withdraw.
        accruedFees[feeCurrency] += fee;
        vault.mint(address(this), feeCurrency, fee); // settles hook's delta claim

        emit FeeAccrued(key.toId(), feeCurrency, fee);

        // Positive int128 → user's unspecified amount reduced by fee
        return (this.afterSwap.selector, int128(uint128(fee)));
    }

    // ============== HOOK CALLBACKS (COMMENTED TEMPLATES) ==============

    /// @notice Example: BeforeInitialize callback
    /// @dev Uncomment and implement if beforeInitialize permission is enabled
    /*
    function beforeInitialize(
        address sender,
        PoolKey calldata key,
        uint160 sqrtPriceX96,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4) {
        require(sender == address(this) || whitelistedRouters[sender], "Unauthorized");

        // Validate initialization parameters
        require(sqrtPriceX96 > 0, "Invalid price");

        return this.beforeInitialize.selector;
    }
    */

    /// @notice Example: AfterInitialize callback
    /// @dev Uncomment and implement if afterInitialize permission is enabled
    /*
    function afterInitialize(
        address sender,
        PoolKey calldata key,
        uint160 sqrtPriceX96,
        int24 tick,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4) {
        require(sender == address(this) || whitelistedRouters[sender], "Unauthorized");

        // Track pool initialization
        // Update hook state as needed

        return this.afterInitialize.selector;
    }
    */

    /// @notice Example: BeforeAddLiquidity callback
    /// @dev Uncomment and implement if beforeAddLiquidity permission is enabled
    /*
    function beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.AddLiquidityParams calldata params,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4) {
        require(sender == address(this) || whitelistedRouters[sender], "Unauthorized");
        require(params.amount0 > 0 || params.amount1 > 0, "No liquidity");

        // Validate or modify liquidity parameters

        return this.beforeAddLiquidity.selector;
    }
    */

    /// @notice Example: AfterAddLiquidity callback
    /// @dev Uncomment and implement if afterAddLiquidity permission is enabled
    /*
    function afterAddLiquidity(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.AddLiquidityParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4) {
        require(sender == address(this) || whitelistedRouters[sender], "Unauthorized");

        // Handle post-liquidity addition logic
        // Process delta accounting

        return this.afterAddLiquidity.selector;
    }
    */

    /// @notice Example: BeforeRemoveLiquidity callback
    /// @dev Uncomment and implement if beforeRemoveLiquidity permission is enabled
    /*
    function beforeRemoveLiquidity(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.RemoveLiquidityParams calldata params,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4) {
        require(sender == address(this) || whitelistedRouters[sender], "Unauthorized");

        // Validate liquidity removal

        return this.beforeRemoveLiquidity.selector;
    }
    */

    /// @notice Example: AfterRemoveLiquidity callback
    /// @dev Uncomment and implement if afterRemoveLiquidity permission is enabled
    /*
    function afterRemoveLiquidity(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.RemoveLiquidityParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4) {
        require(sender == address(this) || whitelistedRouters[sender], "Unauthorized");

        // Handle post-liquidity removal

        return this.afterRemoveLiquidity.selector;
    }
    */

    /// @notice Example: BeforeSwap callback
    /// @dev Uncomment and implement if beforeSwap permission is enabled
    /// @return selector Function selector
    /// @return delta BeforeSwapDelta (can reduce input/output, but not increase)
    /// @return hookFeeAmount Fee taken by hook (if applicable)
    /*
    function beforeSwap(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4, BeforeSwapDelta, uint24) {
        require(sender == address(this) || whitelistedRouters[sender], "Unauthorized");

        // Optional: Reduce swap amount or take fee
        // BeforeSwapDelta can only reduce, not increase amounts
        BeforeSwapDelta delta = BeforeSwapDeltaLibrary.zero();

        return (this.beforeSwap.selector, delta, 0);
    }
    */

    /// @notice Example: AfterSwap callback
    /// @dev Uncomment and implement if afterSwap permission is enabled
    /*
    function afterSwap(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4, int128) {
        require(sender == address(this) || whitelistedRouters[sender], "Unauthorized");

        // Process swap result
        // Return 0 for no additional delta

        return (this.afterSwap.selector, 0);
    }
    */

    /// @notice Example: BeforeDonate callback
    /// @dev Uncomment and implement if beforeDonate permission is enabled
    /*
    function beforeDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4) {
        require(sender == address(this) || whitelistedRouters[sender], "Unauthorized");

        // Validate donation
        require(amount0 > 0 || amount1 > 0, "No donation");

        return this.beforeDonate.selector;
    }
    */

    /// @notice Example: AfterDonate callback
    /// @dev Uncomment and implement if afterDonate permission is enabled
    /*
    function afterDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4) {
        require(sender == address(this) || whitelistedRouters[sender], "Unauthorized");

        // Handle post-donation

        return this.afterDonate.selector;
    }
    */

    // ── Vault Lock Callback ──────────────────────────────────────────────────

    /// @notice Executed by the vault during fee withdrawal (see withdrawFees).
    /// @dev Burns the hook's ERC-6909 claims and forwards underlying tokens to recipient.
    function lockAcquired(bytes calldata data) external override vaultOnly returns (bytes memory) {
        (Currency currency, address recipient, uint256 amount) = abi.decode(data, (Currency, address, uint256));

        // Burn claim tokens held by this hook, then transfer underlying to recipient
        vault.burn(address(this), currency, amount);
        vault.take(currency, recipient, amount);

        return abi.encode(true);
    }

    // ── Admin: Fee Withdrawal ────────────────────────────────────────────────

    /// @notice Withdraw accumulated protocol fees to `recipient`.
    /// @param currency  Token to withdraw.
    /// @param recipient Destination address; must not be zero.
    /// @param amount    How much to withdraw; pass 0 to withdraw entire balance.
    function withdrawFees(Currency currency, address recipient, uint256 amount) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();

        uint256 available = accruedFees[currency];
        if (amount == 0) amount = available;
        if (amount > available) revert InsufficientAccruedFees();

        // Checks-Effects-Interactions: update state before external call
        accruedFees[currency] = available - amount;

        // Acquire vault lock → lockAcquired burns claims and transfers tokens
        vault.lock(abi.encode(currency, recipient, amount));

        emit FeesWithdrawn(currency, recipient, amount);
    }

    /// @notice Override to disallow transferring ownership to zero address.
    function transferOwnership(address newOwner) public virtual override(Ownable2Step) {
        if (newOwner == address(0)) revert ZeroAddress();
        super.transferOwnership(newOwner);
    }
}
```

---

## Template 2: Bin Base Hook (Binomial Liquidity)

Shorter template showing key differences for Bin pools.

### File: `InfinityBinHook.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BinBaseHook} from "infinity-hooks/src/pool-bin/BinBaseHook.sol";
import {IBinPoolManager} from "infinity-core/src/pool-bin/interfaces/IBinPoolManager.sol";
import {PoolKey} from "infinity-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "infinity-core/src/types/PoolId.sol";
import {BalanceDelta} from "infinity-core/src/types/BalanceDelta.sol";
import {Currency} from "infinity-core/src/types/Currency.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title InfinityBinHook
/// @notice PancakeSwap Infinity Bin hook that charges a 0.1% protocol fee on every swap.
/// @dev Fee is taken from the *unspecified* token:
///        - exactInput  → deducted from user's output (user receives less)
///        - exactOutput → added to user's cost     (user pays more)
///      afterSwap returns the fee amount so the PoolManager deducts it from the user's
///      settlement. The hook simultaneously mints vault ERC-6909 claims to itself to
///      settle its own delta. Accrued claims are withdrawn by the owner at any time
///      via withdrawFees(), which burns the claims and calls vault.take().
contract InfinityBinHook is BinBaseHook, Ownable2Step {
    using PoolIdLibrary for PoolKey;

    // ── Constants ───────────────────────────────────────────────────────────

    /// @notice 0.1% fee — 10 bps (10 / 10_000)
    uint256 private constant FEE_BIPS = 10;
    uint256 private constant FEE_DENOMINATOR = 10_000;

    // ── State ────────────────────────────────────────────────────────────────

    /// @notice Accumulated vault ERC-6909 credits per currency, claimable by owner
    mapping(Currency currency => uint256 amount) public accruedFees;

    // ── Events ───────────────────────────────────────────────────────────────

    event FeeAccrued(PoolId indexed poolId, Currency indexed currency, uint256 amount);
    event FeesWithdrawn(Currency indexed currency, address indexed recipient, uint256 amount);

    // ── Errors ───────────────────────────────────────────────────────────────

    error ZeroAddress();
    error InsufficientAccruedFees();

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(IBinPoolManager _poolManager) BinBaseHook(_poolManager) Ownable(msg.sender) {}

    // ── Permissions ───────────────────────────────────────────────────────────

    /// @notice Returns the hook's registration bitmap
    function getHooksRegistrationBitmap() external pure override returns (uint16) {
        return _hooksRegistrationBitmapFrom(
            Permissions({
                beforeInitialize: false,
                afterInitialize: false,
                beforeMint: false,
                afterMint: false,
                beforeBurn: false,
                afterBurn: false,
                beforeSwap: false,
                afterSwap: true,
                beforeDonate: false,
                afterDonate: false,
                beforeSwapReturnDelta: false,
                afterSwapReturnDelta: true,
                afterMintReturnDelta: false,
                afterBurnReturnDelta: false
            })
        );
    }

    // ── Hook Callback ────────────────────────────────────────────────────────

    /// @notice Deducts 0.1% from the unspecified token of every swap.
    /// @param key             Pool key.
    /// @param swapForY        If true, swap X for Y (token0 for token1); else Y for X.
    /// @param amountSpecified Negative = exactInput, positive = exactOutput.
    /// @param delta           Actual balance changes from the swap (from the pool's perspective).
    /// @return                Function selector, and fee amount to deduct from unspecified token.
    function afterSwap(
        address,
        PoolKey calldata key,
        bool swapForY,
        int128 amountSpecified,
        BalanceDelta delta,
        bytes calldata
    ) external override poolManagerOnly returns (bytes4, int128) {
        // ── 1. Identify the unspecified currency ───────────────────────────
        //
        // swapForY + exactInput  → unspecified = currency1 (output)
        // swapForY + exactOutput → unspecified = currency0 (input)
        // swapX for Y + exactInput  → unspecified = currency1
        // Pattern: unspecified is currency1 when (swapForY == exactInput)
        bool exactInput = amountSpecified < 0;
        bool unspecifiedIsCurrency1 = (swapForY == exactInput);

        Currency feeCurrency = unspecifiedIsCurrency1 ? key.currency1 : key.currency0;
        int128 unspecifiedDelta = unspecifiedIsCurrency1 ? delta.amount1() : delta.amount0();

        // ── 2. Compute absolute unspecified amount ──────────────────────────
        uint256 unspecifiedAbs =
            unspecifiedDelta < 0 ? uint256(uint128(-unspecifiedDelta)) : uint256(uint128(unspecifiedDelta));

        // ── 3. Calculate fee ────────────────────────────────────────────────
        uint256 fee = (unspecifiedAbs * FEE_BIPS) / FEE_DENOMINATOR;
        if (fee == 0) return (this.afterSwap.selector, 0);

        // ── 4. Delta accounting ─────────────────────────────────────────────
        accruedFees[feeCurrency] += fee;
        vault.mint(address(this), feeCurrency, fee);

        emit FeeAccrued(key.toId(), feeCurrency, fee);

        return (this.afterSwap.selector, int128(uint128(fee)));
    }

    // ============== HOOK CALLBACKS (COMMENTED TEMPLATES) ==============

    /// @notice Example: BeforeInitialize callback
    /// @dev Uncomment and implement if beforeInitialize permission is enabled
    /*function beforeInitialize(address sender, PoolKey calldata key, uint24 activeId)
        external
        virtual
        poolManagerOnly
        returns (bytes4)
    {
        return _beforeInitialize(sender, key, activeId);
    }*/

    /// @notice Example: AfterInitialize callback
    /// @dev Uncomment and implement if AfterInitialize permission is enabled
    /*function afterInitialize(address sender, PoolKey calldata key, uint24 activeId)
        external
        virtual
        poolManagerOnly
        returns (bytes4)
    {
        return _afterInitialize(sender, key, activeId);
    }*/

    /// @notice Example: BeforeMint callback
    /// @dev Uncomment and implement if BeforeMint permission is enabled
    /*function beforeMint(
        address sender,
        PoolKey calldata key,
        IBinPoolManager.MintParams calldata params,
        bytes calldata hookData
    ) external virtual poolManagerOnly returns (bytes4, uint24) {
    }*/

    /// @notice Example: AfterMint callback
    /// @dev Uncomment and implement if AfterMint permission is enabled
    /*function afterMint(
        address sender,
        PoolKey calldata key,
        IBinPoolManager.MintParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external virtual poolManagerOnly returns (bytes4, BalanceDelta) {
    }*/

    /// @notice Example: BeforeBurn callback
    /// @dev Uncomment and implement if BeforeBurn permission is enabled
    /*function beforeBurn(
        address sender,
        PoolKey calldata key,
        IBinPoolManager.BurnParams calldata params,
        bytes calldata hookData
    ) external virtual poolManagerOnly returns (bytes4) {
    }*/

    /// @notice Example: AfterBurn callback
    /// @dev Uncomment and implement if AfterBurn permission is enabled
    /*function afterBurn(
        address sender,
        PoolKey calldata key,
        IBinPoolManager.BurnParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external virtual poolManagerOnly returns (bytes4, BalanceDelta) {
    }*/

    /// @notice Example: BeforeSwap callback
    /// @dev Uncomment and implement if BeforeSwap permission is enabled
    /*function beforeSwap(
        address sender,
        PoolKey calldata key,
        bool swapForY,
        int128 amountSpecified,
        bytes calldata hookData
    ) external virtual poolManagerOnly returns (bytes4, BeforeSwapDelta, uint24) {
    }*/

    /// @notice Example: AfterSwap callback
    /// @dev Uncomment and implement if AfterSwap permission is enabled
    /*function afterSwap(
        address sender,
        PoolKey calldata key,
        bool swapForY,
        int128 amountSpecified,
        BalanceDelta delta,
        bytes calldata hookData
    ) external virtual poolManagerOnly returns (bytes4, int128) {
    }*/

    /// @notice Example: BeforeDonate callback
    /// @dev Uncomment and implement if BeforeDonate permission is enabled
    /*function beforeDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata hookData
    ) external virtual poolManagerOnly returns (bytes4) {
    }*/

    /// @notice Example: AfterDonate callback
    /// @dev Uncomment and implement if AfterDonate permission is enabled
    /*function afterDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata hookData
    ) external virtual poolManagerOnly returns (bytes4) {
    }*/

    // ── Vault Lock Callback ──────────────────────────────────────────────────

    /// @notice Executed by the vault during fee withdrawal (see withdrawFees).
    /// @dev Burns the hook's ERC-6909 claims and forwards underlying tokens to recipient.
    function lockAcquired(bytes calldata data) external override vaultOnly returns (bytes memory) {
        (Currency currency, address recipient, uint256 amount) = abi.decode(data, (Currency, address, uint256));

        vault.burn(address(this), currency, amount);
        vault.take(currency, recipient, amount);

        return abi.encode(true);
    }

    // ── Owner: Fee Withdrawal ────────────────────────────────────────────────

    /// @notice Withdraw accumulated protocol fees to `recipient`.
    /// @param currency  Token to withdraw.
    /// @param recipient Destination address; must not be zero.
    /// @param amount    How much to withdraw; pass 0 to withdraw entire balance.
    function withdrawFees(Currency currency, address recipient, uint256 amount) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();

        uint256 available = accruedFees[currency];
        if (amount == 0) amount = available;
        if (amount > available) revert InsufficientAccruedFees();

        accruedFees[currency] = available - amount;

        vault.lock(abi.encode(currency, recipient, amount));

        emit FeesWithdrawn(currency, recipient, amount);
    }

    /// @notice Override to disallow transferring ownership to zero address.
    function transferOwnership(address newOwner) public virtual override(Ownable2Step) {
        if (newOwner == address(0)) revert ZeroAddress();
        super.transferOwnership(newOwner);
    }
}
```

---

## Usage Guide

### Step 1: Choose Pool Type

- **CL (Concentrated Liquidity):** Use `InfinityHook` template

  - Continuous price space, concentrated ranges
  - Use when: Custom swap fees, range-based rewards, concentrated LP strategies

- **Bin (Binomial):** Use `InfinityBinHook` template
  - Discrete bin space, fixed price points
  - Use when: Stable swaps, multi-bin operations, discrete pricing

### Step 2: Enable Needed Permissions

In `getHooksRegistrationBitmap()`, set only required flags to `true`:

```solidity
function getHooksRegistrationBitmap() external pure override returns (uint16) {
    return _hooksRegistrationBitmapFrom(
        Permissions({
            beforeInitialize:               false,
            afterInitialize:                false,
            beforeAddLiquidity:             false,
            afterAddLiquidity:              false,
            beforeRemoveLiquidity:          false,
            afterRemoveLiquidity:           false,
            beforeSwap:                     false,
            afterSwap:                      true,  // enable only if needed
            beforeDonate:                   false,
            afterDonate:                    false,
            beforeSwapReturnDelta:          false,
            afterSwapReturnDelta:           true,  // enable only if needed
            afterAddLiquidityReturnDelta:   false,
            afterRemoveLiquidityReturnDelta: false
        })
    );
}
```

### Step 3: Implement Callbacks

Uncomment relevant callback templates and implement logic:

```solidity
function beforeAddLiquidity(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.AddLiquidityParams calldata params,
    bytes calldata hookData
) external override onlyPoolManager returns (bytes4) {
    require(whitelistedRouters[sender], "Unauthorized");

    // Your logic here
    // Validate, modify, or reject

    return this.beforeAddLiquidity.selector;
}
```

### Step 4: Deploy with CREATE3

```solidity
// In deployment script
import {CREATE3} from "solmate/utils/CREATE3.sol";

bytes32 salt = keccak256(abi.encodePacked(poolKey, "v1"));
address hook = CREATE3.deploy(
    salt,
    abi.encodePacked(
        type(InfinityHook).creationCode,
        abi.encode(poolManager, vault)
    ),
    0
);

// Verify hook address matches PoolKey
require(hook == poolKey.hooks, "Hook deployment failed");
```

### Step 5: Test Thoroughly

- Run `forge test --isolate` with all tests
- Fuzz test with 10k+ runs (100k for main branch)
- Include delta accounting validation
- Test reentrancy boundaries

---

## Common Patterns

### Router Allowlisting

```solidity
mapping(address router => bool approved) public whitelistedRouters;

modifier onlyApprovedSender() {
    require(
        whitelistedRouters[msg.sender] || msg.sender == address(this),
        "Unauthorized"
    );
    _;
}

function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override onlyPoolManager onlyApprovedSender returns (bytes4, BeforeSwapDelta, uint24) {
    // Safe to execute: sender is whitelisted
}
```

### Vault Lock Processing

```solidity
function lockAcquired(bytes calldata data)
    external
    override
    onlyVault
    returns (bytes memory)
{
    // Decode parameters
    (
        address router,
        bytes memory operations
    ) = abi.decode(data, (address, bytes));

    // Validate router
    require(whitelistedRouters[router], "Unauthorized");

    // Process operations with vault.lock() held
    // Safe because no reentrancy possible

    return abi.encode(success);
}
```

### Two-Step Admin Transfer

```solidity
function initiateAdminTransfer(address newAdmin) external onlyAdmin {
    require(newAdmin != address(0), "Invalid");
    pendingAdmin = newAdmin;
}

function acceptAdminTransfer() external {
    require(msg.sender == pendingAdmin);
    admin = pendingAdmin;
    pendingAdmin = address(0);
}
```

---

## Security Reminders

1. **Always verify `msg.sender`:** Use `onlyVault` and `onlyPoolManager` modifiers
2. **Never enable unnecessary permissions:** Disable by default
3. **Whitelist routers:** Don't trust `address(msg.sender)` alone
4. **Test delta accounting:** Verify balance changes are correct
5. **Check for reentrancy:** Cannot call PoolManager from hook callbacks
6. **Use CREATE3:** Ensures hook address matches PoolKey.hooks

---

## References

- [PancakeSwap Infinity Hooks Documentation](https://docs.pancakeswap.finance/infinity/hooks)
- [Uniswap V4 Hook Architecture](https://docs.uniswap.org/contracts/v4/concepts/hooks)
- Audit Checklist: `audit-checklist.md`
