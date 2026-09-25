# Structure

Where everything lives, and why it is split the way it is.

## Source

```
src/
├── ai/                                 optional Grok opinion
│   └── grok.js
├── api/                                HTTP and WebSocket: the scan pipeline, monitors, routes
│   ├── routes/                         one file per group of endpoints
│   │   ├── elephant.js
│   │   ├── health.js
│   │   ├── index.js
│   │   ├── memory.js
│   │   ├── monitor.js
│   │   └── scan.js
│   ├── monitors.js
│   ├── pipeline.js
│   ├── server.js
│   └── ws.js
├── chains/                             one folder per chain: the scanner and the live monitor
│   ├── base/
│   │   ├── monitor.js
│   │   └── scanner.js
│   ├── evm/                            what Base and Robinhood share: ERC-20 reads, bundle detection
│   │   ├── bundle.js
│   │   ├── erc20.js
│   │   └── index.js
│   ├── robinhood/
│   │   ├── monitor.js
│   │   └── scanner.js
│   └── solana/
│       ├── monitor.js
│       ├── rugcheck.js
│       └── scanner.js
├── config/                             chain addresses and the scoring table, one file per chain
│   ├── base.js
│   ├── index.js
│   ├── robinhood.js
│   ├── scoring.js
│   └── solana.js
├── jobs/                               the follow-up loop and its price source
│   ├── followup.job.js
│   └── price.source.js
├── memory/                             the SQLite store: connection, lookups, writes
│   ├── migrations/                     every schema change, one file per version
│   │   ├── 001-baseline.js
│   │   ├── 002-followup-scheduling.js
│   │   ├── 003-outcome-history.js
│   │   ├── 004-wallet-linkage.js
│   │   ├── 005-elephantbrain.js
│   │   ├── helpers.js
│   │   └── index.js
│   ├── db.js
│   ├── index.js
│   ├── lookup.js
│   ├── migrate.js
│   └── record.js
├── modules/                            the four memory modules
│   ├── deployer-memory/                launch history, age, related addresses
│   │   ├── history.js
│   │   ├── index.js
│   │   └── pattern.js
│   ├── herd-map/                       wallets that move together, clusters, 3D layout
│   │   ├── clusters.js
│   │   ├── comovement.js
│   │   ├── index.js
│   │   ├── layout.js
│   │   └── weights.js
│   ├── low-frequency/                  large moves, flows, liquidity leaving
│   │   ├── classify.js
│   │   ├── index.js
│   │   ├── store.js
│   │   └── thresholds.js
│   └── matriarch/                      how experienced a wallet is
│       ├── bands.js
│       └── index.js
├── scoring/                            the six checks, the sum, the verdict bands
│   ├── checks.js
│   ├── index.js
│   ├── score.js
│   └── verdict.js
├── sniper/                             swap execution — off by default, real money
│   ├── jupiter.js
│   └── uniswap.js
├── terminal/                           inspect(contract), ingestion, terminal formatting
│   ├── format.js
│   ├── index.js
│   ├── ingest.js
│   └── inspect.js
├── utils/                              logger, address helpers
│   ├── address.js
│   └── logger.js
└── index.js                            starts memory, the follow-up loop, monitors and the API
```

Two rules shaped the split:

- **One reason to change per file.** The score's arithmetic, its verdict
  bands and each check's partial-credit rule live apart, so changing one
  does not mean reading the others.
- **Shared code lives once.** Base and Robinhood read tokens and detect
  bundles identically, so that code sits in `chains/evm/` rather than in
  each scanner. Every scan — from the API or a live monitor — goes through
  `api/pipeline.js`, so the sequence of scoring, recording and learning
  exists in one place.

## Tests

```
tests/
├── ai/
│   └── grok.test.js
├── api/
│   └── routes.test.js
├── chains/
│   ├── evm-bundle.test.js
│   └── scanner.test.js
├── helpers/
│   └── memory.js
├── memory/
│   └── memory.test.js
├── modules/
│   ├── deployer-memory.test.js
│   ├── herd-map.test.js
│   ├── low-frequency.test.js
│   └── matriarch.test.js
├── scoring/
│   ├── score.test.js
│   └── verdict.test.js
├── terminal/
│   ├── format.test.js
│   ├── ingest.test.js
│   └── inspect.test.js
└── utils/
    └── address.test.js
```

Every file under `tests/<area>/` runs with `npm test`. Each file gets its
own throwaway database from `tests/helpers/memory.js`.

## Everything else

```
scripts/     the npm run commands
examples/    a demo, curl calls, real JSON output
docs/        documentation; docs/modules/ has one page per memory module
assets/      the images in the README and docs
client/      the React + Vite dashboard
data/        your memory database (not committed)
```
