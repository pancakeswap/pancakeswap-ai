# PancakeSwap Token Lists — Shared Reference

Tokens found in a **primary PancakeSwap token list** (any URL marked Primary below) are considered **PancakeSwap-whitelisted tokens** — no additional scam/rug-pull verification is required for these tokens. Tokens found only in secondary lists (CoinGecko, Ondo RWA, Optimism) are community-listed but not PancakeSwap-curated — apply normal diligence.

## Token List Absence — Red Flag

If a token is absent from **all** lists (primary and secondary) for its chain, this is a **red flag**. Warn the user explicitly and do not proceed without confirmation. Absence from all lists does not block the flow but requires surfacing a prominent warning before generating any deep link.

---

## Chain → Token List URLs

| Chain           | Chain ID | Primary URL                                                                                                      | Secondary URL(s)                                                                                                                                               |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BNB Smart Chain | 56       | `https://tokens.pancakeswap.finance/pancakeswap-extended.json`                                                   | `https://tokens.coingecko.com/binance-smart-chain/all.json`, `https://tokens.pancakeswap.finance/ondo-rwa-tokens.json`                                         |
| Ethereum        | 1        | `https://tokens.pancakeswap.finance/pancakeswap-eth-default.json`                                                | `https://tokens.coingecko.com/uniswap/all.json`, `https://tokens.pancakeswap.finance/ondo-rwa-tokens.json`                                                     |
| zkSync Era      | 324      | `https://tokens.pancakeswap.finance/pancakeswap-zksync-default.json`                                             | —                                                                                                                                                              |
| Linea           | 59144    | `https://tokens.pancakeswap.finance/pancakeswap-linea-default.json`                                              | `https://tokens.coingecko.com/linea/all.json`                                                                                                                  |
| Base            | 8453     | `https://tokens.pancakeswap.finance/pancakeswap-base-default.json`                                               | `https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json`, `https://tokens.coingecko.com/base/all.json` |
| Arbitrum One    | 42161    | `https://tokens.pancakeswap.finance/pancakeswap-arbitrum-default.json`                                           | `https://tokens.coingecko.com/arbitrum-one/all.json`                                                                                                           |
| Optimism        | 10       | `https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json` | —                                                                                                                                                              |
| opBNB           | 204      | `https://tokens.pancakeswap.finance/pancakeswap-opbnb-default.json`                                              | —                                                                                                                                                              |
| Monad Mainnet   | 143    | `https://tokens.pancakeswap.finance/pancakeswap-monad-default.json`                                              | —                                                                                                                                                              |
| Monad Testnet   | 10143    | `https://tokens.pancakeswap.finance/pancakeswap-monad-testnet-default.json`                                      | —                                                                                                                                                              |

---

## Token Resolution Algorithm

Try each list URL in order (primary first, then secondary). Stop as soon as the token is found. Fall back to on-chain RPC only if the token is not in any list.

```bash
TOKEN='0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82'
[[ "$TOKEN" =~ ^0x[0-9a-fA-F]{40}$ ]] || { echo "Invalid token address"; exit 1; }

# Token list URLs for this chain (ordered: try each in sequence)
# Example for BNB Smart Chain (chain ID 56):
TOKEN_LISTS=(
  "https://tokens.pancakeswap.finance/pancakeswap-extended.json"        # BSC primary
  "https://tokens.coingecko.com/binance-smart-chain/all.json"           # BSC secondary
  "https://tokens.pancakeswap.finance/ondo-rwa-tokens.json"             # RWA multi-chain
)

SYMBOL=""
DECIMALS=""
IS_WHITELISTED=false
for i in "${!TOKEN_LISTS[@]}"; do
  LIST_URL="${TOKEN_LISTS[$i]}"
  RESULT=$(curl -s "$LIST_URL" | \
    jq -r --arg addr "$TOKEN" \
      '.tokens[] | select(.address == $addr) | "\(.symbol)|\(.decimals)"' 2>/dev/null | head -1)
  if [[ -n "$RESULT" ]]; then
    SYMBOL="${RESULT%%|*}"
    DECIMALS="${RESULT##*|}"
    # Primary list is index 0 — tokens found there are PancakeSwap-whitelisted
    [[ "$i" == "0" ]] && IS_WHITELISTED=true
    break
  fi
done

# Fallback: on-chain RPC if not found in any list
if [[ -z "$SYMBOL" || -z "$DECIMALS" ]]; then
  SYMBOL=$(cast call "$TOKEN" "symbol()(string)"    --rpc-url "$RPC")
  DECIMALS=$(cast call "$TOKEN" "decimals()(uint8)" --rpc-url "$RPC")
fi
```

---

## Token List Schema

Token list JSON files follow the [Uniswap Token Lists standard](https://tokenlists.org/):

```json
{
  "name": "PancakeSwap Extended",
  "tokens": [
    {
      "chainId": 56,
      "address": "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
      "symbol": "CAKE",
      "decimals": 18,
      "name": "PancakeSwap Token",
      "logoURI": "https://tokens.pancakeswap.finance/images/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82.png"
    }
  ]
}
```

Key fields: `chainId`, `address`, `symbol`, `decimals`, `name`, `logoURI`.
