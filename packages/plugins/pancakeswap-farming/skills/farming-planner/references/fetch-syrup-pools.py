import json, sys, os, time
try:
    import requests
except ImportError:
    os.system('pip install requests -q')
    import requests
RPC_URL = 'https://bsc-rpc.publicnode.com'
SECONDS_PER_YEAR = 31_536_000
BSC_BLOCKS_PER_YEAR = 10_512_000
def get_cake_price():
    try:
        r = requests.get('https://api.coingecko.com/api/v3/simple/price?ids=pancakeswap-token&vs_currencies=usd', timeout=10)
        return r.json()['pancakeswap-token']['usd']
    except Exception:
        return 0
def get_token_price(address):
    try:
        r = requests.get(f'https://api.dexscreener.com/latest/dex/tokens/{address}', timeout=10)
        pairs = r.json().get('pairs', [])
        if pairs:
            return float(pairs[0].get('priceUsd', 0))
    except Exception:
        pass
    return 0
def eth_call_batch(calls):
    batch = []
    for i, (to, data) in enumerate(calls):
        batch.append({"jsonrpc": "2.0", "id": i, "method": "eth_call", "params": [{"to": to, "data": data}, "latest"]})
    try:
        r = requests.post(RPC_URL, json=batch, timeout=15)
        results = r.json()
        if isinstance(results, list):
            results.sort(key=lambda x: x.get('id', 0))
            return [x.get('result', '0x0') for x in results]
    except Exception:
        pass
    return ['0x0'] * len(calls)
def pad_address(addr):
    return addr.lower().replace('0x', '').zfill(64)
BALANCE_OF = '0x70a08231'
pools_data = requests.get('https://configs.pancakeswap.com/api/data/cached/syrup-pools?chainId=56&isFinished=false', timeout=10).json()
pools = [p for p in pools_data if p['sousId'] != 0]
if not pools:
    print('No active Syrup Pools found.')
    sys.exit(0)
cake_price = get_cake_price()
cake_addr = '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'
token_prices = {cake_addr: cake_price}
all_addrs = set()
for p in pools:
    all_addrs.add(p['stakingToken']['address'].lower())
    all_addrs.add(p['earningToken']['address'].lower())
for addr in all_addrs:
    if addr == cake_addr:
        continue
    token_prices[addr] = get_token_price(addr)
    time.sleep(0.3)
calls = []
for p in pools:
    calls.append((p['stakingToken']['address'], BALANCE_OF + pad_address(p['contractAddress'])))
staked_results = eth_call_batch(calls)
print('| Pool | Stake | Earn | APR | TVL | Deep Link |')
print('|------|-------|------|-----|-----|-----------|')
rows = []
for i, p in enumerate(pools):
    stk_sym = p['stakingToken']['symbol']
    earn_sym = p['earningToken']['symbol']
    stk_addr = p['stakingToken']['address'].lower()
    earn_addr = p['earningToken']['address'].lower()
    stk_dec = p['stakingToken']['decimals']
    raw = staked_results[i] if staked_results[i] and staked_results[i] != '0x' else '0x0'
    total_staked = int(raw, 16) / (10 ** stk_dec)
    stk_price = token_prices.get(stk_addr, 0)
    earn_price = token_prices.get(earn_addr, 0)
    tps = p.get('tokenPerSecond')
    tpb = p.get('tokenPerBlock')
    if tps:
        yearly_tokens = float(tps) * SECONDS_PER_YEAR
    elif tpb:
        yearly_tokens = float(tpb) * BSC_BLOCKS_PER_YEAR
    else:
        yearly_tokens = 0
    staked_value = stk_price * total_staked
    yearly_reward_usd = earn_price * yearly_tokens
    apr = (yearly_reward_usd / staked_value * 100) if staked_value > 0 else 0
    tvl_str = f'${int(staked_value):,}'
    apr_str = f'{apr:.1f}%'
    link = 'https://pancakeswap.finance/pools?chain=bsc'
    rows.append((apr, f'| {stk_sym} → {earn_sym} | {stk_sym} | {earn_sym} | {apr_str} | {tvl_str} | {link} |'))
rows.sort(key=lambda x: x[0], reverse=True)
for _, row in rows:
    print(row)
