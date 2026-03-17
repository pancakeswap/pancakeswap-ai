// harvest-solana.mjs
// Discover PancakeSwap Solana farm positions and generate unsigned harvest instructions.
//
// Environment variables:
//   SOL_WALLET  — base58 Solana public key (required)

import { Farm } from '@pancakeswap/solana-core-sdk'
import { Connection, PublicKey } from '@solana/web3.js'

const walletPubkey = new PublicKey(process.env.SOL_WALLET)
const conn = new Connection('https://api.mainnet-beta.solana.com')
const farm = new Farm(conn)

// Fetch pending rewards and build unsigned harvest instructions
const result = await farm.harvestAllRewards({ owner: walletPubkey })

// Output serialized transaction instructions (base64) for the user to sign
const instructions = result.instructions ?? result
const serialized = Buffer.from(JSON.stringify(instructions)).toString('base64')
console.log(
  JSON.stringify({
    type: 'solana-harvest',
    wallet: walletPubkey.toBase58(),
    instructionsBase64: serialized,
    message: 'Sign these instructions with your Solana wallet to harvest rewards',
  }),
)
