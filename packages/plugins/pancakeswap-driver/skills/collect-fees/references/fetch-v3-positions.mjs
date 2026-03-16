// fetch-v3-positions.mjs
// Fetch all V3 NonfungiblePositionManager positions for a wallet across all supported chains.
//
// Environment variables:
//   CHAIN_ID          — numeric chain ID (required)
//   WALLET            — 0x wallet address (required)
//   RPC               — JSON-RPC endpoint URL (required)

import {
  NFT_POSITION_MANAGER_ADDRESSES,
  nonfungiblePositionManagerABI,
} from "@pancakeswap/v3-sdk";
import { createPublicClient, http } from "viem";
import {
  arbitrum,
  base,
  bsc,
  linea,
  mainnet,
  monad,
  opBNB,
  zksync,
} from "viem/chains";

const CHAIN_MAP = {
  56: bsc,
  1: mainnet,
  42161: arbitrum,
  8453: base,
  324: zksync,
  59144: linea,
  204: opBNB,
  143: monad,
};

const chainId = Number(process.env.CHAIN_ID);
const chain = CHAIN_MAP[chainId];
if (!chain) {
  const supported = Object.keys(CHAIN_MAP).join(", ");
  throw new Error(
    `Unsupported CHAIN_ID: ${chainId}. Supported chain IDs: ${supported}`,
  );
}

const WALLET = process.env.WALLET;
const POSITION_MANAGER = NFT_POSITION_MANAGER_ADDRESSES[chainId];

const client = createPublicClient({ chain, transport: http(process.env.RPC) });

const balance = await client.readContract({
  address: POSITION_MANAGER,
  abi: nonfungiblePositionManagerABI,
  functionName: "balanceOf",
  args: [WALLET],
});

const tokenIdResults = await client.multicall({
  contracts: Array.from({ length: Number(balance) }, (_, i) => ({
    address: POSITION_MANAGER,
    abi: nonfungiblePositionManagerABI,
    functionName: "tokenOfOwnerByIndex",
    args: [WALLET, BigInt(i)],
  })),
});
const tokenIds = tokenIdResults
  .filter((r) => r.status === "success")
  .map((r) => r.result);

const posResults = await client.multicall({
  contracts: tokenIds.map((id) => ({
    address: POSITION_MANAGER,
    abi: nonfungiblePositionManagerABI,
    functionName: "positions",
    args: [id],
  })),
});

const MAX_UINT128 = 2n ** 128n - 1n;
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 5);

async function mapWithConcurrency(items, limit, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    results.push(...(await Promise.all(items.slice(i, i + limit).map(fn))));
    // Delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return results;
}

const collectResults = await mapWithConcurrency(tokenIds, CONCURRENCY, (id) =>
  client
    .simulateContract({
      address: POSITION_MANAGER,
      abi: nonfungiblePositionManagerABI,
      functionName: "collect",
      args: [
        {
          tokenId: id,
          recipient: WALLET,
          amount0Max: MAX_UINT128,
          amount1Max: MAX_UINT128,
        },
      ],
      account: WALLET,
    })
    .then((r) => [r.result[0].toString(), r.result[1].toString()]),
);

const positions = posResults
  .filter((r) => r.status === "success")
  .map((r, i) => {
    const p = r.result;

    // Differs from tokensOwed via position result
    const [tokensOwed0, tokensOwed1] = collectResults[i];

    return {
      tokenId: tokenIds[i].toString(),
      token0: p[2],
      token1: p[3],
      fee: p[4],
      tokensOwed0,
      tokensOwed1,
      tickLower: p[5],
      tickUpper: p[6],
      liquidity: p[7].toString(),
    };
  });

console.log(JSON.stringify(positions));
