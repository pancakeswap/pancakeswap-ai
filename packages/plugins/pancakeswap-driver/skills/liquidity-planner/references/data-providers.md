# Data Providers Reference

This guide documents the data sources and APIs used by the liquidity-planner skill to gather pool information, yields, and liquidity metrics across PancakeSwap.

## DexScreener API

DexScreener provides real-time pool discovery and detailed trading pair information across multiple DEXs and chains.

### Filtering PancakeSwap Pools

DexScreener aggregates data from multiple DEXs. To filter for PancakeSwap pools only, use:

```bash
jq 'select(.dexId == "pancakeswap")'
```

### Supported Networks

PancakeSwap operates across multiple networks via DexScreener:

| Network  | DexScreener ID | Primary Use                 |
| -------- | -------------- | --------------------------- |
| BSC      | `bsc`          | Main liquidity, lowest fees |
| Ethereum | `ethereum`     | Cross-chain assets          |
| Arbitrum | `arbitrum`     | Layer 2 scaling             |
| Base     | `base`         | Coinbase ecosystem          |
| zkSync   | `zksync`       | Low-cost transactions       |
| Linea    | `linea`        | Ethereum compatibility      |
| opBNB    | `opbnb`        | BSC Layer 2                 |

### Pool Discovery by Token Address

To find all PancakeSwap pools containing a specific token:

```bash
curl -s "https://api.dexscreener.com/latest/dex/tokens/{tokenAddress}" | \
  jq '.pairs[] | select(.dexId == "pancakeswap")'
```

**Example: USDT pools on BSC**

```bash
curl -s "https://api.dexscreener.com/latest/dex/tokens/0x55d398326f99059ff775485246999027b3197955" | \
  jq '.pairs[] | select(.dexId == "pancakeswap") | {pairAddress, tokenA: .baseToken.symbol, tokenB: .quoteToken.symbol, volume24h, liquidity}'
```

### Pool Search by Name

To find pools by token name or symbol:

```bash
curl -s "https://api.dexscreener.com/latest/dex/search?q={searchQuery}" | \
  jq '.pairs[] | select(.dexId == "pancakeswap")'
```

**Example: Search for CAKE/BUSD**

```bash
curl -s "https://api.dexscreener.com/latest/dex/search?q=CAKE%20BUSD" | \
  jq '.pairs[] | select(.dexId == "pancakeswap" and .chainId == "bsc") | {pairAddress, priceUsd, liquidity, volume24h}'
```

### Pool Detail by Pair Address

To retrieve detailed information for a specific pair:

```bash
curl -s "https://api.dexscreener.com/latest/dex/pairs/{chainId}/{pairAddress}" | \
  jq '.pairs[0]'
```

**Example: Get details for CAKE/WBNB pool**

```bash
curl -s "https://api.dexscreener.com/latest/dex/pairs/bsc/0x0ed7e52944161450261c02fcc3d6855decdbda83" | \
  jq '.pairs[0] | {pairAddress, version: (if .labels | contains("v3") then "V3" elif .labels | contains("v2") then "V2" else "StableSwap" end), liquidity, volume24h, priceNative, priceUsd}'
```

### Response Field Reference

| Field         | Type   | Description                                              |
| ------------- | ------ | -------------------------------------------------------- |
| `pairAddress` | string | Smart contract address of the pool                       |
| `dexId`       | string | DEX identifier (always "pancakeswap" for this guide)     |
| `chainId`     | string | Blockchain network identifier                            |
| `baseToken`   | object | Primary token in the pair                                |
| `quoteToken`  | object | Secondary token in the pair                              |
| `priceNative` | string | Price in native blockchain currency                      |
| `priceUsd`    | string | Price in USD (when available)                            |
| `liquidity`   | string | Total liquidity in USD                                   |
| `volume24h`   | string | 24-hour trading volume in USD                            |
| `txns`        | object | Transaction count (buys, sells, total) over time periods |
| `labels`      | array  | Pool metadata ("v2", "v3", "verified", etc.)             |

### Important Notes on StableSwap Pools

DexScreener treats PancakeSwap StableSwap pools specially:

- **Labeling**: Some StableSwap pools appear with `dexId == "pancakeswap-stableswap"` instead of `"pancakeswap"`
- **Discovery**: To find all StableSwap pools, filter for both:

  ```bash
  jq '.pairs[] | select(.dexId == "pancakeswap" or .dexId == "pancakeswap-stableswap")'
  ```

- **Version identifier**: Not explicitly shown in `labels` for StableSwap (unlike "v2"/"v3")
- **Recommendation**: Cross-reference with DefiLlama or PancakeSwap API to confirm pool type

---

## PancakeSwap Explorer API

The PancakeSwap Explorer API (`explorer.pancakeswap.com`) provides first-party pool data including TVL, 24h volume, fee APR, and protocol classification. It is the primary source for pool discovery in the liquidity planner — more accurate and lower-latency than third-party aggregators.

### Endpoints

#### Pair endpoint (AND — both tokens known)

Returns pools that contain **both** specified tokens:

```
GET https://explorer.pancakeswap.com/api/cached/pools/list/pair/{token0Address}/{token1Address}?chains={chain}&protocols={protocols}&orderBy=tvlUSD
```

#### List endpoint (OR — zero or one token known)

Returns pools containing **any** of the specified tokens:

```
GET https://explorer.pancakeswap.com/api/cached/pools/list?chains={chain}&protocols={protocols}&orderBy=tvlUSD&tokens={chainId}:{address}
```

Repeat `tokens` parameter for each known token (via `--data-urlencode` with `-G` in curl).

### Token Format

Tokens are specified as `{chainId}:{tokenAddress}` (e.g., `56:0xABC...` for BSC USDT). For native tokens (BNB, ETH), omit the tokens filter and filter results by symbol.

### Chain Identifiers

| Chain          | `chains` value  | Numeric Chain ID |
| -------------- | --------------- | ---------------- |
| BSC            | `bsc`           | `56`             |
| BSC Testnet    | `bsc-testnet`   | `97`             |
| Ethereum       | `ethereum`      | `1`              |
| Base           | `base`          | `8453`           |
| opBNB          | `opbnb`         | `204`            |
| zkSync Era     | `zksync`        | `324`            |
| Polygon zkEVM  | `polygon-zkevm` | `1101`           |
| Linea          | `linea`         | `59144`          |
| Arbitrum       | `arbitrum`      | `42161`          |
| Solana         | `sol`           | —                |
| Monad          | `monad`         | `143`            |

### Protocol Values

| `protocols` value | Pool Type                       |
| ----------------- | ------------------------------- |
| `v2`              | PancakeSwap V2                  |
| `v3`              | PancakeSwap V3                  |
| `infinityCl`      | Infinity Concentrated Liquidity |
| `infinityBin`     | Infinity Bin pool               |
| `infinityStable`  | Infinity StableSwap             |
| `stable`          | StableSwap                      |

### Response Field Reference

| Field          | Type   | Description                                                                     |
| -------------- | ------ | ------------------------------------------------------------------------------- |
| `id`           | string | Pool contract address                                                           |
| `chainId`      | number | Numeric chain ID                                                                |
| `protocol`     | string | Pool type (`v2`, `v3`, `infinityCl`, `infinityBin`, `infinityStable`, `stable`) |
| `feeTier`      | number | Fee tier in basis points (e.g., `2500` = 0.25%)                                 |
| `tvlUSD`       | number | Total Value Locked in USD                                                       |
| `volumeUSD24h` | number | 24-hour trading volume in USD                                                   |
| `apr24h`       | number | Fee APR as a decimal (e.g., `0.2166` = 21.66%) — multiply by 100 for percentage |
| `token0`       | object | First token metadata (`symbol`, `address`, `decimals`)                          |
| `token1`       | object | Second token metadata (`symbol`, `address`, `decimals`)                         |

### `feeTier` to Human-Readable Mapping

| `feeTier` value | Human-readable |
| --------------- | -------------- |
| `100`           | `0.01%`        |
| `500`           | `0.05%`        |
| `2500`          | `0.25%`        |
| `10000`         | `1.0%`         |

### Important Notes

- **`apr24h` is a decimal**: Always multiply by 100 before displaying as a percentage.
- **Fee APR only**: `apr24h` covers swap fees only (24h annualized). CAKE farming rewards are not included — use DefiLlama for full reward APY breakdown when requested.
- **Fallback**: If the Explorer API returns no results (e.g., brand-new pool), fall back to DexScreener.

---

## DefiLlama Yields API

DefiLlama aggregates yield farming data across DeFi protocols. Use it to find APY/APR information for PancakeSwap positions.

### Project Identifiers

PancakeSwap projects are identified by version:

| Version    | Project ID               | Supported Chains                                           |
| ---------- | ------------------------ | ---------------------------------------------------------- |
| V3         | `pancakeswap-amm-v3`     | BSC, Ethereum, Arbitrum, Base, zkSync, Linea, opBNB, Monad |
| V2         | `pancakeswap-amm`        | BSC, Ethereum, Arbitrum, Base, opBNB                       |
| StableSwap | `pancakeswap-stableswap` | BSC only                                                   |

### Chain Identifiers in DefiLlama

| Network  | DefiLlama Name |
| -------- | -------------- |
| BSC      | `BSC`          |
| Ethereum | `Ethereum`     |
| Arbitrum | `Arbitrum`     |
| Base     | `Base`         |
| zkSync   | `zkSync`       |
| Linea    | `Linea`        |
| opBNB    | `opBNB`        |

### Fetching APY Data

```bash
curl -s "https://yields.llama.fi/pools" | \
  jq '.data[] | select(.project == "pancakeswap-amm-v3" and .chain == "BSC")'
```

**Example: Find top CAKE/WBNB yield pools on BSC**

```bash
curl -s "https://yields.llama.fi/pools" | \
  jq '.data[] |
    select(.project == "pancakeswap-amm-v3" and .chain == "BSC") |
    select((.symbol | contains("CAKE")) and (.symbol | contains("WBNB"))) |
    {symbol, apy, tvlUsd, poolMeta}'
```

### Response Field Reference

| Field          | Type   | Description                              |
| -------------- | ------ | ---------------------------------------- |
| `pool`         | string | Unique pool identifier                   |
| `project`      | string | Protocol name (pancakeswap-amm-v3, etc.) |
| `chain`        | string | Blockchain network                       |
| `symbol`       | string | Token pair symbol (e.g., "CAKE-WBNB")    |
| `tvlUsd`       | number | Total Value Locked in USD                |
| `apy`          | number | Annual Percentage Yield (percentage)     |
| `apyBase`      | number | Base APY from swap fees                  |
| `apyReward`    | number | Additional reward APY (if any)           |
| `rewardTokens` | array  | Tokens used for rewards                  |
| `poolMeta`     | string | Additional metadata (fee tier, etc.)     |

### Coverage Limitations

- **Lag time**: DefiLlama updates may lag 5-15 minutes behind real-time conditions
- **StableSwap**: Limited coverage; some StableSwap pools may not be indexed
- **New pools**: Newly created pools may take time to appear in results
- **Fee information**: Not always provided; V3 pools may need separate lookup for fee tier

---

## PancakeSwap Token List API

Use the official PancakeSwap token list as a fallback when DexScreener lacks token information or for token metadata validation.

### Endpoint

```
https://tokens.pancakeswap.finance/pancakeswap-extended.json
```

### Token List Structure

The endpoint returns a JSON object with token arrays organized by chain. Each token includes metadata useful for position setup.

### Finding a Token by Symbol

```bash
curl -s "https://tokens.pancakeswap.finance/pancakeswap-extended.json" | \
  jq '.tokens[] | select(.symbol == "CAKE")'
```

**Example: Find USDT on multiple chains**

```bash
curl -s "https://tokens.pancakeswap.finance/pancakeswap-extended.json" | \
  jq '.tokens[] | select(.symbol == "USDT") | {chainId, address, name, decimals}'
```

### Token Object Fields

| Field      | Type   | Description                                       |
| ---------- | ------ | ------------------------------------------------- |
| `chainId`  | number | Blockchain network (56 = BSC, 1 = Ethereum, etc.) |
| `address`  | string | Token contract address                            |
| `name`     | string | Full token name                                   |
| `symbol`   | string | Token ticker symbol                               |
| `decimals` | number | Number of decimal places                          |
| `logoURI`  | string | URL to token icon (optional)                      |

### When to Use This API

- **Token validation**: Confirm token addresses before creating positions
- **Decimals lookup**: Get correct decimal places for calculations
- **Metadata filling**: Retrieve token names and logos for UI display
- **Fallback**: When DexScreener doesn't return token information

---

## Recommended Workflow

Follow this sequence to gather complete pool and position data:

### Step 1: Discover Pools and Assess Metrics

Use the PancakeSwap Explorer API to find candidate pools — it returns TVL, volume, APR, and protocol in a single call:

```bash
# Both tokens known: pair endpoint
curl -s "https://explorer.pancakeswap.com/api/cached/pools/list/pair/{token0}/{token1}?chains={chain}&protocols=v2&protocols=v3&protocols=stable&protocols=infinityCl&protocols=infinityBin&protocols=infinityStable&orderBy=tvlUSD"

# One token known: list endpoint
curl -s -G "https://explorer.pancakeswap.com/api/cached/pools/list" \
  --data-urlencode "chains={chain}" \
  --data-urlencode "protocols=stable" \
  --data-urlencode "protocols=v2" \
  --data-urlencode "protocols=v3" \
  --data-urlencode "protocols=infinityCl" \
  --data-urlencode "protocols=infinityBin" \
  --data-urlencode "protocols=infinityStable" \
  --data-urlencode "orderBy=tvlUSD" \
  --data-urlencode "tokens={chainId}:{tokenAddress}"
```

**Output available directly**:

- Pool address (`id`)
- Protocol and fee tier
- TVL in USD (`tvlUSD`)
- 24h volume (`volumeUSD24h`)
- Fee APR as decimal (`apr24h` × 100 = percentage)

If the Explorer API returns no results, fall back to DexScreener (see DexScreener section above).

### Step 2: Check Farming Rewards (Optional)

If the user asks for a detailed CAKE reward APY breakdown, query DefiLlama:

```bash
curl -s "https://yields.llama.fi/pools" | \
  jq '.data[] | select(.pool == "{pairAddress}")'
```

**Output needed**:

- APY (base + rewards)
- TVL in USD
- Pool metadata (fee tier for V3)

### Step 3: Assess Liquidity Depth

Evaluate if liquidity is sufficient for your position size:

| TVL (USD)    | Assessment                              | Risk Level     |
| ------------ | --------------------------------------- | -------------- |
| > $10M       | Deep, excellent for large positions     | Low            |
| $1M - $10M   | Moderate-to-good depth                  | Low to Medium  |
| $100K - $1M  | Moderate, suitable for medium positions | Medium         |
| $10K - $100K | Shallow, large positions cause slippage | Medium to High |
| < $10K       | Very shallow, high slippage risk        | High           |

### Step 4: Calculate Price Range (for V3)

Use the collected price data to determine appropriate tick ranges:

```python
import math

# Current price and target range (e.g., ±10%)
current_price = float(price_usd)
range_percent = 0.10  # 10% buffer
lower_bound = current_price * (1 - range_percent)
upper_bound = current_price * (1 + range_percent)

# V3 uses ticks with basis points spacing
# Tick formula: log_1.0001(price) for 1 basis point ticks
tick_lower = math.floor(math.log(lower_bound) / math.log(1.0001))
tick_upper = math.ceil(math.log(upper_bound) / math.log(1.0001))

print(f"Tick range: {tick_lower} to {tick_upper}")
print(f"Price range: ${lower_bound:.4f} to ${upper_bound:.4f}")
```

### Error Handling

| Error                    | Cause                                    | Resolution                                              |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------- |
| Explorer returns no rows | Pool too new or not yet indexed          | Fall back to DexScreener pair/token search              |
| Pool not found           | DexScreener doesn't index this pool yet  | Try token search instead; verify pair address manually  |
| No APY data              | Pool too new or not tracked by DefiLlama | Use `apr24h` from Explorer API; estimate from volume    |
| Stale price              | API lag or low volume                    | Cross-check with multiple sources; add buffer to ranges |
| Token not found          | Token list outdated or not supported     | Verify token address on blockchain explorer             |
| Network mismatch         | Querying wrong chainId for pool          | Check pool address format; confirm network in dexId     |

---

## Rate Limits & Best Practices

- **DexScreener**: 2 requests/second (generous for research)
- **DefiLlama**: 10 requests/second (no API key required)
- **PancakeSwap Token List**: No stated limit; cache locally when possible
- **Caching**: Store results for 5-15 minutes to reduce unnecessary requests
- **Error handling**: Implement exponential backoff for failed requests
