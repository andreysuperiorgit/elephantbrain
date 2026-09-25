# Architecture

## Overview

ELEPHANTBRAIN is a four-layer system: monitors detect new tokens, scanners read them, memory remembers what happened, and actors (score engine, Grok, sniper) decide what to do.

## Data flow

```
Blockchain RPCs
    ↓ WebSocket / polling
Monitors (solana, robinhood, base)
    ↓ emit "newToken"
Scanners (on-chain checks)
    ↓ raw check results
Memory (deployer, wallets, outcomes)
    ↓ adjustment ±25, early buyers learned
Score Engine (weighted 0–100)
    ↓ score + verdict
    ├── Grok AI (risk analysis)
    ├── Sniper (auto-buy if clean)
    └── WebSocket → Dashboard
```

## Modules

| Module | Path | Responsibility |
|:---|:---|:---|
| Monitors | `src/chains/<chain>/monitor.js` | Subscribe to chain events, emit new token detections |
| Scanners | `src/chains/<chain>/scanner.js` | On-chain checks per chain (mint, freeze, holders, bundles, LP) |
| EVM shared | `src/chains/evm/` | ERC-20 reads and bundle detection for Base and Robinhood |
| Scoring | `src/scoring/` | The six checks, the weighted sum, the verdict bands |
| Config | `src/config/` | Chain addresses and the scoring table |
| Memory | `src/memory/` | SQLite store and its versioned migrations |
| Memory modules | `src/modules/` | Deployer Memory, Herd Map, Low-Frequency Alerts, Matriarch Score |
| Terminal | `src/terminal/` | `inspect(contract)`, ingestion, terminal formatting |
| Follow-up | `src/jobs/` | Records what happened to each token at 24h / 72h / 7d |
| Grok | `src/ai/grok.js` | xAI API integration for risk analysis |
| Sniper | `src/sniper/` | Swap execution via Jupiter / Uniswap |
| API | `src/api/` | Scan pipeline, routes, WebSocket |
| Dashboard | `client/` | React frontend with Vite |

The full tree, and why it is split this way: [STRUCTURE.md](STRUCTURE.md).

## Chain specifics

### Solana
- Uses `logsSubscribe` on Pump.fun program `6EF8...`
- SPL token account parsing for mint/freeze authority
- `getTokenLargestAccounts` for holder concentration
- Signature analysis for bundle detection

### Robinhood Chain (EVM, chain 4663)
- `eth_subscribe` on Pons V2 factory `0x7ed5...`
- Contract bytecode scanning for dangerous functions
- `balanceOf` checks on known addresses

### Base (EVM, chain 8453)
- Monitors Uniswap V3 Factory for `PoolCreated` events
- Shares ERC-20 reads and bundle detection with Robinhood (`src/chains/evm/`)
