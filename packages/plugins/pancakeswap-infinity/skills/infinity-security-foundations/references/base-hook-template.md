# PancakeSwap Infinity Hook Templates

## Overview

This document provides production-ready templates for PancakeSwap Infinity hooks implementing the CL (Concentrated Liquidity) and Bin pool architectures. All templates follow security best practices from the audit checklist.

---

## Template 1: CL Base Hook (Concentrated Liquidity)

Complete template for hooks on CL pools with correct imports and patterns.

### File: `InfinityHook.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {CLBaseHook} from "infinity-hooks/src/pool-cl/CLBaseHook.sol";
import {ICLPoolManager} from "infinity-core/src/pool-cl/interfaces/ICLPoolManager.sol";
import {IVault} from "infinity-core/src/interfaces/IVault.sol";
import {PoolKey} from "infinity-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "infinity-core/src/types/PoolId.sol";
import {BalanceDelta} from "infinity-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "infinity-core/src/types/BeforeSwapDelta.sol";
import {Currency} from "infinity-core/src/types/Currency.sol";
import {Hooks} from "infinity-core/src/libraries/Hooks.sol";

/// @title InfinityHook
/// @notice Base implementation for PancakeSwap Infinity CL hooks
/// @dev Extends CLBaseHook with comprehensive permission management
contract InfinityHook is CLBaseHook {
    using PoolIdLibrary for PoolKey;
    using BeforeSwapDeltaLibrary for BeforeSwapDelta;

    // ============== STATE ==============

    /// @notice The vault contract
    IVault public vault;

    /// @notice The pool manager contract
    ICLPoolManager public poolManager;

    /// @notice Hook admin (two-step transfer pattern)
    address public admin;
    address public pendingAdmin;

    /// @notice Whitelisted routers that can call this hook
    mapping(address router => bool approved) public whitelistedRouters;

    // ============== EVENTS ==============

    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event AdminTransferInitiated(address indexed newAdmin);
    event RouterWhitelisted(address indexed router);
    event RouterRemoved(address indexed router);

    // ============== MODIFIERS ==============

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyVault() {
        require(msg.sender == address(vault), "Only Vault");
        _;
    }

    modifier onlyPoolManager() {
        require(msg.sender == address(poolManager), "Only PoolManager");
        _;
    }

    // ============== CONSTRUCTOR ==============

    /// @notice Initialize the hook with PoolManager and Vault references
    /// @param _poolManager The Infinity CL pool manager
    /// @param _vault The Infinity vault
    constructor(ICLPoolManager _poolManager, IVault _vault) {
        require(address(_poolManager) != address(0), "Invalid PoolManager");
        require(address(_vault) != address(0), "Invalid Vault");

        poolManager = _poolManager;
        vault = _vault;
        admin = msg.sender;
    }

    // ============== PERMISSION CONFIGURATION ==============

    /// @notice Returns all hook permissions (disabled by default)
    /// @dev Only enable permissions for callbacks this hook actually implements
    function getHookPermissions()
        public
        pure
        override
        returns (Permissions memory)
    {
        return Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            noOp: false,
            accessLocked: false
        });
    }

    // ============== VAULT INTERACTION ==============

    /// @notice Called by vault when lock is acquired
    /// @dev Process batch operations that need vault lock context
    /// @param data Encoded parameters for processing
    /// @return Encoded result or empty bytes
    function lockAcquired(bytes calldata data)
        external
        override
        onlyVault
        returns (bytes memory)
    {
        // EXAMPLE: Decode and process data
        // (uint256 amount, bytes memory additionalData) = abi.decode(data, (uint256, bytes));

        // Process operations with vault lock held
        // This is safe because we're inside vault.lock() context

        return abi.encode(true);
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

    // ============== ADMIN FUNCTIONS ==============

    /// @notice Initiate admin transfer (two-step pattern)
    /// @param newAdmin Address of new admin
    function initiateAdminTransfer(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin");
        pendingAdmin = newAdmin;
        emit AdminTransferInitiated(newAdmin);
    }

    /// @notice Accept admin transfer
    function acceptAdminTransfer() external {
        require(msg.sender == pendingAdmin, "Only pending admin");
        address previousAdmin = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit AdminTransferred(previousAdmin, admin);
    }

    /// @notice Whitelist a router address
    /// @param router Router contract to whitelist
    function whitelistRouter(address router) external onlyAdmin {
        require(router != address(0), "Invalid router");
        whitelistedRouters[router] = true;
        emit RouterWhitelisted(router);
    }

    /// @notice Remove a router from whitelist
    /// @param router Router contract to remove
    function removeRouter(address router) external onlyAdmin {
        whitelistedRouters[router] = false;
        emit RouterRemoved(router);
    }

    // ============== EMERGENCY ==============

    /// @notice Emergency pause (implementation-specific)
    function pause() external onlyAdmin {
        // Implement pause logic as needed
        // Consider multi-sig for critical operations
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
import {IVault} from "infinity-core/src/interfaces/IVault.sol";
import {PoolKey} from "infinity-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "infinity-core/src/types/PoolId.sol";
import {BalanceDelta} from "infinity-core/src/types/BalanceDelta.sol";
import {Currency} from "infinity-core/src/types/Currency.sol";

/// @title InfinityBinHook
/// @notice Base implementation for PancakeSwap Infinity Bin hooks
/// @dev Extends BinBaseHook with binomial pool-specific callbacks
contract InfinityBinHook is BinBaseHook {
    using PoolIdLibrary for PoolKey;

    // ============== STATE ==============

    IVault public vault;
    IBinPoolManager public poolManager;
    address public admin;
    address public pendingAdmin;

    mapping(address router => bool approved) public whitelistedRouters;

    // ============== EVENTS ==============

    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event RouterWhitelisted(address indexed router);

    // ============== MODIFIERS ==============

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyVault() {
        require(msg.sender == address(vault), "Only Vault");
        _;
    }

    modifier onlyPoolManager() {
        require(msg.sender == address(poolManager), "Only PoolManager");
        _;
    }

    // ============== CONSTRUCTOR ==============

    constructor(IBinPoolManager _poolManager, IVault _vault) {
        require(address(_poolManager) != address(0), "Invalid PoolManager");
        require(address(_vault) != address(0), "Invalid Vault");

        poolManager = _poolManager;
        vault = _vault;
        admin = msg.sender;
    }

    // ============== PERMISSIONS ==============

    function getHookPermissions()
        public
        pure
        override
        returns (Permissions memory)
    {
        return Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            noOp: false,
            accessLocked: false
        });
    }

    // ============== VAULT INTERACTION ==============

    function lockAcquired(bytes calldata data)
        external
        override
        onlyVault
        returns (bytes memory)
    {
        // Bin-specific processing
        return abi.encode(true);
    }

    // ============== BIN-SPECIFIC CALLBACKS ==============

    /// @notice Example: BeforeSwap for Bin pools
    /// @dev Bin pools have continuous pricing; handle differently than CL
    /*
    function beforeSwap(
        address sender,
        PoolKey calldata key,
        IBinPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4) {
        require(whitelistedRouters[sender] || sender == address(this), "Unauthorized");

        // Validate binId range and amounts
        // Note: Bin pools use binId instead of tick

        return this.beforeSwap.selector;
    }
    */

    /// @notice Example: AfterSwap for Bin pools
    /*
    function afterSwap(
        address sender,
        PoolKey calldata key,
        IBinPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4) {
        require(whitelistedRouters[sender] || sender == address(this), "Unauthorized");

        // Process multi-bin swap result

        return this.afterSwap.selector;
    }
    */

    /// @notice Example: BeforeRemoveLiquidity for multiple bins
    /*
    function beforeRemoveLiquidity(
        address sender,
        PoolKey calldata key,
        IBinPoolManager.RemoveLiquidityParams calldata params,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4) {
        require(whitelistedRouters[sender] || sender == address(this), "Unauthorized");

        // Validate removal from multiple bins
        // params.ids and params.amounts must align

        return this.beforeRemoveLiquidity.selector;
    }
    */

    // ============== ADMIN ==============

    function initiateAdminTransfer(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin");
        pendingAdmin = newAdmin;
    }

    function acceptAdminTransfer() external {
        require(msg.sender == pendingAdmin, "Only pending admin");
        admin = pendingAdmin;
        pendingAdmin = address(0);
    }

    function whitelistRouter(address router) external onlyAdmin {
        whitelistedRouters[router] = true;
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

In `getHookPermissions()`, set only required flags to `true`:

```solidity
function getHookPermissions()
    public
    pure
    override
    returns (Permissions memory)
{
    return Permissions({
        beforeInitialize: false,
        afterInitialize: false,
        beforeAddLiquidity: true,  // ← Enable only if needed
        afterAddLiquidity: true,   // ← Enable only if needed
        beforeRemoveLiquidity: false,
        afterRemoveLiquidity: false,
        beforeSwap: false,
        afterSwap: false,
        beforeDonate: false,
        afterDonate: false,
        noOp: false,
        accessLocked: false
    });
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
