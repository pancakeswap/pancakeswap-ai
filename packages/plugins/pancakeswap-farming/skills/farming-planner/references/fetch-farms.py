import json, sys, os, time, re
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
ADDR_RE = re.compile(r'^0x[0-9a-fA-F]{40}$')
POOL_ID_RE = re.compile(r'^0x[0-9a-fA-F]{64}$')
def _valid_addr(a):
    return bool(ADDR_RE.match(a))
def build_link(pool):
    chain_id = pool['chainId']
    chain_key = CHAIN_ID_TO_KEY.get(chain_id, 'bsc')
    proto = pool['protocol']
    t0 = token_addr(pool['token0'], chain_id)
    t1 = token_addr(pool['token1'], chain_id)
    fee = pool.get('feeTier', 2500)
    if not _valid_addr(t0) or not _valid_addr(t1):
        return f'https://pancakeswap.finance/liquidity/pools?chain={chain_key}'
    if proto == 'v2':
        return f'https://pancakeswap.finance/v2/add/{t0}/{t1}?chain={chain_key}&persistChain=1'
    elif proto == 'v3':
        return f'https://pancakeswap.finance/add/{t0}/{t1}/{fee}?chain={chain_key}&persistChain=1'
    elif proto == 'stable':
        return f'https://pancakeswap.finance/stable/add/{t0}/{t1}?chain={chain_key}&persistChain=1'
    elif proto in ('infinityCl', 'infinityBin', 'infinityStable'):
        pool_id = pool['id']
        if not POOL_ID_RE.match(pool_id):
            return f'https://pancakeswap.finance/liquidity/pools?chain={chain_key}'
        return f'https://pancakeswap.finance/liquidity/add/{chain_key}/infinity/{pool_id}?chain={chain_key}&persistChain=1'
    else:
        return f'https://pancakeswap.finance/liquidity/pools?chain={chain_key}'
data = json.load(sys.stdin)
pools = data if isinstance(data, list) else data.get('rows', data.get('data', []))
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
