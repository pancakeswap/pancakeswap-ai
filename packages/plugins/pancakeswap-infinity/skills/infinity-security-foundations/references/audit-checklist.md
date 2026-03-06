# PancakeSwap Infinity Security Audit Checklist

## Overview
This checklist provides a comprehensive framework for auditing PancakeSwap Infinity hooks and protocol integrations. Adapt from Uniswap V4 guidelines with Infinity-specific requirements for Vault, PoolManager, and dual pool types (CL and Bin).

**Protocol Version:** PancakeSwap Infinity (V4 architecture)
**Last Updated:** 2026-02-27
**Previous Audits:** Hexens, OtterSec, Zellic

---

## 1. Access Control

### Core Verification Points

- [ ] **Vault Access Control**
  - [ ] Hook callbacks verify `msg.sender == address(vault)` for `lockAcquired()`
  - [ ] Vault.lock() pattern properly restricts callback execution
  - [ ] No external calls bypass vault lock context
  - [ ] Emergency pause/freeze mechanisms require multi-sig

- [ ] **PoolManager Hook Callbacks**
  - [ ] All hook callbacks verify `msg.sender == address(poolManager)`
  - [ ] Callbacks only execute when registered permissions are enabled
  - [ ] BeforeSwap, AfterSwap, BeforeAddLiquidity, AfterAddLiquidity all protected
  - [ ] No hook can call PoolManager during its own callback (reentrancy)

- [ ] **Admin Functions**
  - [ ] Two-step ownership transfer implemented
  - [ ] Admin timelock for critical parameter changes (where applicable)
  - [ ] Role-based access for different operations (e.g., liquidity manager, fee setter)
  - [ ] No unprotected initialization functions

- [ ] **Router/Integration Pattern**
  - [ ] Whitelisted routers only (not msg.sender checks at hook level)
  - [ ] External calls only to trusted contracts
  - [ ] Integration contracts properly validate hook existence

### PancakeSwap Infinity Specifics

```solidity
// CORRECT: Vault lock verification
function lockAcquired(bytes calldata data) external override returns (bytes memory) {
    require(msg.sender == address(vault), "Only Vault");
    // Process callback
}

// CORRECT: PoolManager verification
function beforeSwap(
    address sender,
    PoolKey calldata key,
    IPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    require(msg.sender == address(poolManager), "Only PoolManager");
    // Implementation
}
```

---

## 2. Delta Accounting

### Settlement Pattern Verification

- [ ] **Correct Settlement Flow**
  - [ ] Swap: `vault.sync()` → token transfer → `vault.settle()`
  - [ ] Add Liquidity: `vault.sync()` → `vault.settle()`
  - [ ] Remove Liquidity: tokens transferred after `vault.unlock()`
  - [ ] All deltas properly accounted in multicall ordering

- [ ] **Balance Tracking**
  - [ ] BalanceDelta accounting correct for all operations
  - [ ] No double-counting of tokens
  - [ ] Currency.native (ETH) vs ERC20 distinguished correctly
  - [ ] Rounding direction consistent (down for user withdrawals, up for protocol)

- [ ] **Vault State Management**
  - [ ] Lock nesting properly tracked (only single lock depth supported)
  - [ ] Sync/settle called in pairs for each asset
  - [ ] Dust/rounding handled correctly (DUST_AMOUNT considerations)
  - [ ] No vault balance manipulation between lock sections

### Common Issues
```solidity
// INCORRECT: Double settle
vault.settle(token1);
vault.settle(token1);  // ❌ Settles twice

// CORRECT: Single settle per currency
vault.settle(currency);  // ✓ Once per lock
```

---

## 3. Permissions Review

### CL Pool Permissions (14 Total)

- [ ] **BeforeInitialize Permission**
  - [ ] Hook can inspect but not modify initialization
  - [ ] Return value restrictions checked (only allowance flags)

- [ ] **AfterInitialize Permission**
  - [ ] Hook executes after pool initialization
  - [ ] Cannot prevent initialization completion

- [ ] **BeforeAddLiquidity Permission**
  - [ ] Liquidity amount/range can be validated
  - [ ] Hook data properly parsed and validated
  - [ ] Reentrancy protection in place

- [ ] **AfterAddLiquidity Permission**
  - [ ] Hooks receiving full liquidity details
  - [ ] Proper state tracking after position minted

- [ ] **BeforeRemoveLiquidity Permission**
  - [ ] Liquidity burn amount restrictions possible
  - [ ] Position validity checks

- [ ] **AfterRemoveLiquidity Permission**
  - [ ] Hook receives settlement data
  - [ ] No blocking of liquidity removal

- [ ] **BeforeSwap Permission**
  - [ ] BeforeSwapDelta correctly modifies swap parameters
  - [ ] Direction (exact input/output) cannot be changed
  - [ ] No positive deltas returned (only reducing swaps)

- [ ] **AfterSwap Permission**
  - [ ] Hook executes after swap completes
  - [ ] Cannot reverse successful swaps

- [ ] **BeforeDonate Permission**
  - [ ] Donation amount validation
  - [ ] Fee donation mechanics preserved

- [ ] **AfterDonate Permission**
  - [ ] Hook executes post-donation
  - [ ] Protocol fee accounting unaffected

- [ ] **NoOp Permissions**
  - [ ] BEFORE_INITIALIZE_RETURNS_DELTA_NO_OP
  - [ ] AFTER_INITIALIZE_RETURNS_DELTA_NO_OP
  - [ ] (and similar AfterOp variants)
  - [ ] Disabled hooks properly revert on call

### Bin Pool Permissions (14 Total)

- [ ] **Same structure as CL, adapted for Bin bins**
  - [ ] Bin-specific price calculation hooks reviewed
  - [ ] Liquidity removal for multiple bins validated
  - [ ] Swap behavior in continuous bin space checked

### Permission Enforcement

```solidity
// CORRECT: Permissions disabled by default
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
        // ... all false by default
    });
}

// Required permission check in PoolManager:
if (!permissions.beforeSwap) revert HookNotEnabled();
```

---

## 4. Reentrancy

### Vault Lock Reentrancy (Infinity-Specific)

- [ ] **Lock Depth Validation**
  - [ ] Vault enforces maximum lock depth (typically 1)
  - [ ] Nested vault.lock() calls properly rejected
  - [ ] lockAcquired() callback cannot call vault.lock() again

- [ ] **PoolManager Callback Reentrancy**
  - [ ] Hook callbacks cannot call back into PoolManager methods
  - [ ] BeforeSwap hook cannot call poolManager.swap()
  - [ ] AfterSwap hook cannot execute trades that require settle

- [ ] **Cross-Hook Reentrancy**
  - [ ] Multiple hooks on same pool cannot interfere
  - [ ] Hook state properly isolated (no shared state bypasses)

### Detection Pattern

```solidity
// VULNERABLE: Reentrancy into PoolManager
function beforeSwap(...) external override returns (...) {
    require(msg.sender == address(poolManager), "Only PoolManager");
    // Vulnerable call back:
    poolManager.swap(key, params, "");  // ❌ Would reenter
}

// SAFE: Store data, process after vault.unlock()
function beforeSwap(...) external override returns (...) {
    require(msg.sender == address(poolManager), "Only PoolManager");
    // Only read state, return deltas
    return (HOOK_AFTER_SWAP_RETURNS_DELTA_FLAG, delta, 0);
}

function lockAcquired(bytes calldata data) external override {
    require(msg.sender == address(vault), "Only Vault");
    // Safe to call PoolManager here (outside lock context)
}
```

---

## 5. Gas & Denial of Service

### Gas Limits

- [ ] **Hook Callback Gas Budgets**
  - [ ] BeforeSwap/AfterSwap gas usage < 100k typical
  - [ ] Add/Remove Liquidity hooks stay within limits
  - [ ] No unbounded loops in hook logic
  - [ ] Array iterations bounded by constants

- [ ] **Block Gas Limit Protection**
  - [ ] Multicall operations gas-estimated
  - [ ] No single tx exceeds reasonable limits (~20M gas)
  - [ ] For loops have maximum iteration caps

- [ ] **Storage Optimization**
  - [ ] Packing: Used for frequently accessed state
  - [ ] Hook state storage minimal (use encoding if needed)

### DoS Prevention

- [ ] **Economic Attacks**
  - [ ] No unchecked min output settings (slippage protection)
  - [ ] Price oracle manipulations handled
  - [ ] MEV protection in critical operations

- [ ] **Griefing Prevention**
  - [ ] No hook state can block other users
  - [ ] Emergency shutdown doesn't freeze funds indefinitely

---

## 6. Input Validation

### Parameter Validation

- [ ] **PoolKey Validation**
  - [ ] Currency0 < Currency1 enforced
  - [ ] Fee not zero and within expected ranges
  - [ ] Hooks field matches registered hook address
  - [ ] Ext field properly formatted

- [ ] **Swap Parameters**
  - [ ] Amount0For1 / AmountSpecified validation
  - [ ] SqrtPriceLimit within valid price range
  - [ ] No zero amounts (where not allowed)

- [ ] **Liquidity Operations**
  - [ ] Tick range validation (lower < upper)
  - [ ] Tick multiples match tickSpacing
  - [ ] Liquidity amounts > 0

- [ ] **Hook Data Validation**
  - [ ] hookData size checked if bounded
  - [ ] hookData properly decoded (no unchecked indexing)
  - [ ] Malformed hookData doesn't corrupt state

### Encoding Safety

```solidity
// VULNERABLE: Unchecked encoding
(uint256 value) = abi.decode(data, (uint256));  // ❌ May revert

// SAFE: Length check
if (data.length < 32) revert InvalidHookData();
(uint256 value) = abi.decode(data, (uint256));  // ✓
```

---

## 7. State Management

### Hook State

- [ ] **Initialization**
  - [ ] Constructor properly initializes PoolManager and Vault references
  - [ ] Cannot be reinitialized (if applicable)

- [ ] **State Consistency**
  - [ ] Atomic updates (no partial state changes on revert)
  - [ ] Validation before state modification

- [ ] **Migration/Upgrade Safety**
  - [ ] Hook cannot be upgraded without permission changes
  - [ ] Permission bitmap changes properly tracked
  - [ ] Legacy pool data handled (if versioning supported)

---

## 8. Upgrade Safety

### Hook Contract Upgrades

- [ ] **Permission Change Handling**
  - [ ] New permissions don't introduce vulnerabilities
  - [ ] Existing pool state compatible with new logic
  - [ ] No exploit path from permission flag changes

- [ ] **CREATE3 Deployment Verification**
  - [ ] Salt is deterministic and collision-free
  - [ ] Hook address matches PoolKey.hooks field
  - [ ] Cannot redeploy to same address maliciously
  - [ ] CREATE3 library version audited

### Deployment Checklist

```solidity
// CORRECT: CREATE3 deployment
bytes32 salt = keccak256(abi.encodePacked(poolKey, "v1"));
address hook = CREATE3.deploy(
    salt,
    abi.encodePacked(
        type(InfinityHook).creationCode,
        abi.encode(poolManager, vault)
    ),
    0
);
require(hook == poolKey.hooks, "Hook mismatch");
```

---

## 9. Testing Requirements

### Foundry Test Coverage

- [ ] **Unit Tests**
  - [ ] All hook callbacks tested individually
  - [ ] Permission bitmap combinations tested
  - [ ] Edge cases: zero amounts, max values, boundary ticks

- [ ] **Integration Tests**
  - [ ] Multi-step operations (swap + callback)
  - [ ] Multiple hooks on same pool

- [ ] **Isolation Tests**
  - [ ] All tests run with `forge test --isolate`
  - [ ] No test interdependencies
  - [ ] Snapshot tests for state changes

### Fuzz Testing

- [ ] **Minimum Fuzz Runs**
  - [ ] Development: 1,000 runs
  - [ ] Internal: 10,000 runs
  - [ ] Main branch: 100,000 runs

- [ ] **Fuzz Targets**
  - [ ] Swap + hook interaction
  - [ ] Liquidity add/remove with hooks
  - [ ] Delta accounting correctness
  - [ ] Multi-operation sequencing

### Example Fuzz Test

```solidity
function testFuzz_SwapWithHookDeltaCorrectness(
    uint128 liquidity,
    uint256 swapAmount,
    bool zeroForOne
) public {
    vm.assume(liquidity > 0 && liquidity < type(uint128).max);
    vm.assume(swapAmount > 0 && swapAmount < 10**18);

    // Initialize pool with liquidity
    // Swap with hook
    // Verify delta accounting
}
```

---

## 10. Static Analysis

### Tool Checklist

- [ ] **Slither**
  - [ ] Run: `slither . --solc-version 0.8.26`
  - [ ] Address all medium/high severity issues
  - [ ] False positives documented

- [ ] **Mythril**
  - [ ] Run: `myth analyze src/hooks/InfinityHook.sol`
  - [ ] Check for common patterns (reentrancy, timestamp, delegate call)

- [ ] **Foundry Compiler Warnings**
  - [ ] `forge build` with no warnings
  - [ ] All unreachable code removed
  - [ ] Unused variables eliminated

- [ ] **Manual Code Review**
  - [ ] Peer review by 2+ security engineers
  - [ ] Focus: vault interaction, permissions, delta accounting

---

## 11. Documentation

### Required Documentation

- [ ] **Hook Specification**
  - [ ] Purpose and security model clearly stated
  - [ ] All callback implementations documented
  - [ ] Hook data structure defined (if used)
  - [ ] Risk assumptions listed

- [ ] **Deployment Guide**
  - [ ] CREATE3 salt derivation explained
  - [ ] Permission bitmap initialization verified
  - [ ] Integration steps with router/protocol

- [ ] **Security Model Document**
  - [ ] Threat model for specific hook
  - [ ] Mitigation strategies explained
  - [ ] Known limitations disclosed

---

## 12. Deployment

### Pre-Deployment Checklist

- [ ] **Network Validation**
  - [ ] PoolManager address correct for target network
  - [ ] Vault address correct and verified
  - [ ] All dependencies deployed and verified

- [ ] **Hook Verification**
  - [ ] Hook code deployed matches audited source
  - [ ] Bytecode verified on chain explorers
  - [ ] Permission bitmap matches expected config

- [ ] **Post-Deployment Testing**
  - [ ] Test transaction executes successfully
  - [ ] Hook responds to callbacks correctly
  - [ ] Monitoring/alerting configured

---

## Audit Sign-Off Table

| Section | Reviewer | Status | Notes | Date |
|---------|----------|--------|-------|------|
| Access Control | | ⬜ Pending | | |
| Delta Accounting | | ⬜ Pending | | |
| Permissions Review | | ⬜ Pending | | |
| Reentrancy | | ⬜ Pending | | |
| Gas & DoS | | ⬜ Pending | | |
| Input Validation | | ⬜ Pending | | |
| State Management | | ⬜ Pending | | |
| Upgrade Safety | | ⬜ Pending | | |
| Testing | | ⬜ Pending | | |
| Static Analysis | | ⬜ Pending | | |
| Documentation | | ⬜ Pending | | |
| Deployment | | ⬜ Pending | | |

**Overall Risk Assessment:** 🟡 Pending Review

---

## Risk Assessment Summary

### Critical Issues Found
- [ ] None documented

### High Severity Issues
- [ ] None documented

### Medium Severity Issues
- [ ] None documented

### Low Severity Issues / Recommendations
- [ ] None documented

---

## References

- [PancakeSwap Infinity Docs](https://docs.pancakeswap.finance)
- [Uniswap V4 Hook Docs](https://docs.uniswap.org/contracts/v4/concepts/hooks)
- Previous Audits: Hexens, OtterSec, Zellic
