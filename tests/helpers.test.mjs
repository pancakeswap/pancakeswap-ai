/**
 * Unit tests for pancakeswap-ai helper logic.
 * Tests the pure functions described in the skill files.
 * Run with: node tests/helpers.test.mjs
 */

import assert from 'node:assert/strict'

// ─────────────────────────────────────────────
// Helpers copied from the skills (pure functions)
// ─────────────────────────────────────────────

const CHAIN_KEYS = {
  56: 'bsc',
  1: 'eth',
  42161: 'arb',
  8453: 'base',
  137: 'polygon',
  324: 'zksync',
  59144: 'linea',
  204: 'opbnb',
}

function buildPancakeSwapLink({
  chainId,
  inputCurrency,
  outputCurrency,
  exactAmount,
  exactField = 'input',
}) {
  const chain = CHAIN_KEYS[chainId]
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`)
  const query = new URLSearchParams({ chain, inputCurrency, outputCurrency })
  if (exactAmount) query.set('exactAmount', exactAmount)
  if (exactField) query.set('exactField', exactField)
  return `https://pancakeswap.finance/swap?${query.toString()}`
}

function applySlippage(amountOut, slippageBps) {
  // minimumAmountOut = amountOut * (10000 - slippageBps) / 10000
  return (BigInt(amountOut) * (10000n - BigInt(slippageBps))) / 10000n
}

function applySlippageIn(amountIn, slippageBps) {
  // maximumAmountIn = amountIn * (10000 + slippageBps) / 10000
  return (BigInt(amountIn) * (10000n + BigInt(slippageBps))) / 10000n
}

function isValidEvmAddress(addr) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr)
}

function isNativeSymbol(value) {
  return ['BNB', 'ETH', 'MATIC'].includes(value.toUpperCase())
}

// Known token addresses from the skill
const KNOWN_TOKENS = {
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
}

// ─────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✅ ${name}`)
    passed++
  } catch (err) {
    console.log(`  ❌ ${name}`)
    console.log(`     ${err.message}`)
    failed++
  }
}

// ─────────────────────────────────────────────
// SUITE 1: buildPancakeSwapLink
// ─────────────────────────────────────────────

console.log('\n📦 buildPancakeSwapLink')

test('BSC BNB → CAKE link has correct chain and currencies', () => {
  const url = buildPancakeSwapLink({
    chainId: 56,
    inputCurrency: 'BNB',
    outputCurrency: KNOWN_TOKENS.CAKE,
    exactAmount: '0.5',
    exactField: 'input',
  })
  assert.ok(url.includes('chain=bsc'), 'missing chain=bsc')
  assert.ok(url.includes('inputCurrency=BNB'), 'missing inputCurrency=BNB')
  assert.ok(url.includes('outputCurrency=0x0E09FaBB'), 'missing outputCurrency CAKE')
  assert.ok(url.includes('exactAmount=0.5'), 'missing exactAmount=0.5')
  assert.ok(url.includes('exactField=input'), 'missing exactField=input')
  assert.ok(url.startsWith('https://pancakeswap.finance/swap?'), 'wrong base URL')
})

test('Ethereum USDT → ETH link uses chain=eth', () => {
  const url = buildPancakeSwapLink({
    chainId: 1,
    inputCurrency: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    outputCurrency: 'ETH',
    exactAmount: '100',
  })
  assert.ok(url.includes('chain=eth'), 'missing chain=eth')
  assert.ok(url.includes('outputCurrency=ETH'), 'missing outputCurrency=ETH')
})

test('Arbitrum uses chain=arb', () => {
  const url = buildPancakeSwapLink({
    chainId: 42161,
    inputCurrency: 'ETH',
    outputCurrency: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  })
  assert.ok(url.includes('chain=arb'))
})

test('Base uses chain=base', () => {
  const url = buildPancakeSwapLink({
    chainId: 8453,
    inputCurrency: 'ETH',
    outputCurrency: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  })
  assert.ok(url.includes('chain=base'))
})

test('Polygon uses chain=polygon', () => {
  const url = buildPancakeSwapLink({
    chainId: 137,
    inputCurrency: 'MATIC',
    outputCurrency: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  })
  assert.ok(url.includes('chain=polygon'))
})

test('zkSync uses chain=zksync', () => {
  const url = buildPancakeSwapLink({
    chainId: 324,
    inputCurrency: 'ETH',
    outputCurrency: '0x1234567890123456789012345678901234567890',
  })
  assert.ok(url.includes('chain=zksync'))
})

test('opBNB uses chain=opbnb', () => {
  const url = buildPancakeSwapLink({
    chainId: 204,
    inputCurrency: 'BNB',
    outputCurrency: '0x1234567890123456789012345678901234567890',
  })
  assert.ok(url.includes('chain=opbnb'))
})

test('exactField defaults to input when not specified', () => {
  const url = buildPancakeSwapLink({
    chainId: 56,
    inputCurrency: 'BNB',
    outputCurrency: KNOWN_TOKENS.CAKE,
  })
  // exactField should not appear at all when no exactAmount is given
  assert.ok(
    !url.includes('exactField') || url.includes('exactField=input'),
    'unexpected exactField value',
  )
})

test('exact output swap sets exactField=output', () => {
  const url = buildPancakeSwapLink({
    chainId: 56,
    inputCurrency: KNOWN_TOKENS.CAKE,
    outputCurrency: KNOWN_TOKENS.USDT,
    exactAmount: '50',
    exactField: 'output',
  })
  assert.ok(url.includes('exactField=output'))
  assert.ok(url.includes('exactAmount=50'))
})

test('throws on unsupported chainId', () => {
  assert.throws(
    () => buildPancakeSwapLink({ chainId: 999, inputCurrency: 'ETH', outputCurrency: '0x1234' }),
    /Unsupported chainId: 999/,
  )
})

test('no exactAmount → URL omits exactAmount parameter', () => {
  const url = buildPancakeSwapLink({
    chainId: 56,
    inputCurrency: 'BNB',
    outputCurrency: KNOWN_TOKENS.CAKE,
  })
  assert.ok(!url.includes('exactAmount='), 'should not have exactAmount when not provided')
})

// ─────────────────────────────────────────────
// SUITE 2: Slippage calculations
// ─────────────────────────────────────────────

console.log('\n📦 Slippage calculations')

test('0.5% slippage on 1000 USDT output → minOut = 995', () => {
  const amountOut = 1000n * 10n ** 18n
  const minOut = applySlippage(amountOut, 50) // 50 bps = 0.5%
  const expected = 995n * 10n ** 18n
  assert.equal(minOut, expected)
})

test('1% slippage on 100 CAKE output → minOut = 99', () => {
  const amountOut = 100n * 10n ** 18n
  const minOut = applySlippage(amountOut, 100) // 100 bps = 1%
  const expected = 99n * 10n ** 18n
  assert.equal(minOut, expected)
})

test('0% slippage returns same amount', () => {
  const amount = 500n * 10n ** 18n
  assert.equal(applySlippage(amount, 0), amount)
})

test('0.5% slippage on exact-output: maxAmountIn 1 BNB → 1.005 BNB', () => {
  const amountIn = 10n ** 18n // 1 BNB
  const maxIn = applySlippageIn(amountIn, 50) // 50 bps = 0.5%
  const expected = 1005n * 10n ** 15n // 1.005 BNB
  assert.equal(maxIn, expected)
})

test('10% slippage (meme token) on 1000 output → minOut = 900', () => {
  const amountOut = 1000n * 10n ** 18n
  const minOut = applySlippage(amountOut, 1000) // 1000 bps = 10%
  const expected = 900n * 10n ** 18n
  assert.equal(minOut, expected)
})

// ─────────────────────────────────────────────
// SUITE 3: Address and currency validation
// ─────────────────────────────────────────────

console.log('\n📦 Address and currency validation')

test('all known BSC token addresses are valid EVM format', () => {
  for (const [symbol, addr] of Object.entries(KNOWN_TOKENS)) {
    assert.ok(isValidEvmAddress(addr), `${symbol} address is invalid: ${addr}`)
  }
})

test('all known addresses are checksummed (mixed case)', () => {
  // Checksummed addresses have mixed case in the hex portion
  for (const [symbol, addr] of Object.entries(KNOWN_TOKENS)) {
    const hex = addr.slice(2)
    const hasUpperAndLower = hex !== hex.toLowerCase() && hex !== hex.toUpperCase()
    assert.ok(hasUpperAndLower, `${symbol} address does not appear checksummed: ${addr}`)
  }
})

test('all known addresses are 42 chars (0x + 40 hex)', () => {
  for (const [symbol, addr] of Object.entries(KNOWN_TOKENS)) {
    assert.equal(addr.length, 42, `${symbol} address has wrong length: ${addr.length}`)
  }
})

test('native symbols are recognised', () => {
  assert.ok(isNativeSymbol('BNB'))
  assert.ok(isNativeSymbol('ETH'))
  assert.ok(isNativeSymbol('MATIC'))
})

test('token addresses are not treated as native', () => {
  assert.ok(!isNativeSymbol(KNOWN_TOKENS.CAKE))
  assert.ok(!isNativeSymbol('CAKE'))
})

test('zero address is valid format but should not be used as a token', () => {
  const zeroAddr = '0x0000000000000000000000000000000000000000'
  assert.ok(isValidEvmAddress(zeroAddr), 'zero address has valid format')
  // Skill should warn if this comes up as a token address
})

test('short address is rejected', () => {
  assert.ok(!isValidEvmAddress('0x1234'))
})

test('address without 0x prefix is rejected', () => {
  assert.ok(!isValidEvmAddress('bb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'))
})

// ─────────────────────────────────────────────
// SUITE 4: Chain key mapping (swap-planner)
// ─────────────────────────────────────────────

console.log('\n📦 Chain key mapping')

const DEXSCREENER_CHAIN_IDS = {
  56: 'bsc',
  1: 'ethereum',
  42161: 'arbitrum',
  8453: 'base',
  137: 'polygon',
  324: 'zksync',
  59144: 'linea',
}

test('BSC maps to dexscreener chainId "bsc"', () => assert.equal(DEXSCREENER_CHAIN_IDS[56], 'bsc'))
test('Ethereum maps to "ethereum"', () => assert.equal(DEXSCREENER_CHAIN_IDS[1], 'ethereum'))
test('Arbitrum maps to "arbitrum"', () => assert.equal(DEXSCREENER_CHAIN_IDS[42161], 'arbitrum'))
test('Base maps to "base"', () => assert.equal(DEXSCREENER_CHAIN_IDS[8453], 'base'))

test('PancakeSwap deep link chain key differs from DexScreener chainId for Ethereum', () => {
  // Important: DexScreener uses "ethereum", PancakeSwap URL uses "eth"
  assert.notEqual(DEXSCREENER_CHAIN_IDS[1], CHAIN_KEYS[1])
  assert.equal(CHAIN_KEYS[1], 'eth')
  assert.equal(DEXSCREENER_CHAIN_IDS[1], 'ethereum')
})

// ─────────────────────────────────────────────
// SUITE 5: V2 router fee math
// ─────────────────────────────────────────────

console.log('\n📦 V2 router fee (0.25% = 9975/10000)')

function v2GetAmountOut(amountIn, reserveIn, reserveOut) {
  // PancakeSwap V2 uses 0.25% fee: FEES_NUMERATOR=9975, FEES_DENOMINATOR=10000
  const amountInWithFee = amountIn * 9975n
  const numerator = amountInWithFee * reserveOut
  const denominator = reserveIn * 10000n + amountInWithFee
  return numerator / denominator
}

test('V2 getAmountOut formula produces correct result', () => {
  // 1 BNB in, reserves: 100 BNB / 30000 USDT → ~298.5 USDT out (after 0.25% fee)
  const amountIn = 10n ** 18n // 1 BNB
  const reserveIn = 100n * 10n ** 18n // 100 BNB
  const reserveOut = 30000n * 10n ** 18n // 30,000 USDT

  const amountOut = v2GetAmountOut(amountIn, reserveIn, reserveOut)
  const amountOutHuman = Number(amountOut) / 1e18

  // Should be ~297.xx USDT (slightly less than 300 due to price impact + fee)
  assert.ok(
    amountOutHuman > 290 && amountOutHuman < 300,
    `Expected ~297 USDT, got ${amountOutHuman.toFixed(4)}`,
  )
})

test('V2 fee is 0.25%, not 0.3% (Uniswap V2 uses 0.3%)', () => {
  // PancakeSwap V2 fee = 25 bps. Uniswap V2 = 30 bps.
  // With same reserves, PancakeSwap should give slightly more output.
  const amountIn = 10n ** 18n
  const reserveIn = 100n * 10n ** 18n
  const reserveOut = 100n * 10n ** 18n

  // PancakeSwap (9975/10000)
  const pcsOut = v2GetAmountOut(amountIn, reserveIn, reserveOut)

  // Uniswap (9970/10000)
  const uniOut = (amountIn * 9970n * reserveOut) / (reserveIn * 10000n + amountIn * 9970n)

  assert.ok(pcsOut > uniOut, 'PancakeSwap V2 should give more output than Uniswap V2 (lower fee)')
})

// ─────────────────────────────────────────────
// SUITE 6: buildPancakeSwapLiquidityLink
// ─────────────────────────────────────────────

console.log('\n📦 buildPancakeSwapLiquidityLink')

const LIQUIDITY_CHAIN_KEYS = {
  56: 'bsc',
  1: 'eth',
  42161: 'arb',
  8453: 'base',
  324: 'zksync',
  59144: 'linea',
  1101: 'polygonzkevm',
  204: 'opbnb',
  97: 'bsctest',
}

const FEE_TIER_MAP = {
  '0.01%': 100,
  '0.05%': 500,
  '0.25%': 2500,
  '1%': 10000,
}

function buildPancakeSwapLiquidityLink({ chainId, tokenA, tokenB, version, feeTier }) {
  const chain = LIQUIDITY_CHAIN_KEYS[chainId]
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`)

  if (version === 'v3') {
    const feeAmount = FEE_TIER_MAP[feeTier || '0.25%']
    if (!feeAmount) throw new Error(`Invalid fee tier: ${feeTier}`)
    return `https://pancakeswap.finance/add/${tokenA}/${tokenB}/${feeAmount}?chain=${chain}`
  }

  if (version === 'stableswap') {
    if (chainId !== 56) throw new Error('StableSwap only available on BSC')
    return `https://pancakeswap.finance/stable/add/${tokenA}/${tokenB}?chain=bsc`
  }

  // V2
  return `https://pancakeswap.finance/v2/add/${tokenA}/${tokenB}?chain=${chain}`
}

test('V3 CAKE/BNB on BSC with 0.25% fee', () => {
  const url = buildPancakeSwapLiquidityLink({
    chainId: 56,
    tokenA: KNOWN_TOKENS.CAKE,
    tokenB: 'BNB',
    version: 'v3',
    feeTier: '0.25%',
  })
  assert.ok(url.startsWith('https://pancakeswap.finance/add/'), 'missing /add/ path')
  assert.ok(!url.includes('/liquidity/add/v3/'), 'should NOT use /liquidity/add/v3/ path')
  assert.ok(url.includes('/2500?'), 'fee tier 2500 not in URL')
  assert.ok(url.includes('chain=bsc'), 'missing chain=bsc')
  assert.ok(url.includes(KNOWN_TOKENS.CAKE), 'missing CAKE address')
  assert.ok(url.includes('/BNB/'), 'missing BNB')
})

test('V3 USDC/ETH on Ethereum with 0.05% fee', () => {
  const url = buildPancakeSwapLiquidityLink({
    chainId: 1,
    tokenA: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenB: 'ETH',
    version: 'v3',
    feeTier: '0.05%',
  })
  assert.ok(url.includes('/500?'), 'fee tier 500 not in URL')
  assert.ok(url.includes('chain=eth'), 'missing chain=eth')
})

test('V3 defaults to 0.25% when feeTier omitted', () => {
  const url = buildPancakeSwapLiquidityLink({
    chainId: 56,
    tokenA: KNOWN_TOKENS.CAKE,
    tokenB: 'BNB',
    version: 'v3',
  })
  assert.ok(url.includes('/2500?'), 'should default to 2500 (0.25%)')
})

test('V3 0.01% fee tier for stablecoin pairs', () => {
  const url = buildPancakeSwapLiquidityLink({
    chainId: 56,
    tokenA: KNOWN_TOKENS.USDT,
    tokenB: KNOWN_TOKENS.USDC,
    version: 'v3',
    feeTier: '0.01%',
  })
  assert.ok(url.includes('/100?'), 'fee tier 100 not in URL')
})

test('V3 1% fee tier for volatile pairs', () => {
  const url = buildPancakeSwapLiquidityLink({
    chainId: 56,
    tokenA: KNOWN_TOKENS.CAKE,
    tokenB: '0x1234567890123456789012345678901234567890',
    version: 'v3',
    feeTier: '1%',
  })
  assert.ok(url.includes('/10000?'), 'fee tier 10000 not in URL')
})

test('V2 link uses /v2/add/ path', () => {
  const url = buildPancakeSwapLiquidityLink({
    chainId: 56,
    tokenA: KNOWN_TOKENS.CAKE,
    tokenB: 'BNB',
    version: 'v2',
  })
  assert.ok(
    url.startsWith('https://pancakeswap.finance/v2/add/'),
    'wrong base path — should use /v2/add/',
  )
  assert.ok(!url.includes('/v3/'), 'V2 should not have /v3/ in path')
  assert.ok(url.includes('chain=bsc'))
})

test('StableSwap link uses /stable/add/ path', () => {
  const url = buildPancakeSwapLiquidityLink({
    chainId: 56,
    tokenA: KNOWN_TOKENS.USDT,
    tokenB: KNOWN_TOKENS.USDC,
    version: 'stableswap',
  })
  assert.ok(
    url.startsWith('https://pancakeswap.finance/stable/add/'),
    'should use /stable/add/ path',
  )
  assert.ok(url.includes('chain=bsc'))
})

test('StableSwap throws on non-BSC chain', () => {
  assert.throws(
    () =>
      buildPancakeSwapLiquidityLink({
        chainId: 1,
        tokenA: KNOWN_TOKENS.USDT,
        tokenB: KNOWN_TOKENS.USDC,
        version: 'stableswap',
      }),
    /StableSwap only available on BSC/,
  )
})

test('V3 on Arbitrum uses chain=arb', () => {
  const url = buildPancakeSwapLiquidityLink({
    chainId: 42161,
    tokenA: 'ETH',
    tokenB: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    version: 'v3',
    feeTier: '0.05%',
  })
  assert.ok(url.includes('chain=arb'))
})

test('throws on unsupported chainId', () => {
  assert.throws(
    () =>
      buildPancakeSwapLiquidityLink({ chainId: 999, tokenA: 'ETH', tokenB: 'USDC', version: 'v3' }),
    /Unsupported chainId: 999/,
  )
})

test('throws on invalid fee tier', () => {
  assert.throws(
    () =>
      buildPancakeSwapLiquidityLink({
        chainId: 56,
        tokenA: 'BNB',
        tokenB: 'CAKE',
        version: 'v3',
        feeTier: '0.3%',
      }),
    /Invalid fee tier/,
  )
})

// ─────────────────────────────────────────────
// SUITE 7: Fee tier mapping
// ─────────────────────────────────────────────

console.log('\n📦 Fee tier mapping')

test('0.01% maps to 100 basis points', () => assert.equal(FEE_TIER_MAP['0.01%'], 100))
test('0.05% maps to 500 basis points', () => assert.equal(FEE_TIER_MAP['0.05%'], 500))
test('0.25% maps to 2500 basis points', () => assert.equal(FEE_TIER_MAP['0.25%'], 2500))
test('1% maps to 10000 basis points', () => assert.equal(FEE_TIER_MAP['1%'], 10000))

test('fee tier values are ordered ascending', () => {
  const values = Object.values(FEE_TIER_MAP).sort((a, b) => a - b)
  assert.deepEqual(values, [100, 500, 2500, 10000])
})

// ─────────────────────────────────────────────
// SUITE 8: Impermanent loss estimation
// ─────────────────────────────────────────────

console.log('\n📦 Impermanent loss calculations')

function estimateIL(priceChangeRatio) {
  const sqrtR = Math.sqrt(priceChangeRatio)
  return (2 * sqrtR) / (1 + priceChangeRatio) - 1
}

test('no price change → 0% IL', () => {
  const il = estimateIL(1.0)
  assert.ok(Math.abs(il) < 0.0001, `expected ~0%, got ${(il * 100).toFixed(4)}%`)
})

test('2x price increase → ~5.7% IL', () => {
  const il = estimateIL(2.0)
  assert.ok(Math.abs(il * 100 + 5.72) < 0.1, `expected ~-5.72%, got ${(il * 100).toFixed(2)}%`)
})

test('5x price increase → ~25% IL', () => {
  const il = estimateIL(5.0)
  assert.ok(il < -0.2 && il > -0.3, `expected ~-25%, got ${(il * 100).toFixed(2)}%`)
})

test('IL is always negative (loss) for any price change', () => {
  for (const r of [0.1, 0.5, 1.5, 2.0, 3.0, 5.0, 10.0]) {
    const il = estimateIL(r)
    assert.ok(il <= 0.0001, `IL should be non-positive at ratio ${r}, got ${il}`)
  }
})

// ─────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`)

if (failed > 0) {
  console.log('\n❌ Some tests failed — review skill content above.')
  process.exit(1)
} else {
  console.log('\n✅ All tests passed!')
}
