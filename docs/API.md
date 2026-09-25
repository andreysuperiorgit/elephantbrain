# API

The server listens on `PORT` (default 3001). Every response is JSON.
Live events go out on the WebSocket at `/ws`.

## Scanning

```
GET /api/scan/solana/:address
GET /api/scan/robinhood/:address
GET /api/scan/base/:address
```

Runs the six checks, applies memory's adjustment, writes the verdict back,
and feeds the early buyers into memory. Adds `rugcheck` on Solana when
`RUGCHECK_API_KEY` is set, and `grok` when `XAI_API_KEY` is set.

```jsonc
{
  "chain": "base",
  "baseScore": 78,
  "memoryAdjustment": -18,
  "memoryReasons": ["serial rugger: 3/3 tokens died"],
  "score": 60,
  "verdict": "CAUTION",
  "breakdown": { "mintAuthority": 20, "freezeAuthority": 15, "…": "…" },
  "bundleBlock": 21020000,
  "buyers": ["0x…", "0x…"]
}
```

## The four memory modules

```
GET  /api/elephant/:chain/:address
```

Everything memory knows about one contract: `deployer`, `herd`, `alerts`,
`matriarch`, and a `summary` to read first. **404** with `known: false` if
memory has not seen the contract — it never reports an unseen token as
clean. Full example: [`examples/inspect-report.json`](../examples/inspect-report.json).

```
GET  /api/elephant/wallet/:address
```

One wallet's Matriarch Score with its four components, band, confidence
and reasons. Example: [`examples/matriarch-score.json`](../examples/matriarch-score.json).

```
GET  /api/elephant/alerts?token=0x…&limit=25
```

Recent low-frequency alerts, newest first; all tokens if `token` is left out.
`limit` is capped at 200.

```
POST /api/elephant/activity
{ "wallet", "token", "chain", "side", "block", "amountUsd", "liquidityUsd" }
```

Record a movement from any source. `side` is `buy`, `sell`, `add_lp` or
`remove_lp`. `liquidityUsd` is optional and lets thresholds scale to the
pool. Returns the alerts it raised; each is also broadcast as
`elephantAlert`. **400** on a malformed movement.

```
POST /api/elephant/funding
{ "wallet", "funder", "chain", "amountUsd", "source" }
```

Record who sent a wallet its first money. `source` is stored so a link typed
in by hand is never mistaken for one read off the chain. Returns
`{ "added": false }` for a link already known.

## Memory

```
GET /api/memory/stats                 tokens seen, deployers tracked, wallets flagged
GET /api/memory/deployer/:address     one deployer's row and last 50 tokens
GET /api/memory/wallet/:address       one wallet's row
```

## Monitors

```
POST /api/monitor/start   { "chain": "solana" | "robinhood" | "base" }
POST /api/monitor/stop    { "chain": … }
GET  /api/monitor/status
```

## WebSocket events

| type | when |
|:--|:--|
| `newLaunch` | a monitor saw a new token |
| `scanResult` | an automatic scan finished (Robinhood, Base) |
| `monitorStatus` | a monitor reported a change in its status |
| `elephantAlert` | a fed movement raised a low-frequency alert |

## Health

```
GET /api/health   { "status": "ok", "uptime": 12.3 }
```
