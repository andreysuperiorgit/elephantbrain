/**
 * ELEPHANTBRAIN · Matriarch Score
 *
 * McComb (2001): older matriarchs tell familiar calls from strangers more
 * reliably, because they have heard more of them. This is the wallet
 * version — a single number for how much a wallet has seen, and how its
 * past choices turned out.
 *
 * It is designed to draw your attention, not to replace your judgment.
 */

import { getDb } from "../../memory/db.js";
import { lc } from "../../utils/address.js";
import { WEIGHTS, band } from "./bands.js";

export { band };

const DAY = 86_400_000;

/**
 * @returns {{wallet, score, band, confidence, components, reasons}}
 */
export function matriarchScore(address) {
  const db = getDb();
  const w = lc(address);
  const row = db.prepare("SELECT * FROM wallets WHERE address = ?").get(w);

  // what this wallet touched, from observed buys and bundle membership
  const touched = db.prepare(
    `SELECT DISTINCT x.t AS token, t.current_status AS status
       FROM (SELECT token_address AS t FROM wallet_activity
              WHERE wallet_address = ? AND side = 'buy'
             UNION
             SELECT token_address FROM wallet_bundles WHERE wallet_address = ?) x
       LEFT JOIN tokens t ON t.address = x.t`,
  ).all(w, w);

  const firstAct = db.prepare(
    "SELECT MIN(observed_at) AS t FROM wallet_activity WHERE wallet_address = ?").get(w)?.t;
  const firstSeen = row?.chain_first_tx_at || Math.min(
    ...[row?.first_seen, firstAct].filter((x) => Number.isFinite(x)), Infinity);
  const ageDays = Number.isFinite(firstSeen) ? (Date.now() - firstSeen) / DAY : 0;
  const ageSource = row?.chain_first_tx_at ? "chain" : "observed";

  const breadth = touched.length;
  const settled = touched.filter((t) => ["alive", "rugged", "abandoned"].includes(t.status));
  const alive = settled.filter((t) => t.status === "alive").length;
  const dead = settled.length - alive;

  // how often this wallet sat in the first block of something that died
  const bundleDead = db.prepare(
    `SELECT COUNT(*) AS c FROM wallet_bundles b JOIN tokens t ON t.address = b.token_address
      WHERE b.wallet_address = ? AND t.current_status IN ('rugged', 'abandoned')`,
  ).get(w).c;

  const flagged = Boolean(row?.known_rugger);
  const smart = Boolean(row?.smart_money);

  const comp = {
    age: Math.min(1, ageDays / 180),
    breadth: Math.min(1, Math.log1p(breadth) / Math.log1p(40)),
    // too few settled outcomes to judge is neutral, not good or bad
    survival: settled.length >= 3 ? alive / settled.length : 0.5,
    conduct: flagged ? 0
      : Math.max(0, Math.min(1, 1 - bundleDead / Math.max(3, breadth) + (smart ? 0.2 : 0))),
  };

  let score = 0;
  for (const k of Object.keys(WEIGHTS)) score += WEIGHTS[k] * comp[k];
  if (flagged) score = Math.min(score, 15);
  score = Math.round(Math.max(0, Math.min(100, score)));

  const reasons = [];
  reasons.push(`${Math.round(ageDays)} days ${ageSource === "chain" ? "on chain" : "in memory"}`);
  reasons.push(`${breadth} token${breadth === 1 ? "" : "s"} touched`);
  if (settled.length >= 3) reasons.push(`${alive} of ${settled.length} settled tokens survived`);
  else reasons.push("too few settled outcomes to judge survival");
  if (bundleDead) reasons.push(`first-block buyer on ${bundleDead} token(s) that died`);
  if (flagged) reasons.push("flagged as a known rugger");
  if (smart) reasons.push("flagged as smart money");

  const thin = breadth < 3 && ageDays < 7;

  return {
    wallet: w,
    score,
    band: band(score, flagged),
    confidence: thin ? "thin record" : settled.length >= 5 ? "solid" : "partial",
    components: Object.fromEntries(Object.entries(comp).map(([k, v]) =>
      [k, { value: Number(v.toFixed(3)), weight: WEIGHTS[k], points: Number((v * WEIGHTS[k]).toFixed(1)) }])),
    counts: { tokens: breadth, settled: settled.length, alive, dead, bundleDead },
    ageDays: Number(ageDays.toFixed(1)),
    ageSource,
    reasons,
  };
}
