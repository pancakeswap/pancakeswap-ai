// protocol-fee.mjs
// Fetch the protocol fee for a PancakeSwap Infinity (v4) pool via getSlot0 on the pool manager.
//
// Environment variables:
//   CHAIN_ID    — numeric chain ID (required). Supported: 56 (BSC), 8453 (Base)
//   RPC         — JSON-RPC endpoint URL (required)
//   POOL_ID     — pool ID as a bytes32 hex string (0x + 64 hex chars) (required)

import {
  BinPoolManagerAbi,
  CLPoolManagerAbi,
  INFI_BIN_POOL_MANAGER_ADDRESSES,
  INFI_CL_POOL_MANAGER_ADDRESSES,
} from '@pancakeswap/infinity-sdk'
import { createPublicClient, http } from 'viem'
import { base, bsc } from 'viem/chains'

// ─── Chain config ─────────────────────────────────────────────────────────────

const CHAIN_MAP = {
  56: bsc,
  8453: base,
}

const chainId = Number(process.env.CHAIN_ID)
const chain = CHAIN_MAP[chainId]
if (!chain) {
  const supported = Object.keys(CHAIN_MAP).join(', ')
  throw new Error(`Unsupported CHAIN_ID: ${chainId}. Supported chain IDs: ${supported}`)
}

const RPC = process.env.RPC
if (!RPC) throw new Error('RPC is required')

// ─── Pool ID ──────────────────────────────────────────────────────────────────

const POOL_ID = process.env.POOL_ID
if (!/^0x[0-9a-fA-F]{64}$/.test(POOL_ID)) {
  throw new Error(`POOL_ID must be a 32-byte hex string (0x + 64 hex chars), got: ${POOL_ID}`)
}

const FEE_BASE = 10_000
function parseProtocolFee(packed) {
  const token0ProtocolFee = packed % 2 ** 12
  // eslint-disable-next-line no-bitwise
  const token1ProtocolFee = packed >> 12

  return [token0ProtocolFee / FEE_BASE, token1ProtocolFee / FEE_BASE]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const client = createPublicClient({ chain, transport: http(RPC) })

const [clResult, binResult] = await client.multicall({
  contracts: [
    {
      address: INFI_CL_POOL_MANAGER_ADDRESSES[chainId],
      abi: CLPoolManagerAbi,
      functionName: 'getSlot0',
      args: [POOL_ID],
    },
    {
      address: INFI_BIN_POOL_MANAGER_ADDRESSES[chainId],
      abi: BinPoolManagerAbi,
      functionName: 'getSlot0',
      args: [POOL_ID],
    },
  ],
})

if (clResult.status === 'success' && clResult.result[0] !== 0n) {
  console.log(
    JSON.stringify({
      protocolFeePercent: `${parseProtocolFee(clResult.result[2])[0]}%`,
      poolType: 'cl',
    }),
  )
} else if (binResult.status === 'success' && binResult.result[0] !== 0n) {
  console.log(
    JSON.stringify({
      protocolFeePercent: `${parseProtocolFee(binResult.result[1])[0]}%`,
      poolType: 'bin',
    }),
  )
}
