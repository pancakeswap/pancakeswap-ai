// harvest-solana.cjs
// Discover PancakeSwap Solana CLMM positions and farm positions, output pending rewards.
//
// Environment variables:
//   SOL_WALLET  — base58 Solana public key (required)

'use strict'

const { Raydium, fetchMultipleFarmInfoAndUpdate } = require('@pancakeswap/solana-core-sdk')
const { Connection, PublicKey } = require('@solana/web3.js')

async function main() {
  const owner = new PublicKey(process.env.SOL_WALLET)
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')

  const raydium = await Raydium.load({
    connection,
    owner,
    cluster: 'mainnet',
    disableFeatureCheck: true,
    disableLoadToken: true,
  })

  // 1. CLMM (concentrated liquidity) positions
  const clmmProgramId = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH'
  const clmmPositions = await raydium.clmm.getOwnerPositionInfo({ programId: clmmProgramId })

  // 2. Farm stake positions via Raydium/PCS API
  const stakeUrl = `https://api-v3.raydium.io/position/stake/${owner.toBase58()}`
  const stakeResp = await fetch(stakeUrl)
  const stakeData = await stakeResp.json()
  const farmPools = (stakeData?.data ?? []).map(p => ({ ...p, programId: new PublicKey(p.programId) }))

  // 3. Pending rewards per farm (on-chain)
  let farmInfo = {}
  if (farmPools.length > 0) {
    const chainTime = Math.floor(Date.now() / 1000)
    farmInfo = await fetchMultipleFarmInfoAndUpdate({ connection, farmPools, owner, chainTime })
  }

  // 4. Output structured JSON
  const clmmOut = clmmPositions.map(p => ({
    positionId: p.nftMint?.toBase58?.() ?? null,
    poolId: p.poolId?.toBase58?.() ?? null,
    tickLower: p.tickLowerIndex,
    tickUpper: p.tickUpperIndex,
    liquidity: p.liquidity?.toString() ?? '0',
    // Pending fees require pool fee-growth state — see UI deeplink for exact amounts
  }))

  const farmOut = Object.entries(farmInfo).map(([poolId, info]) => ({
    poolId,
    deposited: info.ledger?.deposited?.toString() ?? '0',
    pendingRewards: (info.wrapped?.pendingRewards ?? []).map(r => r.toString()),
  }))

  console.log(JSON.stringify({
    type: 'solana-positions',
    wallet: owner.toBase58(),
    clmmPositions: clmmOut,
    farmPositions: farmOut,
  }))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
