# Changelog

## [0.4.0] — ELEPHANTBRAIN

The memory layer grows into four modules, built on one principle: remember
who is who, across time, even when the context changes.

### Added — ELEPHANTBRAIN (`src/modules/`)
- **Deployer Memory** — launch history behind a token, address age, and
  related addresses (funder, shared funder, early-buyer crew, deployers
  drawing the same crew), each with a confidence and the reason. Independent
  evidence for the same address combines instead of the first reason winning.
- **Herd Map** — wallets that buy or sell within two blocks of each other
  across tokens, or share a funder; clustered, with deterministic 3D
  positions for the dashboard. A pair counts once per token.
- **Low-Frequency Alerts** — large moves (scaled to pool size when liquidity
  is known), accumulation, distribution, liquidity leaving. Cooldown per
  kind, wallet and token; broadcast on the WebSocket as `elephantAlert`.
- **Matriarch Score** — wallet experience from age, breadth, how its past
  picks turned out, and first-block buys into tokens that died. Reports its
  own confidence; flagged wallets are capped.
- `inspect(contract)` and `npm run elephant` — the terminal: paste an
  address, see what the market forgets.
- API: `GET /api/elephant/:chain/:address`, `/api/elephant/wallet/:address`,
  `/api/elephant/alerts`; `POST /api/elephant/activity`, `/api/elephant/funding`.
- Every scan now feeds early buyers into memory, so the modules learn from
  ordinary use.
- Schema v5: `wallet_activity`, `wallet_funding`, `alerts`,
  `chain_first_tx_at` on wallets and deployers.
- `docs/ELEPHANTBRAIN.md` — the four modules, the science behind them, the
  gaps, the sources.

### Changed
- **One name.** The project, the package, the repository and the Docker
  service are all ELEPHANTBRAIN now.
- **Environment variables** for memory, the follow-up loop, the price source
  and alerts start with `EB_`: `EB_MEMORY_PATH`, `EB_FOLLOWUP`,
  `EB_FOLLOWUP_MINUTES`, `EB_PRICE_SOURCE`, `EB_LARGE_MOVE_USD`,
  `EB_FLOW_USD`. Rename them in your `.env`.
- **Source reorganised by responsibility** — see `docs/STRUCTURE.md`:
  `chains/<chain>/` holds each scanner with its monitor; `chains/evm/` holds
  what Base and Robinhood share (their bundle detection was two identical
  copies); `scoring/` splits the checks, the sum and the verdict bands;
  `config/` has one file per chain; each migration is its own file; each
  memory module is a folder; the API is a scan pipeline plus one file per
  group of routes, where the same scan-score-record sequence used to be
  written out five times.
- Tests live in one folder per area with a shared temp-database helper.
- New visuals throughout the README and docs; the old GIFs, banners and
  mascot images are removed.

### Added — documentation and examples
- `docs/modules/` — one page per memory module
- `docs/API.md`, `docs/CONFIGURATION.md`, `docs/STRUCTURE.md`
- `npm run demo` (`examples/seed-demo.js`) — a small scenario in its own
  database, printed as a report
- `examples/*.json` — real output of every module; `examples/feed-activity.sh`
- 25 more tests: bundle detection against a fake provider, verdict bands and
  check rules, terminal formatting, and the HTTP API end to end — including
  the route-order case. 92 in total.

### Fixed
- **CI could never pass.** The workflow used `npm ci` and the npm cache, both
  of which need a `package-lock.json` the repository never had. It now runs
  `npm install`, on Node 20 and 22.
- **`npm run lint` did nothing but fail.** ESLint 9 ignores `.eslintrc.json`;
  the same rules are now in `eslint.config.js`, and lint covers the tests.
- **Stopping the server left SQLite and the follow-up loop running.** Only
  Ctrl+C was handled, and it closed neither. `docker compose down` sends
  SIGTERM, which was not handled at all. Both now stop the loop and close
  the database cleanly.
- **EVM scans ended in an error on every token.** `ethers` v6 returns
  `decimals()` as a BigInt and `10 ** decimals` throws. The fix from 0.2
  never reached this branch; it is back.
- **The bundle block was the chain head.** `detectEvmBundles` recorded
  `currentBlock` — the block at scan time — as the block the bundle happened
  in, so every token looked like it launched "now". It now records the block
  the buys actually landed in, which Herd Map depends on.
- **Auto-scanned tokens never got a verdict.** The monitor callbacks called
  `recordVerdict(req.params.address, …)` where no `req` exists; the
  `ReferenceError` was swallowed by an empty `catch`. They now use the token
  from the monitor event.


## [0.3.0]

### Added — the feedback loop
- **`src/jobs/followup.job.js`** — goes back at 24h / 72h / 7d and
  records what actually happened to a token. Without this nothing ever
  called `updateTokenStatus()`, so `tokens_rugged` never incremented and
  deployer reputation stayed flat forever. The Second Brain could not learn.
- `src/jobs/price.source.js` — thin price/liquidity adapter
  (DexScreener by default, `EB_PRICE_SOURCE=none` to go offline)
- `scripts/followup.js` — `npm run followup`, `--dry-run`, `--watch`
- the loop starts with the server unless `EB_FOLLOWUP=off`

### Added — schema migrations
- **`src/memory/migrate.js`** — versioned, transactional, recorded in
  `schema_migrations`. The database is meant to live for months; deleting it
  to change a column was not an option.
- `scripts/memory-migrate.js` — `npm run memory:migrate -- --status`
- migrations run automatically on boot
- new tables: `token_observations` (the trajectory, not just the final flag),
  `wallet_deployers` (shared-crew edges)
- new columns: `tokens.last_checked_at`, `tokens.check_count`

### Added — everything else
- `tests/memory.test.js` — 33 tests covering lookup, record, enrich,
  migrations and the follow-up classifier
- `docs/MEMORY.md` — how the subsystem works and where it is weak
- `Dockerfile`, `docker-compose.yml`, `.dockerignore` — multi-stage so the
  native toolchain stays out of the runtime image
- `SECURITY.md`, `.github/ISSUE_TEMPLATE/`

### Fixed
- **`npm test` never ran.** `node --test tests/` resolves the directory as a
  module on Node 22 and exits. Now globs the test files.
- **Every existing test was broken.** They imported `assert` from `node:test`,
  which does not export it, so all 8 would have failed the moment the runner
  worked. Now imported from `node:assert/strict`.
- **Final verdicts were never stored.** Scanners record a token before the
  weights run, so `tokens.verdict` stayed `null` and deployer history read as
  blanks. Added `recordVerdict()` and wired it into the API routes.
- **`EB_MEMORY_PATH` was read at import time**, so setting it from code
  silently wrote to the default path. Now resolved lazily in `memoryPath()`.
- **Memory reasons misattributed the cause.** A neutral lookup ("new deployer,
  no history") was listed beside adjustments it had nothing to do with.
  `enrichScan()` now separates `reasons` from `notes`.


## [0.2.0] — 2026-09-15

### Added — **Second Brain**
- **ELEPHANTBRAIN Memory** — local SQLite-backed intelligence layer that persists across scans
- Every scan now enriches the score with historical context (deployers, wallets, bundles)
- Deployer reputation tracking: rug rate, alive tokens, first/last seen
- Wallet flags: `smart_money`, `known_rugger`, bundle appearances
- Token lifecycle recording: launched at, verdict, current status (live/rugged/abandoned)
- Score adjustment range: **±25** on top of the 6 base checks
- `npm run memory:stats` — top ruggers, smart-money wallets, tracked totals
- `npm run memory:flag` — manually flag a wallet
- Scanners now capture `deployer` and `buyers[]` fields for memory enrichment
- Bundle detection now records participating wallets to memory
- New env var: `EB_MEMORY_PATH` (default: `data/memory.db`)

### Changed
- `solana.scanner.js`, `robinhood.scanner.js`, `base.scanner.js` now integrate Memory
- Scan results include `memory: { adjustment, reasons, deployer, wallets }`
- Bundle detection returns `{ detected, wallets, blockNumber }` (was `boolean`)

### Dependencies
- Added `better-sqlite3` (^11.3.0) — the only new runtime dependency

## [0.1.0] — 2026-09-12

### Added
- Token scanner for Solana (Pump.fun), Robinhood Chain (Pons V2), and Base (Clanker)
- Safety score engine with 6 weighted checks (mint authority, freeze authority, holder concentration, bundle detection, LP status, metadata)
- Live monitoring via WebSocket for all 3 chains
- React dashboard with manual scan and live feed tabs
- Chain selector (Solana / Robinhood / Base) in UI
- Grok AI integration for risk analysis (optional, via xAI API)
- RugCheck API integration for enhanced Solana scanning
- Jupiter sniper module for Solana (disabled by default)
- Uniswap V4 sniper stub for Robinhood Chain
- Full project documentation and README
- $LAPTOP case study with real data

### Known limitations
- Bundle detection is simplified (slot count, not full funder graph)
- LP burn check is a stub for Raydium pools
- Robinhood Chain scanner checks known addresses only (no full holder enumeration)
- Uniswap V4 sniper not fully implemented (Pons V2 hooks need custom integration)
