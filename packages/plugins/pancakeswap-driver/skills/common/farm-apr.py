import json, sys, os, time, re
try:
    import requests
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'requests'])
    import requests

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
BATCH_CHUNK = 8
SIG_CAKE_PER_SEC  = '0xc4f6a8ce'
SIG_TOTAL_ALLOC   = '0x17caf6f1'
SIG_POOL_ADDR_PID = '0x0743384d'
SIG_POOL_INFO     = '0x1526fe27'

ADDR_RE    = re.compile(r'^0x[0-9a-fA-F]{40}$')
POOL_ID_RE = re.compile(r'^0x[0-9a-fA-F]{64}$')

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
        r = requests.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=pancakeswap-token&vs_currencies=usd',
            timeout=5)
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

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({'chainId': 0, 'cakePrice': 0, 'cakePerYear': {}}))
            sys.exit(0)

        chain_id = int(sys.argv[1])
        pool_ids = [p.lower() for p in sys.argv[2:]]

        v3_addrs = [p for p in pool_ids if ADDR_RE.match(p)]
        inf_ids   = [p for p in pool_ids if POOL_ID_RE.match(p)]

        cake_price = get_cake_price()
        cake_per_year = {}

        # V3: on-chain MasterChef lookup
        if v3_addrs:
            v3_data = get_v3_cake_data(chain_id, v3_addrs)
            cake_per_year.update(v3_data)

        # Infinity: REST campaign API
        if inf_ids:
            try:
                r = requests.get(
                    f'https://infinity.pancakeswap.com/farms/campaigns/{chain_id}/false?limit=100&page=1',
                    timeout=10)
                campaigns = r.json().get('campaigns', [])
                SECONDS_PER_YEAR = 31_536_000
                for c in campaigns:
                    pid = c['poolId'].lower()
                    if pid not in inf_ids:
                        continue
                    reward_raw = int(c.get('totalRewardAmount', 0))
                    duration = int(c.get('duration', 0))
                    if duration <= 0 or reward_raw <= 0:
                        continue
                    yearly_reward = (reward_raw / 1e18) / duration * SECONDS_PER_YEAR
                    cake_per_year[pid] = cake_per_year.get(pid, 0) + yearly_reward
            except Exception:
                pass

        print(json.dumps({
            'chainId': chain_id,
            'cakePrice': cake_price,
            'cakePerYear': cake_per_year,
        }))
    except Exception:
        chain_id = int(sys.argv[1]) if len(sys.argv) >= 2 else 0
        print(json.dumps({'chainId': chain_id, 'cakePrice': 0, 'cakePerYear': {}}))
        sys.exit(0)

main()
