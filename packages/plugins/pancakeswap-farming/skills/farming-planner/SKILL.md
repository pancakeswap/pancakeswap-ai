---
name: farming-planner
description: Plan yield farming and CAKE staking on PancakeSwap. Use when user says "farm on pancakeswap", "stake CAKE", "unstake CAKE", "stake LP", "unstake LP", "yield farming", "syrup pool", "pancakeswap farm", "earn CAKE", "farm APR", "harvest rewards", "deposit LP", "withdraw LP", or describes wanting to stake, unstake, or earn yield on PancakeSwap.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(curl:*), Bash(jq:*), Bash(cast:*), Bash(python3:*), Bash(node:*), Bash(xdg-open:*), Bash(open:*), WebFetch, WebSearch, Task(subagent_type:Explore), AskUserQuestion
model: sonnet
license: MIT
metadata:
  author: pancakeswap
  version: '1.1.0'
---

# PancakeSwap Farming Planner

Plan yield farming, CAKE staking, and reward harvesting on PancakeSwap by discovering active farms, comparing APR/APY, and generating deep links to the PancakeSwap farming interface.

## Overview

This skill **does not execute transactions** — it plans farming strategies. The output is a deep link URL that opens the PancakeSwap interface at the relevant farming or staking page, so the user can review and confirm in their own wallet.

## Decision Guide — Read First

Route to the correct section based on what the user wants:

| User Says...                                    | Go To Section         | Primary Output                   |
| ----------------------------------------------- | --------------------- | -------------------------------- |
| "best farms" / "highest APR" / "discover farms" | Farm Discovery        | Table with APY + deep links      |
| "stake LP" / "deposit LP into farm"             | Stake LP Tokens       | Deep link + cast examples        |
| "unstake LP" / "withdraw LP from farm"          | Unstake LP Tokens     | Deep link + cast examples        |
| "stake CAKE" / "syrup pool"                     | Stake CAKE            | Deep link to Syrup Pools         |
| "harvest" / "claim rewards" / "pending rewards" | Harvest Rewards       | cast command + deep link         |

| User Wants...                  | Best Recommendation                                |
| ------------------------------ | -------------------------------------------------- |
| Passive CAKE yield, no IL      | CAKE staking (Syrup Pool)                          |
| Highest APR, willing to manage | V3 Farm with tight range                           |
| Set-and-forget farming         | V2 Farm (full range, no rebalancing needed)        |
| Earn partner tokens            | Syrup Pools                                        |
| Stablecoin yield, minimal risk | USDT-USDC StableSwap LP farm                       |

---

## Token Addresses

Use these to construct deep links. Always use the wrapped native token address in URLs (e.g., WBNB on BSC, WETH on Base/Ethereum/Arbitrum).

### BSC (Chain ID 56)

| Token  | Address                                      | Decimals |
| ------ | -------------------------------------------- | -------- |
| CAKE   | `0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82` | 18       |
| WBNB   | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` | 18       |
| BNB    | Use WBNB address above in URLs               | 18       |
| USDT   | `0x55d398326f99059fF775485246999027B3197955` | 18       |
| USDC   | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` | 18       |
| BUSD   | `0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56` | 18       |
| ETH    | `0x2170Ed0880ac9A755fd29B2688956BD959F933F8` | 18       |
| BTCB   | `0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c` | 18       |
| MBOX   | `0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377` | 18       |
| XRP    | `0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE` | 18       |
| ADA    | `0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47` | 18       |
| DOGE   | `0xbA2aE424d960c26247Dd6c32edC70B295c744C43` | 8        |
| DOT    | `0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402` | 18       |
| LINK   | `0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD` | 18       |
| UNI    | `0xBf5140A22578168FD562DCcF235E5D43A02ce9B1` | 18       |
| TWT    | `0x4B0F1812e5Df2A09796481Ff14017e6005508003` | 18       |

### Base (Chain ID 8453)

| Token   | Address                                      | Decimals |
| ------- | -------------------------------------------- | -------- |
| WETH    | `0x4200000000000000000000000000000000000006` | 18       |
| ETH     | Use WETH address above in URLs               | 18       |
| USDC    | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6        |
| USDbC   | `0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA` | 6        |
| DAI     | `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb` | 18       |
| cbBTC   | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` | 8        |
| cbXRP   | `0xcb585250f852c6c6bf90434ab21a00f02833a4af` | 6        |
| AERO    | `0x940181a94A35A4569E4529A3CDfB74e38FD98631` | 18       |
| VIRTUAL | `0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b` | 18       |

### Ethereum (Chain ID 1)

| Token  | Address                                      | Decimals |
| ------ | -------------------------------------------- | -------- |
| WETH   | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | 18       |
| USDC   | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 6        |
| USDT   | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 6        |
| WBTC   | `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` | 8        |

### Arbitrum (Chain ID 42161)

| Token  | Address                                      | Decimals |
| ------ | -------------------------------------------- | -------- |
| WETH   | `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` | 18       |
| USDC   | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | 6        |
| USDT   | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` | 6        |
| WBTC   | `0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f` | 8        |
| ARB    | `0x912CE59144191C1204E64559FE8253a0e49E6548` | 18       |

---

## Deep Link Reference

### URL Formulas

```
# V2 — add liquidity
https://pancakeswap.finance/v2/add/{token0}/{token1}?chain={chainKey}&persistChain=1

# V3 — add liquidity (fee tier: 100=0.01%, 500=0.05%, 2500=0.25%, 10000=1%)
https://pancakeswap.finance/add/{token0}/{token1}/{feeTier}?chain={chainKey}&persistChain=1

# StableSwap — add liquidity (for stablecoin pairs like USDT/USDC)
https://pancakeswap.finance/stable/add/{token0}/{token1}?chain={chainKey}&persistChain=1

# Infinity — add liquidity (uses poolId from CampaignManager, NOT token addresses)
https://pancakeswap.finance/liquidity/add/{chainKey}/infinity/{poolId}?chain={chainKey}&persistChain=1
```

For V2/V3, use the wrapped token address (WBNB `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` on BSC).
For V3, common fee tiers: `2500` (most pairs), `500` (major pairs), `100` (stablecoins).
For Infinity, you need the `poolId` (bytes32 hash) from the CampaignManager contract — see "Method B" in Farm Discovery.

### Pre-built Deep Links (BSC)

| Pair        | Type       | Add Liquidity Deep Link                                                                                                                 |
| ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| CAKE / WBNB | V2         | `https://pancakeswap.finance/v2/add/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1` |
| CAKE / WBNB | Infinity   | `https://pancakeswap.finance/liquidity/add/bsc/infinity/0xcbc43b950eb089f1b28694324e76336542f1c158ec955921704cebaa53a278bc?chain=bsc&persistChain=1` |
| CAKE / USDT | V3         | `https://pancakeswap.finance/add/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/0x55d398326f99059fF775485246999027B3197955/2500?chain=bsc&persistChain=1` |
| WBNB / USDT | V3         | `https://pancakeswap.finance/add/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/0x55d398326f99059fF775485246999027B3197955/2500?chain=bsc&persistChain=1` |
| ETH / WBNB  | V3         | `https://pancakeswap.finance/add/0x2170Ed0880ac9A755fd29B2688956BD959F933F8/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/2500?chain=bsc&persistChain=1` |
| BTCB / WBNB | V3         | `https://pancakeswap.finance/add/0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/2500?chain=bsc&persistChain=1` |
| USDT / USDC | StableSwap | `https://pancakeswap.finance/stable/add/0x55d398326f99059fF775485246999027B3197955/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d?chain=bsc&persistChain=1` |
| MBOX / WBNB | V2         | `https://pancakeswap.finance/v2/add/0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1` |
| XRP / WBNB  | V2         | `https://pancakeswap.finance/v2/add/0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1` |
| ADA / WBNB  | V2         | `https://pancakeswap.finance/v2/add/0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1` |

### Page Deep Links

| Page                  | URL                                                          |
| --------------------- | ------------------------------------------------------------ |
| All Farms             | `https://pancakeswap.finance/liquidity/pools?chain=bsc`      |
| Syrup Pools           | `https://pancakeswap.finance/pools`                          |
| CAKE Staking          | `https://pancakeswap.finance/cake-staking`                   |

### Chain Keys

| Chain           | Key      |
| --------------- | -------- |
| BNB Smart Chain | `bsc`    |
| Ethereum        | `eth`    |
| Arbitrum One    | `arb`    |
| Base            | `base`   |
| zkSync Era      | `zksync` |

If you cannot find a token address in the table above, look it up on-chain:

```bash
cast call $TOKEN_ADDRESS "symbol()(string)" --rpc-url https://bsc-dataseed1.binance.org
```

Or use the farms page with search: `https://pancakeswap.finance/liquidity/pools?chain=bsc&search={SYMBOL}`

---

## Contract Addresses (BSC)

| Contract            | Address                                      | Purpose                            |
| ------------------- | -------------------------------------------- | ---------------------------------- |
| MasterChef v2       | `0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652` | V2 LP farm staking & CAKE rewards  |
| MasterChef v3       | `0x556B9306565093C855AEA9AE92A594704c2Cd59e` | V3 position farming & CAKE rewards |
| CampaignManager     | `0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115` | Infinity farm campaign registry    |
| Distributor         | `0xEA8620aAb2F07a0ae710442590D649ADE8440877` | Infinity farm CAKE reward claims   |
| CAKE Token          | `0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82` | CAKE ERC-20 token                  |
| PositionManager v3  | `0x46A15B0b27311cedF172AB29E4f4766fbE7F4364` | V3 NFT position manager            |

---

## Farm Discovery

### Method A: PancakeSwap Explorer API (primary — most accurate)

::: danger MANDATORY — Do NOT write your own Python script
Using `python3 -c "..."` causes SyntaxError (bash mangles `!` and `$`).
Using `curl | python3 << 'EOF'` causes JSONDecodeError (heredoc steals stdin).
You MUST follow the exact two-step process below. Do NOT improvise.
:::

**Step 1 — Create the script file (run this FIRST, exactly as-is):**

The script fetches LP fee APR from the Explorer API and calculates **CAKE Yield APR** on-chain by querying MasterChef v3 (`latestPeriodCakePerSecond`, `v3PoolAddressPid`, `poolInfo`) via batched JSON-RPC calls. For Infinity farms, it fetches campaign data from `https://infinity.pancakeswap.com/farms/campaigns/{chainId}/false` and calculates yield as `Σ (totalRewardAmount / 1e18 / duration * SECONDS_PER_YEAR)`. It requires the `requests` library (auto-installs if missing).

```bash
cat > /tmp/pcs_farms.py << 'PYEOF'
import json, sys, os, time
try:
    import requests
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'requests'])
    import requests
CHAIN_FILTER = os.environ.get('CHAIN_FILTER', '')
PROTOCOL_FILTER = os.environ.get('PROTOCOL_FILTER', '')
MIN_TVL = float(os.environ.get('MIN_TVL', '10000'))
CHAIN_ID_TO_KEY = {56: 'bsc', 1: 'eth', 42161: 'arb', 8453: 'base', 324: 'zksync', 204: 'opbnb', 59144: 'linea'}
NATIVE_TO_WRAPPED = {
    56:    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    1:     '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    8453:  '0x4200000000000000000000000000000000000006',
    324:   '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
}
MASTERCHEF_V3 = {
    56:    '0x556B9306565093C855AEA9AE92A594704c2Cd59e',
    1:     '0x556B9306565093C855AEA9AE92A594704c2Cd59e',
    42161: '0x5e09ACf80C0296740eC5d6F643005a4ef8DaA694',
    8453:  '0xC6A2Db661D5a5690172d8eB0a7DEA2d3008665A3',
    324:   '0x4c615E78c5fCA1Ad31e4d66eb0D8688d84307463',
}
RPC_URLS = {
    56:    'https://bsc-rpc.publicnode.com',
    1:     'https://ethereum-rpc.publicnode.com',
    42161: 'https://arbitrum-one-rpc.publicnode.com',
    8453:  'https://base-rpc.publicnode.com',
    324:   'https://zksync-era-rpc.publicnode.com',
}
ZERO_ADDR = '0x0000000000000000000000000000000000000000'
BATCH_CHUNK = 8
SIG_CAKE_PER_SEC  = '0xc4f6a8ce'
SIG_TOTAL_ALLOC   = '0x17caf6f1'
SIG_POOL_ADDR_PID = '0x0743384d'
SIG_POOL_INFO     = '0x1526fe27'
def _rpc_batch(rpc, batch, retries=2):
    for attempt in range(retries + 1):
        try:
            resp = requests.post(rpc, json=batch, timeout=15)
            raw = resp.json()
            if isinstance(raw, dict):
                if attempt < retries:
                    time.sleep(1.0 * (attempt + 1))
                    continue
                return [{'result': '0x'}] * len(batch)
            has_err = any(r.get('error', {}).get('code') in (-32016, -32014) for r in raw)
            if has_err and attempt < retries:
                time.sleep(1.0 * (attempt + 1))
                continue
            return raw
        except Exception:
            if attempt < retries:
                time.sleep(1.0 * (attempt + 1))
            else:
                return [{'result': '0x'}] * len(batch)
    return [{'result': '0x'}] * len(batch)
def eth_call_batch(rpc, calls):
    if not calls:
        return []
    all_results = [None] * len(calls)
    for cs in range(0, len(calls), BATCH_CHUNK):
        chunk = calls[cs:cs + BATCH_CHUNK]
        batch = [{'jsonrpc': '2.0', 'id': i, 'method': 'eth_call',
                  'params': [{'to': to, 'data': data}, 'latest']}
                 for i, (to, data) in enumerate(chunk)]
        raw = _rpc_batch(rpc, batch)
        if isinstance(raw, list):
            raw.sort(key=lambda r: r.get('id', 0))
            for i, r in enumerate(raw):
                all_results[cs + i] = r.get('result', '0x')
        else:
            for i in range(len(chunk)):
                all_results[cs + i] = '0x'
        if cs + BATCH_CHUNK < len(calls):
            time.sleep(0.3)
    return all_results
def decode_uint(h):
    if not h or h == '0x': return 0
    return int(h, 16)
def pad_address(addr):
    return addr.lower().replace('0x', '').zfill(64)
def pad_uint(val):
    return hex(val).replace('0x', '').zfill(64)
def get_cake_price():
    try:
        r = requests.get('https://api.coingecko.com/api/v3/simple/price?ids=pancakeswap-token&vs_currencies=usd', timeout=5)
        return r.json().get('pancakeswap-token', {}).get('usd', 0)
    except Exception:
        return 0
def get_v3_cake_data(chain_id, pool_addresses):
    mc = MASTERCHEF_V3.get(chain_id)
    rpc = RPC_URLS.get(chain_id)
    if not mc or not rpc or not pool_addresses:
        return {}
    try:
        calls = [(mc, SIG_CAKE_PER_SEC), (mc, SIG_TOTAL_ALLOC)]
        for a in pool_addresses:
            calls.append((mc, SIG_POOL_ADDR_PID + pad_address(a)))
        results = eth_call_batch(rpc, calls)
        cake_per_sec_raw = decode_uint(results[0])
        total_alloc = decode_uint(results[1])
        if total_alloc == 0 or cake_per_sec_raw == 0:
            return {}
        cake_per_sec = cake_per_sec_raw / 1e12 / 1e18
        pids = [decode_uint(results[2 + i]) for i in range(len(pool_addresses))]
        time.sleep(0.5)
        info_calls = [(mc, SIG_POOL_INFO + pad_uint(pid)) for pid in pids]
        info_results = eth_call_batch(rpc, info_calls)
        result = {}
        for i, addr in enumerate(pool_addresses):
            info_hex = info_results[i]
            if not info_hex or info_hex == '0x' or len(info_hex) < 66:
                result[addr.lower()] = 0
                continue
            alloc_point = int(info_hex[2:66], 16)
            if len(info_hex) >= 130:
                returned_pool = '0x' + info_hex[90:130].lower()
                if returned_pool != addr.lower():
                    result[addr.lower()] = 0
                    continue
            if alloc_point == 0:
                result[addr.lower()] = 0
                continue
            pool_cake_per_sec = cake_per_sec * (alloc_point / total_alloc)
            result[addr.lower()] = pool_cake_per_sec * 31_536_000
        return result
    except Exception:
        return {}
def token_addr(token, chain_id):
    addr = token['id']
    if addr == ZERO_ADDR:
        return NATIVE_TO_WRAPPED.get(chain_id, addr)
    return addr
def build_link(pool):
    chain_id = pool['chainId']
    chain_key = CHAIN_ID_TO_KEY.get(chain_id, 'bsc')
    proto = pool['protocol']
    t0 = token_addr(pool['token0'], chain_id)
    t1 = token_addr(pool['token1'], chain_id)
    fee = pool.get('feeTier', 2500)
    if proto == 'v2':
        return f'https://pancakeswap.finance/v2/add/{t0}/{t1}?chain={chain_key}&persistChain=1'
    elif proto == 'v3':
        return f'https://pancakeswap.finance/add/{t0}/{t1}/{fee}?chain={chain_key}&persistChain=1'
    elif proto == 'stable':
        return f'https://pancakeswap.finance/stable/add/{t0}/{t1}?chain={chain_key}&persistChain=1'
    elif proto in ('infinityCl', 'infinityBin'):
        pool_id = pool['id']
        return f'https://pancakeswap.finance/liquidity/add/{chain_key}/infinity/{pool_id}?chain={chain_key}&persistChain=1'
    else:
        return f'https://pancakeswap.finance/liquidity/pools?chain={chain_key}'
data = json.load(sys.stdin)
pools = data if isinstance(data, list) else data.get('data', [])
if CHAIN_FILTER:
    chain_ids = {v: k for k, v in CHAIN_ID_TO_KEY.items()}
    target_id = chain_ids.get(CHAIN_FILTER.lower())
    if target_id:
        pools = [p for p in pools if p['chainId'] == target_id]
if PROTOCOL_FILTER:
    protos = [x.strip().lower() for x in PROTOCOL_FILTER.split(',')]
    pools = [p for p in pools if p['protocol'].lower() in protos]
pools = [p for p in pools if float(p.get('tvlUSD', 0) or 0) >= MIN_TVL]
pools.sort(key=lambda p: float(p.get('apr24h', 0) or 0), reverse=True)
top_pools = pools[:20]
cake_price = get_cake_price()
v3_pools_by_chain = {}
for p in top_pools:
    if p['protocol'] == 'v3':
        cid = p['chainId']
        v3_pools_by_chain.setdefault(cid, []).append(p['id'])
yearly_cake_map = {}
for cid, addrs in v3_pools_by_chain.items():
    yearly_cake_map.update(get_v3_cake_data(cid, addrs))
SECONDS_PER_YEAR = 31_536_000
inf_chains = set()
for p in top_pools:
    if p['protocol'] in ('infinityCl', 'infinityBin'):
        inf_chains.add(p['chainId'])
for cid in inf_chains:
    try:
        r = requests.get(
            f'https://infinity.pancakeswap.com/farms/campaigns/{cid}/false?limit=100&page=1',
            timeout=10)
        campaigns = r.json().get('campaigns', [])
        for c in campaigns:
            pid = c['poolId'].lower()
            reward_raw = int(c.get('totalRewardAmount', 0))
            duration = int(c.get('duration', 0))
            if duration <= 0 or reward_raw <= 0:
                continue
            yearly_reward = (reward_raw / 1e18) / duration * SECONDS_PER_YEAR
            yearly_cake_map[pid] = yearly_cake_map.get(pid, 0) + yearly_reward
    except Exception:
        pass
print('| Pair | LP Fee APR | CAKE APR | Total APR | TVL | Protocol | Chain | Deep Link |')
print('|------|-----------|----------|-----------|-----|----------|-------|-----------|')
for p in top_pools:
    t0sym = p['token0']['symbol']
    t1sym = p['token1']['symbol']
    pair = f'{t0sym}/{t1sym}'
    lp_fee_apr = float(p.get('apr24h', 0) or 0) * 100
    tvl = float(p.get('tvlUSD', 0) or 0)
    tvl_str = f"${int(tvl):,}"
    proto = p['protocol']
    chain_key = CHAIN_ID_TO_KEY.get(p['chainId'], '?')
    cake_apr = 0.0
    pool_addr = p['id'].lower()
    is_farm = proto == 'v3' or proto in ('infinityCl', 'infinityBin')
    if is_farm and pool_addr in yearly_cake_map and tvl > 0 and cake_price > 0:
        cake_apr = (yearly_cake_map[pool_addr] * cake_price) / tvl * 100
    total_apr = lp_fee_apr + cake_apr
    lp_str = f'{lp_fee_apr:.1f}%'
    cake_str = f'{cake_apr:.1f}%' if cake_apr > 0 else '-'
    total_str = f'{total_apr:.1f}%'
    link = build_link(p)
    print(f'| {pair} | {lp_str} | {cake_str} | {total_str} | {tvl_str} | {proto} | {chain_key} | {link} |')
PYEOF
```

**Step 2 — Run the query (pick ONE line based on the target chain):**

The API URL supports these query params: `protocols` (v2, v3, stable, infinityBin, infinityCl) and `chains` (bsc, ethereum, base, arbitrum, zksync, opbnb, linea, monad).

The script calculates CAKE Yield APR on-chain for V3 farms and via the Infinity campaigns API for infinityCl/infinityBin pools. For V2/stable pools, only LP Fee APR is shown (CAKE column shows `-`).

```bash
# All chains, all protocols (default):
curl -s "https://explorer.pancakeswap.com/api/cached/pools/farming?protocols=v2&protocols=v3&protocols=stable&protocols=infinityBin&protocols=infinityCl&chains=bsc&chains=ethereum&chains=base&chains=arbitrum&chains=zksync" | python3 /tmp/pcs_farms.py

# BSC only:
export CHAIN_FILTER=bsc && curl -s "https://explorer.pancakeswap.com/api/cached/pools/farming?protocols=v2&protocols=v3&protocols=stable&protocols=infinityBin&protocols=infinityCl&chains=bsc" | python3 /tmp/pcs_farms.py

# Base only:
export CHAIN_FILTER=base && curl -s "https://explorer.pancakeswap.com/api/cached/pools/farming?protocols=v2&protocols=v3&protocols=stable&protocols=infinityBin&protocols=infinityCl&chains=base" | python3 /tmp/pcs_farms.py

# Base V3 only:
export CHAIN_FILTER=base PROTOCOL_FILTER=v3 && curl -s "https://explorer.pancakeswap.com/api/cached/pools/farming?protocols=v3&chains=base" | python3 /tmp/pcs_farms.py

# Arbitrum only:
export CHAIN_FILTER=arb && curl -s "https://explorer.pancakeswap.com/api/cached/pools/farming?protocols=v2&protocols=v3&protocols=stable&protocols=infinityBin&protocols=infinityCl&chains=arbitrum" | python3 /tmp/pcs_farms.py

# Lower minimum TVL to $1000 (default is $10000):
export MIN_TVL=1000 && curl -s "https://explorer.pancakeswap.com/api/cached/pools/farming?protocols=v2&protocols=v3&protocols=stable&protocols=infinityBin&protocols=infinityCl&chains=bsc" | python3 /tmp/pcs_farms.py
```

The output is a ready-to-use markdown table with LP Fee APR, CAKE APR, and Total APR columns, plus deep links per row. Copy it directly into your response.

### Method B: Infinity campaigns API + on-chain CampaignManager

**Preferred: REST API** — the farm discovery script (Method A) already uses this to calculate Infinity CAKE APR automatically:

```
GET https://infinity.pancakeswap.com/farms/campaigns/{chainId}/false?limit=100&page=1
```

Response: `{ "campaigns": [{ "campaignId", "poolId", "totalRewardAmount", "duration", "rewardToken", "startTime", "epochEndTimestamp", "status" }] }`

**CAKE Yield APR for Infinity farms** = `Σ (totalRewardAmount / 1e18 / duration * 31_536_000 * cakePrice) / poolTVL * 100`

When multiple campaigns target the same `poolId`, sum their yearly rewards before dividing by TVL.

**Alternative: On-chain via CampaignManager** — use when you specifically need raw on-chain data:

```bash
cast call 0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115 \
  "campaignLength()(uint256)" \
  --rpc-url https://bsc-dataseed1.binance.org
```

```bash
cast call 0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115 \
  "campaignInfo(uint256)(address,bytes32,uint64,uint64,uint128,address,uint256)" 1 \
  --rpc-url https://bsc-dataseed1.binance.org
```

Response fields: `poolManager`, `poolId`, `startTime`, `duration`, `campaignType`, `rewardToken`, `totalRewardAmount`.

To resolve `poolId` to a token pair:

```bash
cast call 0xa0FfB9c1CE1Fe56963B0321B32E7A0302114058b \
  "poolIdToPoolKey(bytes32)(address,address,address,uint24,int24,address)" $POOL_ID \
  --rpc-url https://bsc-dataseed1.binance.org
```

Then build the deep link using the `poolId` directly (NOT the resolved token addresses):

```
https://pancakeswap.finance/liquidity/add/bsc/infinity/{poolId}?chain=bsc
```

The `poolId` is the bytes32 hash from `campaignInfo`, e.g.:
`https://pancakeswap.finance/liquidity/add/bsc/infinity/0xcbc43b950eb089f1b28694324e76336542f1c158ec955921704cebaa53a278bc?chain=bsc`

Resolving to token symbols is still useful for display (showing "CAKE / BNB" to the user), but the URL uses the poolId.

### Method C: CAKE price (for reward valuation)

```bash
curl -s "https://api.coingecko.com/api/v3/simple/price?ids=pancakeswap-token&vs_currencies=usd"
```

---

## Stake LP Tokens

**Primary: Direct the user to the PancakeSwap UI via deep link.** Only provide `cast` examples when the user explicitly asks for CLI/programmatic staking.

### Step 1: Add liquidity (get LP tokens)

Build the add-liquidity deep link from the Token Addresses and Deep Link Reference above:

```
# V2 example: CAKE/WBNB
https://pancakeswap.finance/v2/add/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1

# V3 example: CAKE/USDT (fee tier 2500 = 0.25%)
https://pancakeswap.finance/add/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/0x55d398326f99059fF775485246999027B3197955/2500?chain=bsc&persistChain=1
```

### Step 2: Stake in the farm

```
https://pancakeswap.finance/liquidity/pools?chain=bsc
```

### CLI: V2 Farm staking (MasterChef v2)

```solidity
function deposit(uint256 pid, uint256 amount, address to) external;
function withdraw(uint256 pid, uint256 amount, address to) external;
function harvest(uint256 pid, address to) external;
function emergencyWithdraw(uint256 pid, address to) external;
```

- `pid` — pool ID (query `poolLength()` to enumerate)
- `amount` — LP token amount in wei

```bash
cast send $LP_TOKEN_ADDRESS \
  "approve(address,uint256)" 0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652 $AMOUNT \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org

cast send 0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652 \
  "deposit(uint256,uint256,address)" $PID $AMOUNT $YOUR_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### CLI: V3 Farm staking (MasterChef v3)

V3 positions are NFTs. Transfer the position NFT to MasterChef v3:

```bash
cast send 0x46A15B0b27311cedF172AB29E4f4766fbE7F4364 \
  "safeTransferFrom(address,address,uint256)" \
  $YOUR_ADDRESS 0x556B9306565093C855AEA9AE92A594704c2Cd59e $TOKEN_ID \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

::: danger
Never use mainnet private keys in scripts. Use the PancakeSwap UI deep links for mainnet. CLI examples are for testnet or programmatic integrations only.
:::

---

## Unstake LP Tokens

### UI (recommended)

Direct the user to the same farm page where they can manage/withdraw:

```
https://pancakeswap.finance/liquidity/pools?chain=bsc
```

### CLI: V2 unstake

```bash
cast send 0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652 \
  "withdraw(uint256,uint256,address)" $PID $AMOUNT $YOUR_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### CLI: V3 unstake

```bash
cast send 0x556B9306565093C855AEA9AE92A594704c2Cd59e \
  "withdraw(uint256,address)" $TOKEN_ID $YOUR_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

---

## Stake CAKE

### Syrup Pools (earn partner tokens or CAKE)

Syrup Pools let users stake CAKE to earn various reward tokens. Each pool is a separate `SmartChefInitializable` contract.

**Primary: Deep link to the Syrup Pools page:**

```
https://pancakeswap.finance/pools
```

The user selects a pool in the UI, approves CAKE, and stakes. No contract address lookup is needed.

### CLI: Syrup Pool staking

```solidity
function deposit(uint256 amount) external;
function withdraw(uint256 amount) external;
function emergencyWithdraw() external;
function pendingReward(address user) external view returns (uint256);
function userInfo(address user) external view returns (uint256 amount, uint256 rewardDebt);
```

```bash
CAKE="0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
POOL_ADDRESS="0x..."  # from BscScan link on the pool card in the UI

cast send $CAKE \
  "approve(address,uint256)" $POOL_ADDRESS $AMOUNT \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org

cast send $POOL_ADDRESS \
  "deposit(uint256)" $AMOUNT \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### Unstake CAKE from Syrup Pool

```bash
cast send $POOL_ADDRESS \
  "withdraw(uint256)" $AMOUNT \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

::: danger
Never use mainnet private keys in scripts. Use the PancakeSwap UI for mainnet staking.
:::

---

## Harvest Rewards

### V2 Farm rewards

```bash
cast call 0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652 \
  "pendingCake(uint256,address)(uint256)" $PID $YOUR_ADDRESS \
  --rpc-url https://bsc-dataseed1.binance.org

cast send 0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652 \
  "harvest(uint256,address)" $PID $YOUR_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### V3 Farm rewards

```bash
cast call 0x556B9306565093C855AEA9AE92A594704c2Cd59e \
  "pendingCake(uint256)(uint256)" $TOKEN_ID \
  --rpc-url https://bsc-dataseed1.binance.org

cast send 0x556B9306565093C855AEA9AE92A594704c2Cd59e \
  "harvest(uint256,address)" $TOKEN_ID $YOUR_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### Syrup Pool rewards

```bash
cast call $POOL_ADDRESS \
  "pendingReward(address)(uint256)" $YOUR_ADDRESS \
  --rpc-url https://bsc-dataseed1.binance.org
```

### Infinity Farm rewards (Merkle claim)

Infinity farms distribute CAKE every **8 hours** (epochs at 00:00, 08:00, 16:00 UTC).

```bash
USER_ADDRESS="0xYourAddress"
CURRENT_TS=$(date +%s)
curl -s "https://infinity.pancakeswap.com/farms/users/56/${USER_ADDRESS}/${CURRENT_TS}"
```

Claim via the Distributor contract with the Merkle proof from the API response:

```bash
cast send 0xEA8620aAb2F07a0ae710442590D649ADE8440877 \
  "claim((address,uint256,bytes32[])[])" \
  "[($REWARD_TOKEN,$AMOUNT,[$PROOF1,$PROOF2,...])]" \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### UI Harvest (recommended for mainnet)

Direct the user to the relevant farm page — the UI has "Harvest" buttons:

```
https://pancakeswap.finance/liquidity/pools?chain=bsc
```

---

## Output Templates

::: danger MANDATORY OUTPUT RULE
**Every farm row you output MUST include a full `https://pancakeswap.finance/...` deep link URL.** A farm row without a URL is INVALID. Build the link from the Token Addresses table and URL Formulas above.
:::

### Multi-farm comparison table

Use this format when listing multiple farms. The **Deep Link** column is mandatory:

```
| Pair | APY | TVL | Type | Deep Link |
|------|-----|-----|------|-----------|
| MBOX / WBNB | 15.2% | $984K | V2 | https://pancakeswap.finance/v2/add/0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1 |
| CAKE / USDT | 12.4% | $340K | V3 | https://pancakeswap.finance/add/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/0x55d398326f99059fF775485246999027B3197955/2500?chain=bsc&persistChain=1 |
| USDT / WBNB | 10.7% | $321K | V2 | https://pancakeswap.finance/v2/add/0x55d398326f99059fF775485246999027B3197955/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1 |
```

### Single farm recommendation

```
## Farming Plan Summary

**Strategy:** Stake WBNB-CAKE LP in V3 Farm
**Chain:** BNB Smart Chain
**Pool:** WBNB / CAKE (0.25% fee tier)
**Farm APR:** ~45%
**Reward:** CAKE

### Steps
1. Add liquidity: https://pancakeswap.finance/add/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/2500?chain=bsc&persistChain=1
2. Stake in farm: https://pancakeswap.finance/liquidity/pools?chain=bsc

### Risks
- Impermanent loss if BNB/CAKE price ratio changes significantly
- CAKE reward value depends on CAKE token price
- V3 positions require active range management
```

---

## Anti-Patterns

::: danger Never do these
1. **Never hardcode APR values** — always fetch live data from the PancakeSwap Explorer API
2. **Never skip IL warnings** — always warn about impermanent loss for volatile pairs
3. **Never assume farm availability** — farms can be stopped; verify via PancakeSwap Explorer API or CampaignManager
4. **Never expose private keys** — always use deep links for mainnet
5. **Never ignore chain context** — V2 farms are BSC-only; other chains have V3/Infinity only
6. **Never output a farm without a deep link** — every farm row needs a clickable URL
:::

---

## Farming Types Reference

| Type           | Pool Version | How It Works                                                  | Reward  |
| -------------- | ------------ | ------------------------------------------------------------- | ------- |
| V2 Farms       | V2           | Stake LP tokens in MasterChef v2, earn CAKE per block         | CAKE    |
| V3 Farms       | V3           | Stake V3 NFT positions in MasterChef v3, earn CAKE per block  | CAKE    |
| Infinity Farms | Infinity     | Provide liquidity, CAKE allocated per epoch (8h) via Merkle   | CAKE    |
| Syrup Pools    | —            | Stake CAKE to earn partner tokens or more CAKE                | Various |

## Supported Chains

| Chain           | Chain ID | Farms Support    | Native Token |
| --------------- | -------- | ---------------- | ------------ |
| BNB Smart Chain | 56       | V2, V3, Infinity | BNB          |
| Ethereum        | 1        | V3               | ETH          |
| Arbitrum One    | 42161    | V3               | ETH          |
| Base            | 8453     | V3               | ETH          |
| zkSync Era      | 324      | V3               | ETH          |
