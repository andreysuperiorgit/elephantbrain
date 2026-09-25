/**
 * What one movement means, given the wallet's recent history on the same
 * token. Pure: no database, so it can be tested and reused.
 */

import { DEFAULTS } from "./thresholds.js";

/**
 * Decide what one movement means, given the wallet's recent history on
 * the same token. Pure: no database, so it can be tested and reused.
 *
 * @param {object} a         the movement: side, amountUsd, observedAt
 * @param {object[]} history earlier movements by the same wallet on the same token
 * @param {object} [ctx]     { liquidityUsd }
 * @returns {{kind: string, amountUsd: number, detail: string}[]}
 */
export function classify(a, history = [], ctx = {}, opts = DEFAULTS) {
  const out = [];
  const amt = Number(a.amountUsd) || 0;
  const liq = Number(ctx.liquidityUsd) || null;

  // 1. one large move
  if (a.side === "buy" || a.side === "sell") {
    const threshold = liq
      ? Math.min(opts.largeMoveUsd, liq * opts.largeMoveShareOfLiquidity)
      : opts.largeMoveUsd;
    if (amt >= threshold && amt > 0) {
      out.push({
        kind: "large_move",
        amountUsd: amt,
        detail: liq
          ? `${a.side} of $${Math.round(amt).toLocaleString("en-US")} — ${((amt / liq) * 100).toFixed(1)}% of liquidity`
          : `${a.side} of $${Math.round(amt).toLocaleString("en-US")}`,
      });
    }
  }

  // 2. accumulation / distribution: many smaller moves in one direction
  if (a.side === "buy" || a.side === "sell") {
    const since = (a.observedAt ?? Date.now()) - opts.flowWindowMs;
    const recent = history.filter((h) => (h.observedAt ?? 0) >= since
                                         && (h.side === "buy" || h.side === "sell"));
    const all = [...recent, a];
    let net = 0, same = 0;
    for (const h of all) {
      const v = Number(h.amountUsd) || 0;
      net += h.side === "buy" ? v : -v;
      if (h.side === a.side) same++;
    }
    if (same >= opts.flowMinTrades) {
      if (a.side === "buy" && net >= opts.flowUsd) {
        out.push({ kind: "accumulation", amountUsd: net,
                   detail: `${same} buys, net +$${Math.round(net).toLocaleString("en-US")} within the hour` });
      } else if (a.side === "sell" && -net >= opts.flowUsd) {
        out.push({ kind: "distribution", amountUsd: -net,
                   detail: `${same} sells, net −$${Math.round(-net).toLocaleString("en-US")} within the hour` });
      }
    }
  }

  // 3. liquidity leaving the pool
  if (a.side === "remove_lp") {
    const share = liq ? amt / liq : null;
    if ((share !== null && share >= opts.liquidityShiftShare) || amt >= opts.largeMoveUsd) {
      out.push({
        kind: "liquidity_shift",
        amountUsd: amt,
        detail: share !== null
          ? `${(share * 100).toFixed(0)}% of liquidity removed`
          : `$${Math.round(amt).toLocaleString("en-US")} of liquidity removed`,
      });
    }
  }

  return out;
}
