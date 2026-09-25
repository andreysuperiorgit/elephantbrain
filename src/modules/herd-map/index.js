/**
 * ELEPHANTBRAIN · Herd Map
 *
 * A matriarch knows who travels with whom. This finds wallets that move
 * together: buying in the same blocks on different tokens, selling in the
 * same blocks, or drawing their first money from the same source.
 *
 * Similar behaviour does not prove shared ownership. It raises a question
 * worth investigating, and every edge carries the evidence behind it.
 */

import { getDb } from "../../memory/db.js";
import { lc } from "../../utils/address.js";
import { W_SAME_BLOCK, W_FUNDER, CAVEAT } from "./weights.js";
import { walletsOn, coMovement, sharedFunders } from "./comovement.js";
import { clusters } from "./clusters.js";
import { layout } from "./layout.js";

export { CAVEAT };

/**
 * Build the herd around one token.
 * @param {object} o
 * @param {string} o.token        the contract to centre on
 * @param {number} [o.windowBlocks=2]  how close in blocks counts as "together"
 * @param {number} [o.minWeight=2]     edges lighter than this are dropped
 */
export function buildHerd({ token, windowBlocks = 2, minWeight = 2 } = {}) {
  const db = getDb();
  const t = lc(token);
  const wallets = walletsOn(db, t);

  const pairs = coMovement(db, wallets, windowBlocks);
  sharedFunders(db, wallets, pairs);

  const edges = [];
  for (const [key, ev] of pairs) {
    const weight = W_SAME_BLOCK * (ev.buys + ev.sells) + (ev.funder ? W_FUNDER : 0);
    if (weight < minWeight) continue;
    const [source, target] = key.split("|");
    const evidence = [];
    if (ev.buys) evidence.push(`bought within ${windowBlocks} blocks on ${ev.buys} token(s)`);
    if (ev.sells) evidence.push(`sold within ${windowBlocks} blocks on ${ev.sells} token(s)`);
    if (ev.funder) evidence.push(`same funder ${ev.funder.slice(0, 10)}…`);
    edges.push({ source, target, weight, evidence });
  }
  edges.sort((a, b) => b.weight - a.weight);

  const groups = clusters(wallets, edges);

  const flagged = new Set();
  if (wallets.length) {
    const ph = wallets.map(() => "?").join(",");
    for (const r of db.prepare(
      `SELECT address FROM wallets WHERE known_rugger = 1 AND address IN (${ph})`,
    ).all(...wallets)) flagged.add(r.address);
  }

  const pos = layout(wallets, groups);
  const clusterOf = new Map();
  groups.forEach((g, gi) => g.forEach((w) => clusterOf.set(w, gi)));

  return {
    token: t,
    nodes: wallets.map((w) => ({
      id: w,
      cluster: clusterOf.has(w) ? clusterOf.get(w) : null,
      flagged: flagged.has(w),
      ...pos[w],
    })),
    edges,
    clusters: groups.map((g, gi) => ({
      id: gi,
      size: g.length,
      members: g,
      flagged: g.filter((w) => flagged.has(w)).length,
    })),
    params: { windowBlocks, minWeight },
    caveat: CAVEAT,
  };
}
