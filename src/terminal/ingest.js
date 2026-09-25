/**
 * ELEPHANTBRAIN — what gets written down.
 *
 * Every module reads from the same three tables: wallet_activity (who
 * bought or sold what, and in which block), wallet_funding (who sent the
 * first money to whom), and alerts. This file is the only place that
 * writes the first two.
 */

import { getDb } from "../memory/db.js";
import { lc } from "../utils/address.js";

const SIDES = new Set(["buy", "sell", "add_lp", "remove_lp"]);


/**
 * Record one observed movement. Returns the new row id, or null if it was
 * already known. A movement is unique on (wallet, token, side, block), or
 * on the moment it was observed when the source gives no block.
 */
export function recordActivity({ wallet, token, chain, side, block = null,
                                 amountUsd = null, observedAt = Date.now() }) {
  if (!wallet || !token || !chain) throw new Error("wallet, token and chain are required");
  if (!SIDES.has(side)) throw new Error(`side must be one of ${[...SIDES].join(", ")}`);
  const info = getDb().prepare(
    `INSERT OR IGNORE INTO wallet_activity
       (wallet_address, token_address, chain, side, block_number, observed_at, amount_usd)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(lc(wallet), lc(token), chain, side, block, observedAt, amountUsd);
  return info.changes > 0 ? Number(info.lastInsertRowid) : null;
}

/**
 * Record that `funder` sent the first money to `wallet`.
 * `source` says how we know — "manual", a provider name, etc. — so a
 * link typed in by hand is never mistaken for one read off the chain.
 */
export function recordFunding(wallet, funder, chain, { amountUsd = null, source = "manual" } = {}) {
  if (!wallet || !funder || !chain) throw new Error("wallet, funder and chain are required");
  if (lc(wallet) === lc(funder)) return false;
  const info = getDb().prepare(
    `INSERT OR IGNORE INTO wallet_funding
       (wallet_address, funder_address, chain, first_seen, amount_usd, source)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(lc(wallet), lc(funder), chain, Date.now(), amountUsd, source);
  return info.changes > 0;
}

/**
 * Turn a finished scan into activity rows: every early buyer the scanner
 * saw becomes a "buy" in the bundle block. This is what lets ELEPHANTBRAIN
 * learn from ordinary use, without a separate feed.
 */
export function ingestScan(tokenAddress, chain, checks) {
  const buyers = Array.isArray(checks?.buyers) ? checks.buyers : [];
  const block = Number.isFinite(checks?.bundleBlock) ? checks.bundleBlock : null;
  const seen = getDb().prepare(
    `SELECT 1 FROM wallet_activity
      WHERE wallet_address = ? AND token_address = ? AND side = 'buy' LIMIT 1`,
  );
  let added = 0;
  for (const w of buyers) {
    // a re-scan sees the same early buyers again; that is not a new buy
    if (seen.get(lc(w), lc(tokenAddress))) continue;
    if (recordActivity({ wallet: w, token: tokenAddress, chain, side: "buy", block })) added++;
  }
  return added;
}
