const INCENTRA_API = 'https://incentra-prd.brevis.network/sdk/v1'
const INCENTRA_CAMPAIGN_TYPES = [3, 4, 8]

// Networks supported by PCS + Merkl
const merklChainIds = [
  1, // Ethereum
  56, // BSC
  8453, // Base
  42161, // Arbitrum One
  324, // Zksync Era
  59144, // Linea Mainnet
  143, // Monad Mainnet
]

async function getIncentraApr() {
  try {
    const resp = await fetch(`${INCENTRA_API}/liquidityCampaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_type: INCENTRA_CAMPAIGN_TYPES,
        status: [4], // ACTIVE
      }),
    })

    const data = await resp.json()

    if (data.err) {
      return []
    }

    return data.campaigns.map((c) => ({
      chainId: c.chainId,
      campaignId: c.campaignId,
      poolId: c.pools.poolId,
      poolName: c.pools.poolName,
      apr: c.rewardInfo.apr * 100, // convert to percentage
      status: c.status,
    }))
  } catch (e) {
    return []
  }
}

async function getMerklApr() {
  try {
    const resp = await fetch(
      `https://api.merkl.xyz/v4/opportunities/?chainId=${merklChainIds.join(
        ',',
      )}&test=false&mainProtocolId=pancake-swap&action=POOL,HOLD&status=LIVE&items=100`,
    )

    const result = await resp.json()
    const pancakeResult = result?.filter(
      (opportunity) =>
        opportunity?.tokens?.[0]?.symbol?.toLowerCase().startsWith('cake-lp') ||
        opportunity?.protocol?.id?.toLowerCase().startsWith('pancake-swap') ||
        opportunity?.protocol?.id?.toLowerCase().startsWith('pancakeswap'),
    );

    return pancakeResult.map((c) => ({
      chainId: c.chainId,
      campaignId: c.identifier,
      poolId: c.identifier,
      poolName: c.name,
      apr: c.apr / 100, // convert to percentage
      status: c.status,
    }))

  } catch (e) {
    return [];
  }
}

const [merklApr, incentraApr] = await Promise.all([getMerklApr(), getIncentraApr()])
console.log(JSON.stringify({ merklApr, incentraApr }))
