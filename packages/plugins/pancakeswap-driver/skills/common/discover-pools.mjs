// discover-pools.mjs
// Single script that discovers PancakeSwap pools and fetches all APR data.
//
// Environment variables:
//   CHAIN      — chain string (required): bsc, eth, arb, base, zksync, linea, opbnb, monad, sol
//   TOKEN0     — EVM address, Solana pubkey, or native alias (bnb/eth/sol) (optional)
//   TOKEN1     — same as TOKEN0 (optional)
//   ORDER_BY   — tvlUSD (default), apr24h, volumeUSD24h

import {
  BinPoolManagerAbi,
  CLPoolManagerAbi,
  INFI_BIN_POOL_MANAGER_ADDRESSES,
  INFI_CL_POOL_MANAGER_ADDRESSES,
} from '@pancakeswap/infinity-sdk'
import { createPublicClient, http } from 'viem'
import { base, bsc } from 'viem/chains'

// ─── Chain config ──────────────────────────────────────────────────────────────

const CHAIN_STRING_TO_ID = {
  bsc: 56,
  eth: 1,
  arb: 42161,
  base: 8453,
  zksync: 324,
  linea: 59144,
  opbnb: 204,
  monad: 143,
  sol: 8000001001,
}

const CHAIN_VIEM_MAP = {
  56: bsc,
  8453: base,
}

const CHAIN_RPC = {
  56: 'https://bsc-dataseed1.binance.org',
  8453: 'https://mainnet.base.org',
}

const MASTERCHEF_V3 = {
  56: '0x556B9306565093C855AEA9AE92A594704c2Cd59e',
  1: '0x556B9306565093C855AEA9AE92A594704c2Cd59e',
  42161: '0x5e09ACf80C0296740eC5d6F643005a4ef8DaA694',
  8453: '0xC6A2Db661D5a5690172d8eB0a7DEA2d3008665A3',
  324: '0x4c615E78c5fCA1Ad31e4d66eb0D8688d84307463',
}

const MC_V3_RPC = {
  56: 'https://bsc-rpc.publicnode.com',
  1: 'https://ethereum-rpc.publicnode.com',
  42161: 'https://arbitrum-one-rpc.publicnode.com',
  8453: 'https://base-rpc.publicnode.com',
  324: 'https://zksync-era-rpc.publicnode.com',
}

const WBNB_BSC = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const INCENTRA_API = 'https://incentra-prd.brevis.network/sdk/v1'
const INCENTRA_CAMPAIGN_TYPES = [3, 4, 8]
const MERKL_CHAIN_IDS = [1, 56, 8453, 42161, 324, 59144, 143]
const SECONDS_PER_YEAR = 31_536_000
const FEE_BASE = 10_000

// ─── Input parsing ─────────────────────────────────────────────────────────────

const CHAIN = (process.env.CHAIN || '').toLowerCase()
const TOKEN0_RAW = (process.env.TOKEN0 || '').toLowerCase()
const TOKEN1_RAW = (process.env.TOKEN1 || '').toLowerCase()
const ORDER_BY = process.env.ORDER_BY || 'tvlUSD'

const ALL_PROTOCOLS = ['v2', 'v3', 'stable', 'infinityCl', 'infinityBin', 'infinityStable']
const PROTOCOLS_INPUT = process.env.PROTOCOLS
  ? process.env.PROTOCOLS.split(',')
      .map((p) => p.trim())
      .filter(Boolean)
  : ALL_PROTOCOLS

if (!CHAIN_STRING_TO_ID[CHAIN]) {
  throw new Error(
    `Unsupported CHAIN: "${CHAIN}". Supported: ${Object.keys(CHAIN_STRING_TO_ID).join(', ')}`,
  )
}

const ORDER = ['tvlUSD', 'apr24h', 'volumeUSD24h']
if (!ORDER.includes(ORDER_BY)) {
  throw new Error(`Unsupported ORDER_BY: "${ORDER_BY}". Supported: ${ORDER.join(', ')}`)
}

const invalidProtocols = PROTOCOLS_INPUT.filter((p) => !ALL_PROTOCOLS.includes(p))
if (invalidProtocols.length > 0) {
  throw new Error(
    `Unsupported PROTOCOLS: "${invalidProtocols.join(', ')}". Supported: ${ALL_PROTOCOLS.join(
      ', ',
    )}`,
  )
}

const chainId = CHAIN_STRING_TO_ID[CHAIN]
const isSolana = CHAIN === 'sol'

const EVM_ADDR_RE = /^0x[0-9a-fA-F]{40}$/
const SOL_ADDR_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const INF_POOL_ID_RE = /^0x[0-9a-fA-F]{64}$/

// Resolve native aliases to their canonical forms for API queries
function resolveToken(raw) {
  if (!raw) return null
  if (raw === 'bnb') return { native: true, aliases: [ZERO_ADDR, WBNB_BSC] }
  if (raw === 'eth') return { native: true, aliases: [] } // omit from token filter
  if (raw === 'sol') return { native: true, aliases: [] }
  return { native: false, address: raw }
}

const token0 = resolveToken(TOKEN0_RAW)
const token1 = resolveToken(TOKEN1_RAW)

// ─── Explorer API helpers ──────────────────────────────────────────────────────

const EXPLORER_BASE = 'https://explorer.pancakeswap.com/api/cached/pools'
const PROTOCOLS = PROTOCOLS_INPUT.map((p) => `protocols=${p}`).join('&')

function feeTierPct(pool) {
  if (pool.protocol === 'stable') return '0.01%'
  if (pool.isDynamicFee) return '0%'
  if (pool.protocol === 'infinityStable') return `${(pool.feeTier / 100_000_000).toPrecision(4)}%`
  return `${pool.feeTier / 10_000}%`
}

const GET_FEE_ABI = [
  {
    name: 'getFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint24' }],
  },
]

function apr24hPct(pool) {
  const v = parseFloat(pool.apr24h || '0')
  return `${(v * 100).toFixed(2)}%`
}

async function fetchExplorerPair(t0addr, t1addr) {
  const url = `${EXPLORER_BASE}/list/pair/${t0addr}/${t1addr}?chains=${CHAIN}&${PROTOCOLS}&orderBy=${ORDER_BY}`
  const r = await fetch(url)
  const data = await r.json()
  return data.rows || []
}

async function fetchExplorerList(tokenParams) {
  const base = `${EXPLORER_BASE}/list?chains=${CHAIN}&${PROTOCOLS}&orderBy=${ORDER_BY}`
  const qs = tokenParams.map((t) => `tokens=${t}`).join('&')
  const url = qs ? `${base}&${qs}` : base
  const r = await fetch(url)
  const data = await r.json()
  return data.rows || []
}

function normalizePool(row) {
  const lpFeeApr = apr24hPct(row)
  return {
    id: row.id,
    protocol: row.protocol,
    feeTierPct: feeTierPct(row),
    isDynamicFee: row.isDynamicFee || false,
    hookAddress: row.hookAddress || null,
    tvlUSD: row.tvlUSD,
    volumeUSD24h: row.volumeUSD24h,
    lpFeeApr,
    token0: row.token0?.symbol || '',
    token1: row.token1?.symbol || '',
    token0Address: row.token0?.id || row.token0?.address || '',
    token1Address: row.token1?.id || row.token1?.address || '',
    cakePerYear: 0,
    cakeAprPct: '—',
    totalAprPct: lpFeeApr,
    merklApr: [],
    incentraApr: [],
    protocolFeePercent: null,
  }
}

// ─── Pool discovery ────────────────────────────────────────────────────────────

async function discoverPools() {
  if (isSolana) {
    return fetchSolanaPools()
  }

  const bothKnown = token0 && !token0.native && token1 && !token1.native

  const bnbToken = [token0, token1].find((t) => t?.native && t.aliases?.length > 0)

  if (bothKnown) {
    const rows = await fetchExplorerPair(token0.address, token1.address)
    return filterMinTvl(dedupe(rows.map(normalizePool)))
  }

  if (bnbToken) {
    // BNB special case: query both zero address and WBNB
    const otherToken = token0 === bnbToken ? token1 : token0
    const [rows0, rows1] = await Promise.all(
      bnbToken.aliases.map((alias) => {
        if (otherToken && !otherToken.native) {
          return fetchExplorerPair(alias, otherToken.address)
        }
        return fetchExplorerList([`${chainId}:${alias}`])
      }),
    )
    return filterMinTvl(dedupe([...rows0, ...rows1].map(normalizePool)))
  }

  // Build token params for list endpoint
  const tokenParams = []
  for (const t of [token0, token1]) {
    if (t && !t.native && EVM_ADDR_RE.test(t.address)) {
      tokenParams.push(`${chainId}:${t.address}`)
    }
  }
  const rows = await fetchExplorerList(tokenParams)
  return filterMinTvl(dedupe(rows.map(normalizePool)))
}

function dedupe(pools) {
  const seen = new Set()
  return pools.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

function filterMinTvl(pools) {
  return pools.filter((p) => parseFloat(p.tvlUSD) >= 100)
}

// ─── Solana pool discovery + APR ──────────────────────────────────────────────

async function fetchSolanaPools() {
  const tokenParams = []
  for (const t of [token0, token1]) {
    if (t && !t.native && SOL_ADDR_RE.test(t.address)) {
      tokenParams.push(`${chainId}:${t.address}`)
    }
  }
  const rows = await fetchExplorerList(tokenParams)
  const pools = filterMinTvl(dedupe(rows.map(normalizePool)))

  if (pools.length === 0) return pools

  // Fetch sol-explorer APR data for all pools at once
  const ids = pools.map((p) => p.id).join(',')
  try {
    const r = await fetch(
      `https://sol-explorer.pancakeswap.com/api/cached/v1/pools/info/ids?ids=${ids}`,
    )
    const data = await r.json()
    const byId = {}
    for (const entry of data.data || []) {
      byId[entry.id] = entry
    }
    for (const pool of pools) {
      const info = byId[pool.id]
      if (!info) continue
      const feeApr = info.day?.feeApr ?? 0
      const cakeFarmApr = info.day?.rewardApr?.[0] ?? 0
      pool.apr24hPct = `${feeApr.toFixed(2)}%`
      if (cakeFarmApr > 0) {
        pool.cakeAprPct = `${cakeFarmApr.toFixed(2)}%`
      }
    }
  } catch (_) {
    // sol-explorer unavailable — continue with Explorer API APR only
  }

  return pools
}

// ─── Merkl + Incentra APRs ─────────────────────────────────────────────────────

async function fetchIncentraApr() {
  try {
    const r = await fetch(`${INCENTRA_API}/liquidityCampaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_type: INCENTRA_CAMPAIGN_TYPES, status: [4] }),
    })
    const data = await r.json()
    if (data.err) return []

    return data.campaigns.map((c) => ({
      chainId: c.chainId,
      campaignId: c.campaignId,
      poolId: c.pools.poolId,
      poolName: c.pools.poolName,
      apr: c.rewardInfo.apr * 100,
      status: c.status,
    }))
  } catch (_) {
    return []
  }
}

async function fetchMerklApr() {
  try {
    const r = await fetch(
      `https://api.merkl.xyz/v4/opportunities/?chainId=${MERKL_CHAIN_IDS.join(
        ',',
      )}&test=false&mainProtocolId=pancake-swap&action=POOL,HOLD&status=LIVE&items=100`,
    )
    const result = await r.json()
    const pancake = result?.filter(
      (o) =>
        o?.tokens?.[0]?.symbol?.toLowerCase().startsWith('cake-lp') ||
        o?.protocol?.id?.toLowerCase().startsWith('pancake-swap') ||
        o?.protocol?.id?.toLowerCase().startsWith('pancakeswap'),
    )
    return pancake.map((c) => ({
      chainId: c.chainId,
      campaignId: c.identifier,
      poolId: c.identifier,
      poolName: c.name,
      apr: c.apr / 100,
      status: c.status,
    }))
  } catch (_) {
    return []
  }
}

function matchExtraAprs(pools, merklApr, incentraApr) {
  for (const pool of pools) {
    const id = pool.id.toLowerCase()
    pool.merklApr = merklApr.filter(
      (m) => m.chainId.toString() === chainId.toString() && m.poolId.toLowerCase() === id,
    )
    pool.incentraApr = incentraApr.filter(
      (i) => i.chainId.toString() === chainId.toString() && i.poolId.toLowerCase() === id,
    )
    if (pool.incentraApr.length) {
      pool.totalAprPct = `${
        pool.incentraApr[0].apr + (parseFloat(pool.totalAprPct.replace('%', '')) || 0)
      }%`
    }
    if (pool.merklApr.length) {
      pool.totalAprPct = `${
        pool.merklApr[0].apr * 100 + (parseFloat(pool.totalAprPct.replace('%', '')) || 0)
      }%`
    }
  }
}

// ─── CAKE farm APR (V3 on-chain MasterChef + Infinity REST) ───────────────────

async function rpcBatch(rpcUrl, calls) {
  const CHUNK = 8
  const results = new Array(calls.length).fill('0x')
  for (let i = 0; i < calls.length; i += CHUNK) {
    const chunk = calls.slice(i, i + CHUNK)
    const batch = chunk.map(([to, data], idx) => ({
      jsonrpc: '2.0',
      id: idx,
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
    }))
    try {
      const r = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      })
      const raw = await r.json()
      if (Array.isArray(raw)) {
        raw.sort((a, b) => a.id - b.id)
        for (let j = 0; j < raw.length; j++) {
          results[i + j] = raw[j]?.result || '0x'
        }
      }
    } catch (_) {
      // leave as '0x'
    }
  }
  return results
}

function decodeUint(hex) {
  if (!hex || hex === '0x') return 0n
  return BigInt(hex)
}

function padAddress(addr) {
  return addr.toLowerCase().replace('0x', '').padStart(64, '0')
}

function padUint(val) {
  return BigInt(val).toString(16).padStart(64, '0')
}

const SIG_CAKE_PER_SEC = '0xc4f6a8ce'
const SIG_TOTAL_ALLOC = '0x17caf6f1'
const SIG_POOL_ADDR_PID = '0x0743384d'
const SIG_POOL_INFO = '0x1526fe27'

async function fetchV3CakePerYear(poolAddresses) {
  const mc = MASTERCHEF_V3[chainId]
  const rpc = MC_V3_RPC[chainId]
  if (!mc || !rpc || poolAddresses.length === 0) return {}

  const calls = [
    [mc, SIG_CAKE_PER_SEC],
    [mc, SIG_TOTAL_ALLOC],
    ...poolAddresses.map((a) => [mc, SIG_POOL_ADDR_PID + padAddress(a)]),
  ]

  const results = await rpcBatch(rpc, calls)
  const cakePerSecRaw = decodeUint(results[0])
  const totalAlloc = decodeUint(results[1])
  if (totalAlloc === 0n || cakePerSecRaw === 0n) return {}

  const cakePerSec = Number(cakePerSecRaw) / 1e12 / 1e18

  const pids = poolAddresses.map((_, i) => decodeUint(results[2 + i]))
  const infoCalls = pids.map((pid) => [mc, SIG_POOL_INFO + padUint(pid)])
  const infoResults = await rpcBatch(rpc, infoCalls)

  const out = {}
  for (let i = 0; i < poolAddresses.length; i++) {
    const hex = infoResults[i]
    if (!hex || hex === '0x' || hex.length < 66) {
      out[poolAddresses[i].toLowerCase()] = 0
      continue
    }
    const allocPoint = Number(BigInt('0x' + hex.slice(2, 66)))
    if (poolAddresses.length > 0 && hex.length >= 130) {
      const returnedPool = '0x' + hex.slice(90, 130).toLowerCase()
      if (returnedPool !== poolAddresses[i].toLowerCase()) {
        out[poolAddresses[i].toLowerCase()] = 0
        continue
      }
    }
    if (allocPoint === 0) {
      out[poolAddresses[i].toLowerCase()] = 0
      continue
    }
    const poolCakePerSec = cakePerSec * (allocPoint / Number(totalAlloc))
    out[poolAddresses[i].toLowerCase()] = poolCakePerSec * SECONDS_PER_YEAR
  }
  return out
}

async function fetchInfinityCakePerYear(infinityPoolIds) {
  if (infinityPoolIds.length === 0) return {}
  const out = {}
  try {
    const r = await fetch(
      `https://infinity.pancakeswap.com/farms/campaigns/${chainId}/false?limit=100&page=1`,
    )
    const data = await r.json()
    for (const c of data.campaigns || []) {
      const pid = c.poolId.toLowerCase()
      if (!infinityPoolIds.includes(pid)) continue
      const rewardRaw = Number(c.totalRewardAmount || 0)
      const duration = Number(c.duration || 0)
      if (duration <= 0 || rewardRaw <= 0) continue
      const yearlyReward = (rewardRaw / 1e18 / duration) * SECONDS_PER_YEAR
      out[pid] = (out[pid] || 0) + yearlyReward
    }
  } catch (_) {
    // continue without infinity farm data
  }
  return out
}

async function fetchCakePrice() {
  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=pancakeswap-token&vs_currencies=usd',
    )
    const data = await r.json()
    return data?.['pancakeswap-token']?.usd || 0
  } catch (_) {
    return 0
  }
}

async function fetchCakeFarmAprs(pools) {
  const v3Addresses = pools
    .filter((p) => p.protocol === 'v3' && EVM_ADDR_RE.test(p.id))
    .map((p) => p.id.toLowerCase())

  const infinityIds = pools
    .filter(
      (p) =>
        (p.protocol === 'infinityCl' || p.protocol === 'infinityBin') && INF_POOL_ID_RE.test(p.id),
    )
    .map((p) => p.id.toLowerCase())

  const [cakePrice, v3Data, infData] = await Promise.all([
    fetchCakePrice(),
    fetchV3CakePerYear(v3Addresses),
    fetchInfinityCakePerYear(infinityIds),
  ])

  const cakePerYear = { ...v3Data, ...infData }

  for (const pool of pools) {
    const id = pool.id.toLowerCase()
    if (id in cakePerYear) {
      pool.cakePerYear = cakePerYear[id]
      const tvl = parseFloat(pool.tvlUSD) || 0
      if (cakePerYear[id] > 0 && cakePrice > 0 && tvl > 0) {
        const apr = (cakePerYear[id] * cakePrice) / tvl
        pool.cakeAprPct = `${(apr * 100).toFixed(2)}%`
        pool.totalAprPct = `${apr * 100 + (parseFloat(pool.totalAprPct.replace('%', '')) || 0)}%`
      }
    }
  }

  return cakePrice
}

// ─── Infinity protocol fees ────────────────────────────────────────────────────

function parseProtocolFee(packed) {
  const token0Fee = Number(packed) % 2 ** 12
  return token0Fee / FEE_BASE
}

async function fetchProtocolFees(pools) {
  const viemChain = CHAIN_VIEM_MAP[chainId]
  const rpcUrl = CHAIN_RPC[chainId]
  if (!viemChain || !rpcUrl) return

  const infinityPools = pools.filter(
    (p) =>
      (p.protocol === 'infinityCl' || p.protocol === 'infinityBin') && INF_POOL_ID_RE.test(p.id),
  )
  if (infinityPools.length === 0) return

  const client = createPublicClient({ chain: viemChain, transport: http(rpcUrl) })

  const slot0Calls = infinityPools.flatMap((p) => [
    {
      address: INFI_CL_POOL_MANAGER_ADDRESSES[chainId],
      abi: CLPoolManagerAbi,
      functionName: 'getSlot0',
      args: [p.id],
    },
    {
      address: INFI_BIN_POOL_MANAGER_ADDRESSES[chainId],
      abi: BinPoolManagerAbi,
      functionName: 'getSlot0',
      args: [p.id],
    },
  ])

  let slot0Results = []
  try {
    slot0Results = await client.multicall({ contracts: slot0Calls })
  } catch (_) {
    // leave protocolFeePercent as null for all pools
  }

  const dynamicPools = []

  for (let i = 0; i < infinityPools.length; i++) {
    const pool = infinityPools[i]
    const clResult = slot0Results[i * 2]
    const binResult = slot0Results[i * 2 + 1]

    let feePercent = 0
    if (clResult?.status === 'success' && clResult.result[0] !== 0n) {
      feePercent = parseProtocolFee(clResult.result[2])
    } else if (binResult?.status === 'success' && binResult.result[0] !== 0n) {
      feePercent = parseProtocolFee(binResult.result[1])
    }

    pool.protocolFeePercent = `${feePercent}%`

    if (pool.isDynamicFee && pool.hookAddress) {
      dynamicPools.push({ pool, feePercent })
    } else {
      // Incorporate protocol fee into feeTierPct for fixed-fee pools
      const baseFee = parseFloat(pool.feeTierPct)
      pool.feeTierPct = `${(baseFee + feePercent).toFixed(4).replace(/\.?0+$/, '')}%`
    }
  }

  await fetchDynamicFees(client, dynamicPools)
}

async function fetchDynamicFees(client, dynamicPools) {
  if (dynamicPools.length === 0) return


  const calls = dynamicPools.map(({ pool }) => ({
    address: pool.hookAddress,
    abi: GET_FEE_ABI,
    functionName: 'getFee',
    args: [ZERO_ADDR],
  }))

  try {
    const results = await client.multicall({ contracts: calls })
    for (let i = 0; i < dynamicPools.length; i++) {
      const { pool, feePercent } = dynamicPools[i]
      const r = results[i]
      if (r?.status === 'success') {
        const dynamicLpFee = Number(r.result) / FEE_BASE
        pool.feeTierPct = `${(dynamicLpFee + feePercent).toString().replace(/\.?0+$/, '')}%`
      }
    }
  } catch (_) {
    // leave feeTierPct as placeholder
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const [pools, [merklApr, incentraApr]] = await Promise.all([
  discoverPools(),
  Promise.all([fetchMerklApr(), fetchIncentraApr()]),
])

matchExtraAprs(pools, merklApr, incentraApr)

let cakePrice = 0
if (!isSolana) {
  const [price] = await Promise.all([fetchCakeFarmAprs(pools), fetchProtocolFees(pools)])
  cakePrice = price
}

console.log(
  JSON.stringify(
    {
      chain: CHAIN,
      chainId,
      cakePrice,
      pools,
    },
    null,
    2,
  ),
)
