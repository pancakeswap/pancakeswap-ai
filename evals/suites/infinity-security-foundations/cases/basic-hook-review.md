I've written a basic PancakeSwap Infinity hook that implements beforeSwap to log swap data. Can you review it for security issues?

```solidity
pragma solidity ^0.8.26;

import {CLBaseHook} from "infinity-hooks/src/pool-cl/CLBaseHook.sol";

contract MyHook is CLBaseHook {
    event SwapLogged(address sender, bool zeroForOne, int256 amountSpecified);

    function beforeSwap(
        address sender,
        PoolKey calldata key,
        ICLPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external override returns (bytes4, BeforeSwapDelta, uint24) {
        emit SwapLogged(sender, params.zeroForOne, params.amountSpecified);
        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeSwap: true,
            afterSwap: false,
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }
}
```
