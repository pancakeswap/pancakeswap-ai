# PancakeSwap Infinity Security Vulnerabilities Catalog

## Overview

Comprehensive catalog of vulnerability patterns found in DeFi protocols, adapted for PancakeSwap Infinity's architecture. Covers the 12 main categories plus 3 Infinity-specific attack vectors.

**Applicable to:** Infinity hooks, pools (CL and Bin), and protocol integrations
**Detection Tools:** Slither, Mythril, Foundry fuzzing, Echidna
**Last Updated:** 2026-02-27

---

## 1. Access Control Vulnerabilities

### 1.1 Missing Permission Verification

Missing `msg.sender` checks in hook callbacks allows unauthorized operation.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: No msg.sender check
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    // Anyone can call this, modifying pool state
    _updateHookState(params.amountSpecified);
    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}
```

**Impact:** HIGH - Hook can be manipulated by attackers

**Mitigation:**

```solidity
// SAFE: Verify pool manager
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");
    _updateHookState(params.amountSpecified);
    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}
```

**Detection:**

- Slither: `external-function`
- Manual: Check all hook callbacks for `msg.sender` validation

---

### 1.2 Unprotected Admin Functions

Admin functions without access controls allow unauthorized state modification.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: No admin check
function setFeePercentage(uint256 newFee) external {
    feePercentage = newFee;  // Anyone can change fees
}

function emergencyPause() external {
    paused = true;  // Anyone can pause
}
```

**Impact:** HIGH - Complete loss of control

**Mitigation:**

```solidity
// SAFE: Two-step transfer pattern
address public admin;
address public pendingAdmin;

modifier onlyAdmin() {
    require(msg.sender == admin, "Only admin");
    _;
}

function initiateAdminTransfer(address newAdmin) external onlyAdmin {
    require(newAdmin != address(0), "Invalid");
    pendingAdmin = newAdmin;
}

function acceptAdminTransfer() external {
    require(msg.sender == pendingAdmin, "Only pending admin");
    admin = pendingAdmin;
    pendingAdmin = address(0);
}

function setFeePercentage(uint256 newFee) external onlyAdmin {
    require(newFee <= MAX_FEE, "Fee too high");
    feePercentage = newFee;
}
```

**Detection:**

- Slither: `unprotected-function`
- Manual: Review all state-modifying external functions

---

## 2. Delta Accounting Vulnerabilities

### 2.1 Double Settlement

Calling `vault.settle()` twice for same currency causes fund loss.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: Double settle
function lockAcquired(bytes calldata data) external override returns (bytes memory) {
    require(msg.sender == address(vault), "Only Vault");

    // Transfer tokens
    IERC20(token0).transfer(recipient, amount0);

    // ERROR: Settling twice
    vault.settle(Currency.wrap(address(token0)));
    vault.settle(Currency.wrap(address(token0)));  // ❌ Settles twice

    return "";
}
```

**Impact:** HIGH - Token accounting corruption

**Mitigation:**

```solidity
// SAFE: Single settle per currency
function lockAcquired(bytes calldata data) external override returns (bytes memory) {
    require(msg.sender == address(vault), "Only Vault");

    // Transfer tokens
    IERC20(token0).transfer(recipient, amount0);

    // Settle exactly once
    vault.settle(Currency.wrap(address(token0)));

    return "";
}
```

**Detection:**

- Manual: Trace all vault.settle() calls
- Foundry: Fuzz with multiple operations, track vault balance delta

---

### 2.2 Incorrect Delta Direction

Returning positive deltas from `beforeSwap` instead of negative violates protocol invariants.

**Vulnerable Pattern:**

```solidity
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "infinity-core/src/types/BeforeSwapDelta.sol";

// VULNERABLE: Positive delta in beforeSwap
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    // BeforeSwapDelta can only REDUCE input/output, not increase
    // ERROR: Returning positive delta
    BeforeSwapDelta delta = BeforeSwapDeltaLibrary.fromDelta(int128(1000));

    return (this.beforeSwap.selector, delta, 0);  // ❌ Increases swap
}
```

**Impact:** CRITICAL - Protocol invariant violation, allows arbitrage

**Mitigation:**

```solidity
// SAFE: Only reduce, never increase
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    // Only reduce the swap amount, never increase
    int128 reduction = params.amountSpecified > 0
        ? -int128(uint128(params.amountSpecified) / 100)  // Reduce input by 1%
        : -int128(uint128(params.amountSpecified) / 100); // Reduce output by 1%

    BeforeSwapDelta delta = BeforeSwapDeltaLibrary.fromDelta(reduction);

    return (this.beforeSwap.selector, delta, 0);  // ✓ Only reduces
}
```

**Detection:**

- Slither: `incorrect-modifier`
- Mythril: Pattern matching on BeforeSwapDelta
- Manual: Code review of delta calculations

---

## 3. Permission Misuse Vulnerabilities

### 3.1 Disabled Permission Called

Hook callback called when permission is disabled causes unexpected behavior.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: Permission disabled but callback implemented
function getHookPermissions()
    public
    pure
    override
    returns (Permissions memory)
{
    return Permissions({
        beforeSwap: false,  // ← Disabled
        afterSwap: false,
        // ... all others false
    });
}

// But afterSwap is implemented:
function afterSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    BalanceDelta delta,
    bytes calldata hookData
) external override returns (bytes4, int128) {
    // This will never be called because permission is disabled
    _updatePoolState(delta);
    return (this.afterSwap.selector, 0);
}
```

**Impact:** MEDIUM - Hook logic never executes, features don't work

**Mitigation:**

```solidity
// SAFE: Enable needed permissions
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
        afterSwap: true,  // ← Enable to match implementation
        beforeDonate: false,
        afterDonate: false,
        noOp: false,
        accessLocked: false
    });
}
```

**Detection:**

- Manual: Match enabled permissions with implemented callbacks
- Slither: Unused function warnings

---

### 3.2 Enabling Too Many Permissions

Enabling all permissions creates unnecessary attack surface.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: All permissions enabled
function getHookPermissions()
    public
    pure
    override
    returns (Permissions memory)
{
    return Permissions({
        beforeInitialize: true,
        afterInitialize: true,
        beforeAddLiquidity: true,
        afterAddLiquidity: true,
        beforeRemoveLiquidity: true,
        afterRemoveLiquidity: true,
        beforeSwap: true,
        afterSwap: true,
        beforeDonate: true,
        afterDonate: true,
        noOp: false,
        accessLocked: false
    });
}

// But most callbacks are not implemented
function beforeSwap(...) external override {
    revert("Not implemented");
}
```

**Impact:** MEDIUM - Wasted gas, potential for future bugs

**Mitigation:**

```solidity
// SAFE: Enable only needed permissions
function getHookPermissions()
    public
    pure
    override
    returns (Permissions memory)
{
    return Permissions({
        beforeInitialize: false,
        afterInitialize: false,
        beforeAddLiquidity: true,   // Only this
        afterAddLiquidity: true,    // And this
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

---

## 4. Reentrancy Vulnerabilities

### 4.1 PoolManager Callback Reentrancy

Hook callback attempts to call PoolManager, causing reentrancy.

**Vulnerable Pattern:**

```solidity
import {ICLPoolManager} from "infinity-core/src/pool-cl/interfaces/ICLPoolManager.sol";

// VULNERABLE: Reentrancy in beforeSwap
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // ERROR: Calling back into PoolManager during callback
    poolManager.swap(key, params, "");  // ❌ Reentrancy!

    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}
```

**Impact:** CRITICAL - Reentrancy attack, token theft

**Mitigation:**

```solidity
// SAFE: Process in lockAcquired, not callback
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // Store swap info for processing later
    pendingSwap = SwapInfo(key, params);

    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}

// Process after vault.unlock()
function lockAcquired(bytes calldata data) external override returns (bytes memory) {
    require(msg.sender == address(vault), "Only Vault");

    // Safe to call PoolManager here (outside lock)
    if (pendingSwap.key.toId() != PoolId.wrap(bytes32(0))) {
        poolManager.swap(pendingSwap.key, pendingSwap.params, "");
    }

    return "";
}
```

**Detection:**

- Mythril: Reentrancy detection
- Manual: Code review of hook callbacks
- Foundry: Test with reentrant contract

---

### 4.2 Vault Lock Reentrancy

Attempting nested `vault.lock()` calls.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: Nested lock
function lockAcquired(bytes calldata data) external override returns (bytes memory) {
    require(msg.sender == address(vault), "Only Vault");

    // ERROR: Cannot nest vault.lock()
    vault.lock(abi.encode(nestedData));  // ❌ Will revert or corrupt

    return "";
}
```

**Impact:** HIGH - Operation fails, state corruption

**Mitigation:**

```solidity
// SAFE: Process all in single lock context
function lockAcquired(bytes calldata data) external override returns (bytes memory) {
    require(msg.sender == address(vault), "Only Vault");

    // Decode and process all operations in this single lock
    (
        bytes memory op1,
        bytes memory op2,
        bytes memory op3
    ) = abi.decode(data, (bytes, bytes, bytes));

    _processOp1(op1);
    _processOp2(op2);
    _processOp3(op3);

    return "";  // Lock released after return
}
```

---

## 5. Gas & Denial of Service

### 5.1 Unbounded Loop in Hook

Hook callback contains unbounded loop causing gas exhaustion.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: Unbounded loop
mapping(address user => uint256 data) public userData;
address[] public allUsers;

function beforeAddLiquidity(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.AddLiquidityParams calldata params,
    bytes calldata hookData
) external override returns (bytes4) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // ERROR: Iterates all users every time
    for (uint256 i = 0; i < allUsers.length; i++) {  // ❌ Unbounded
        userData[allUsers[i]] += 1;
    }

    return this.beforeAddLiquidity.selector;
}
```

**Impact:** HIGH - Swap reverts when allUsers.length is large

**Mitigation:**

```solidity
// SAFE: Bounded iteration or off-chain processing
function beforeAddLiquidity(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.AddLiquidityParams calldata params,
    bytes calldata hookData
) external override returns (bytes4) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // Only process relevant data, not all users
    require(userData[sender] < MAX_POSITIONS, "Too many positions");
    userData[sender] += 1;

    return this.beforeAddLiquidity.selector;
}

// Batch updates in separate tx
function updateUserData(address[] calldata users) external onlyAdmin {
    require(users.length <= 100, "Max 100 per batch");
    for (uint256 i = 0; i < users.length; i++) {
        _updateUserData(users[i]);
    }
}
```

**Detection:**

- Slither: `loop-indexed-variable`
- Manual: Review all loops in callbacks for unbounded iteration

---

### 5.2 Excessive Storage Writes

Writing to storage in hook callbacks causes unnecessary gas consumption.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: Many storage writes per swap
mapping(uint256 swapId => SwapData) public swapHistory;
uint256 public swapCounter;

function afterSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    BalanceDelta delta,
    bytes calldata hookData
) external override returns (bytes4, int128) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // Multiple storage writes
    swapCounter++;
    swapHistory[swapCounter] = SwapData({
        pool: key.toId(),
        amount0: delta.amount0(),
        amount1: delta.amount1(),
        timestamp: block.timestamp,
        sender: sender
    });

    return (this.afterSwap.selector, 0);
}
```

**Impact:** MEDIUM - High gas cost, potential DoS

**Mitigation:**

```solidity
// SAFE: Use events instead of storage
event SwapTracked(
    PoolId indexed poolId,
    int128 amount0,
    int128 amount1,
    address indexed sender
);

function afterSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    BalanceDelta delta,
    bytes calldata hookData
) external override returns (bytes4, int128) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    emit SwapTracked(key.toId(), delta.amount0(), delta.amount1(), sender);

    return (this.afterSwap.selector, 0);
}
```

---

## 6. Input Validation Vulnerabilities

### 6.1 Missing hookData Validation

Hook data not validated before decoding causes crashes or corruption.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: No hookData length check
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // ERROR: hookData could be too small
    (uint256 customFee, address recipient) = abi.decode(hookData, (uint256, address));

    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}
```

**Impact:** MEDIUM - Transaction reverts unexpectedly

**Mitigation:**

```solidity
// SAFE: Validate hookData size
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // Validate before decoding
    if (hookData.length > 0) {
        require(hookData.length >= 64, "Invalid hookData");
        (uint256 customFee, address recipient) = abi.decode(hookData, (uint256, address));

        require(customFee <= MAX_FEE, "Fee too high");
        require(recipient != address(0), "Invalid recipient");
    }

    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}
```

---

### 6.2 No Pool Key Validation

Pool key parameters not validated against known values.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: Accepting any pool key
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // ERROR: Not validating that this is the expected pool
    _updatePoolState(key, params.amountSpecified);

    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}
```

**Impact:** MEDIUM - Hook can be used on wrong pools

**Mitigation:**

```solidity
// SAFE: Validate pool identity
PoolKey public expectedPoolKey;

function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // Validate pool key
    require(
        key.currency0 == expectedPoolKey.currency0 &&
        key.currency1 == expectedPoolKey.currency1 &&
        key.fee == expectedPoolKey.fee,
        "Wrong pool"
    );

    _updatePoolState(key, params.amountSpecified);

    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}
```

---

## 7. State Management Vulnerabilities

### 7.1 Inconsistent State Updates

State updates not atomic, leading to inconsistency.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: Non-atomic state update
struct PoolState {
    uint256 feeCollected;
    uint256 volumeTraded;
}

mapping(PoolId => PoolState) public poolStates;

function afterSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    BalanceDelta delta,
    bytes calldata hookData
) external override returns (bytes4, int128) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    PoolState storage state = poolStates[key.toId()];

    // If txn reverts between these, state is corrupted
    state.feeCollected += calculateFee(delta);
    state.volumeTraded += uint256(int256(delta.amount0()));  // ❌ May revert

    return (this.afterSwap.selector, 0);
}
```

**Impact:** MEDIUM - State corruption

**Mitigation:**

```solidity
// SAFE: Atomic update
function afterSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    BalanceDelta delta,
    bytes calldata hookData
) external override returns (bytes4, int128) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    uint256 fee = calculateFee(delta);
    uint256 volume = uint256(int256(delta.amount0()));

    require(fee <= MAX_FEE, "Fee overflow");  // Validate before update

    PoolState storage state = poolStates[key.toId()];
    state.feeCollected += fee;
    state.volumeTraded += volume;

    return (this.afterSwap.selector, 0);
}
```

---

## 8. Upgrade & Migration Vulnerabilities

### 8.1 Hook Address Mismatch

Deployed hook address doesn't match PoolKey.hooks field.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: Manual address setting
contract InfinityHook {
    address public expectedAddress;

    constructor(address _expectedAddress) {
        expectedAddress = _expectedAddress;  // Error: Manual setting
    }
}

// Deployment
InfinityHook hook = new InfinityHook(address(0x123));  // Wrong address
PoolKey memory key = PoolKey({
    currency0: token0,
    currency1: token1,
    fee: 3000,
    hooks: address(hook)  // May not match actual address
});
```

**Impact:** CRITICAL - Hook callbacks not triggered

**Mitigation:**

```solidity
// SAFE: Use CREATE3 with deterministic address
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

// Verify address matches
require(hook == poolKey.hooks, "Hook mismatch");

// Register pool
poolManager.initialize(poolKey, initialPrice);
```

---

## 9. Vault Lock Reentrancy (Infinity-Specific)

### 9.1 Lock Depth Bypass

Attempting to bypass vault lock depth restriction.

**Vulnerable Pattern:**

```solidity
import {IVault} from "infinity-core/src/interfaces/IVault.sol";

// VULNERABLE: Attempting nested lock
function lockAcquired(bytes calldata data) external override returns (bytes memory) {
    require(msg.sender == address(vault), "Only Vault");

    // Try to bypass lock depth
    try vault.lock(abi.encode(data)) {  // ❌ Would revert
        // This won't execute
    } catch {}

    return "";
}
```

**Impact:** MEDIUM - Operation fails silently

**Mitigation:**

```solidity
// SAFE: Process everything in single lock
function lockAcquired(bytes calldata data) external override returns (bytes memory) {
    require(msg.sender == address(vault), "Only Vault");

    // Decode all operations
    (
        uint256 swapAmount,
        uint24 fee,
        bytes memory operations
    ) = abi.decode(data, (uint256, uint24, bytes));

    // Process all synchronously
    _executeOperations(operations);

    // Settle at end
    vault.settle(currency0);
    vault.settle(currency1);

    return abi.encode(success);
}
```

---

### 9.2 Dirty Lock Context

Hook state accessible outside vault lock context.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: State modified during lock, read outside
uint256 public swapAmount;

function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    swapAmount = uint256(int256(params.amountSpecified));  // Set during lock
    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}

// External function can read during lock
function getSwapAmount() external view returns (uint256) {
    return swapAmount;  // Intermediate value visible
}
```

**Impact:** LOW - Race condition risk

**Mitigation:**

```solidity
// SAFE: State only accessible after lock
mapping(address user => uint256 amount) private userSwaps;

function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // Use sender address to segregate state
    userSwaps[sender] = uint256(int256(params.amountSpecified));
    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}

function getSwapAmount(address user) external view returns (uint256) {
    return userSwaps[user];
}
```

---

## 10. Bin Pool Price Manipulation (Infinity-Specific)

### 10.1 Bin Price Oracle Attack

Manipulating bin pool prices through large trades.

**Vulnerable Pattern:**

```solidity
import {IBinPoolManager} from "infinity-core/src/pool-bin/interfaces/IBinPoolManager.sol";

// VULNERABLE: Using current bin as price without validation
function beforeSwap(
    address sender,
    PoolKey calldata key,
    IBinPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // ERROR: Using current price without TWAP
    uint256 currentPrice = getCurrentBinPrice(key);
    require(currentPrice >= expectedPrice, "Price too low");  // Easy to manipulate

    return this.beforeSwap.selector;
}
```

**Impact:** CRITICAL - Price oracle manipulation

**Mitigation:**

```solidity
// SAFE: Use TWAP oracle, not spot price
import {OracleLibrary} from "infinity-core/src/libraries/OracleLibrary.sol";

function beforeSwap(
    address sender,
    PoolKey calldata key,
    IBinPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // Use time-weighted average price
    (uint256 twapPrice, uint256 timestamp) = OracleLibrary.getTWAP(
        key,
        TWAP_DURATION  // e.g., 30 minutes
    );

    require(twapPrice >= expectedPrice * 99 / 100, "Price too low");  // 1% slippage

    return this.beforeSwap.selector;
}
```

**Detection:**

- Manual: Review price calculation in bin swap hooks
- Echidna: Fuzz price manipulation scenarios

---

### 10.2 Multi-Bin Attack

Atomically trading across multiple bins to extract value.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: No bin state validation
mapping(uint24 binId => uint256 liquidity) public binLiquidity;

function beforeAddLiquidity(
    address sender,
    PoolKey calldata key,
    IBinPoolManager.AddLiquidityParams calldata params,
    bytes calldata hookData
) external override returns (bytes4) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // Add liquidity to requested bins without validation
    for (uint256 i = 0; i < params.ids.length; i++) {
        binLiquidity[params.ids[i]] += params.amounts[i];
    }

    return this.beforeAddLiquidity.selector;
}
```

**Impact:** HIGH - Sandwich attacks across bins

**Mitigation:**

```solidity
// SAFE: Validate bin distribution and liquidity
function beforeAddLiquidity(
    address sender,
    PoolKey calldata key,
    IBinPoolManager.AddLiquidityParams calldata params,
    bytes calldata hookData
) external override returns (bytes4) {
    require(msg.sender == address(poolManager), "Only PoolManager");
    require(params.ids.length == params.amounts.length, "Length mismatch");

    uint256 totalAmount = 0;
    uint256 maxBinAmount = 0;

    for (uint256 i = 0; i < params.ids.length; i++) {
        require(params.amounts[i] > 0, "No zero amounts");
        totalAmount += params.amounts[i];

        // Cap per-bin concentration
        if (params.amounts[i] > maxBinAmount) {
            maxBinAmount = params.amounts[i];
        }
    }

    require(maxBinAmount <= totalAmount / 2, "Bin too concentrated");

    return this.beforeAddLiquidity.selector;
}
```

---

## 11. Cross-Pool-Type Attack (Infinity-Specific)

### 11.1 CL-Bin Price Inconsistency

Exploiting price differences between CL and Bin pools.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: Arbitrage between pools
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // Get CL pool price
    uint256 clPrice = getCLPoolPrice(token0, token1);

    // Get Bin pool price (unvalidated)
    uint256 binPrice = getBinPoolPrice(token0, token1);  // ❌ No validation

    if (clPrice > binPrice) {
        // Execute profitable arbitrage
        _executeArbitrage(params.amountSpecified);
    }

    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}
```

**Impact:** HIGH - Hook siphons value from pools

**Mitigation:**

```solidity
// SAFE: Validate both prices before using
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // Get TWAP from both pools
    (uint256 clTWAP, ) = OracleLibrary.getTWAP(clPoolKey, TWAP_DURATION);
    (uint256 binTWAP, ) = OracleLibrary.getTWAP(binPoolKey, TWAP_DURATION);

    // Only act if difference is significant (not just rounding)
    uint256 priceDiff = clTWAP > binTWAP
        ? clTWAP - binTWAP
        : binTWAP - clTWAP;

    require(priceDiff <= clTWAP * 1 / 100, "Prices diverged >1%");

    // Don't execute arbitrage within hook
    emit PriceDivergenceDetected(clTWAP, binTWAP);

    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}
```

---

## 12. Documentation & Testing Gaps

### 12.1 Undocumented Hook Behavior

Hook logic not documented, making audits impossible.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: No documentation
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // What does this do? Why 1000? When is it triggered?
    uint256 fee = params.amountSpecified / 1000;

    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}
```

**Impact:** MEDIUM - Cannot review security

**Mitigation:**

```solidity
/// @notice Executes before swap to collect protocol fees
/// @dev Takes 0.1% (1/1000) of swap input as protocol fee
/// @param sender Address initiating swap (not trusted)
/// @param key Pool identifier (validated by PoolManager)
/// @param params Swap parameters including amount and direction
/// @param hookData Hook-specific parameters (must be validated)
/// @return selector Function selector for recognition
/// @return delta Zero delta (no modification of swap)
/// @return hookFeeAmount Zero (fees collected in afterSwap)
function beforeSwap(
    address sender,
    PoolKey calldata key,
    ICLPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    // Collect 0.1% of input as protocol fee
    // Actual settlement happens in lockAcquired
    uint256 protocolFee = params.amountSpecified / 1000;
    pendingFees[msg.sender] += protocolFee;

    return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.zero(), 0);
}
```

---

### 12.2 Insufficient Test Coverage

No fuzz testing for critical paths.

**Vulnerable Pattern:**

```solidity
// VULNERABLE: Unit tests only
function test_SwapDoesNotRevert() public {
    // Single happy path test
    PoolKey memory key = createPool();
    vm.prank(swapper);
    poolManager.swap(key, params, "");
    // No assertions on state
}
```

**Impact:** HIGH - Bugs only found in production

**Mitigation:**

```solidity
// SAFE: Comprehensive fuzz testing
function testFuzz_SwapDeltaAccounting(
    uint128 liquidity,
    uint256 swapAmount,
    bool zeroForOne
) public {
    vm.assume(liquidity > 0 && liquidity < type(uint128).max);
    vm.assume(swapAmount > 0 && swapAmount < 10**18);

    // Track balances before
    uint256 balance0Before = token0.balanceOf(address(this));
    uint256 balance1Before = token1.balanceOf(address(this));

    // Execute swap
    BalanceDelta delta = poolManager.swap(key, params, "");

    // Verify delta matches actual balance changes
    uint256 balance0After = token0.balanceOf(address(this));
    uint256 balance1After = token1.balanceOf(address(this));

    int256 actualDelta0 = int256(balance0After) - int256(balance0Before);
    int256 actualDelta1 = int256(balance1After) - int256(balance1Before);

    assertEq(actualDelta0, delta.amount0(), "Delta0 mismatch");
    assertEq(actualDelta1, delta.amount1(), "Delta1 mismatch");
}

// Run with: forge test --mt testFuzz_ -x 100000
```

---

## Detection Tools & Usage

### Slither

```bash
slither . --solc-version 0.8.26

# Focus on specific detectors:
slither . --detect reentrancy,access-control,unprotected-function
```

### Mythril

```bash
myth analyze src/hooks/InfinityHook.sol --solv 0.8.26

# Check for specific issues:
myth analyze --check reentrancy,delegatecall,integer
```

### Foundry Fuzzing

```bash
# Run fuzz tests with increasing runs
forge test --mt testFuzz_ -x 10000

# For main branch (100k runs)
forge test --mt testFuzz_ -x 100000
```

### Echidna

```yaml
# echidna.yaml
crytic-compile:
  solc-version: 0.8.26
corpus-dir: echidna_corpus
test-mode: assertion
```

```bash
echidna . --contract InfinityHook --solc-args 0.8.26
```

---

## Summary

| Category                | Count | Severity    |
| ----------------------- | ----- | ----------- |
| Access Control          | 2     | HIGH        |
| Delta Accounting        | 2     | CRITICAL    |
| Permissions             | 2     | MEDIUM      |
| Reentrancy              | 2     | CRITICAL    |
| Gas & DoS               | 2     | HIGH/MEDIUM |
| Input Validation        | 2     | MEDIUM      |
| State Management        | 1     | MEDIUM      |
| Upgrades                | 1     | CRITICAL    |
| Vault Lock Reentrancy   | 2     | MEDIUM      |
| Bin Price Manipulation  | 2     | CRITICAL    |
| Cross-Pool Attack       | 1     | HIGH        |
| Documentation & Testing | 2     | MEDIUM      |

**Total: 21 vulnerability patterns**

---

## References

- [PancakeSwap Infinity Documentation](https://docs.pancakeswap.finance/infinity)
- [Uniswap V4 Security Considerations](https://docs.uniswap.org/contracts/v4/concepts/security)
- [Slither Documentation](https://github.com/crytic/slither)
- [Mythril Documentation](https://mythril-classic.readthedocs.io/)
