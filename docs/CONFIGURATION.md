# Configuration

Everything is read from the environment; `.env.example` has every variable
with comments. Nothing is required to start — the public RPCs work for
manual scans, and memory creates itself.

## Chains

| variable | default | for |
|:--|:--|:--|
| `SOLANA_RPC_URL` | public mainnet | scanning |
| `SOLANA_WS_URL` | — | the live Pump.fun monitor |
| `ROBINHOOD_RPC_URL` | public, chain 4663 | scanning and the Pons V2 monitor |
| `ROBINHOOD_WS_URL` | falls back to the RPC | the monitor |
| `BASE_RPC_URL` | public, chain 8453 | scanning and the Clanker monitor |
| `BASE_WS_URL` | falls back to the RPC | the monitor |

Public endpoints are rate-limited. For live monitoring use a paid RPC.

## Memory

| variable | default | |
|:--|:--|:--|
| `EB_MEMORY_PATH` | `data/memory.db` | where the SQLite file lives |
| `EB_FOLLOWUP` | on | set `off` to stop the follow-up loop |
| `EB_FOLLOWUP_MINUTES` | 30 | minutes between follow-up passes |
| `EB_PRICE_SOURCE` | `dexscreener` | or `none` for no network calls |

With the follow-up loop off, no token's fate is ever recorded, deployer
reputation stays neutral, and the modules have nothing to learn from.

## Alerts

| variable | default | |
|:--|:--|:--|
| `EB_LARGE_MOVE_USD` | 25000 | one trade above this is a large move |
| `EB_FLOW_USD` | 15000 | net flow in an hour that counts as accumulation or distribution |

A large move also triggers at 5% of the pool when liquidity is known,
whichever is lower.

## Optional services

| variable | |
|:--|:--|
| `RUGCHECK_API_KEY` | adds RugCheck to Solana scans |
| `XAI_API_KEY`, `XAI_MODEL` | adds a Grok opinion to scans — see [GROK.md](GROK.md) |

## Sniper

Off by default. `SNIPER_ENABLED=true` spends real money; read
[SECURITY.md](../SECURITY.md) first. Keys and limits are in `.env.example`.

## Server

| variable | default |
|:--|:--|
| `PORT` | 3001 |
| `LOG_LEVEL` | `info` |
