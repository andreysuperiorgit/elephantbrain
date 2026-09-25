/**
 * ELEPHANTBRAIN · Deployer Memory
 *
 * An elephant that hears a rumble matches it to a stored identity. This
 * does the same with an address: the launch history behind it, how long
 * it has been around, and the other addresses it keeps company with.
 *
 * Every link carries a confidence and the reason for it. Connection
 * between addresses is probabilistic, not forensic.
 */

import { getDb } from "../../memory/db.js";
import { lc } from "../../utils/address.js";
import { CAVEAT, pattern } from "./pattern.js";
import { launchesOf, earlyBuyers } from "./history.js";

export { CAVEAT };

const DAY = 86_400_000;

/**
 * Everything memory knows about the address behind a token.
 * @returns {object} deployer, launches, age, related[], pattern, caveat
 */
export function traceDeployer(address, chain = null) {
  const db = getDb();
  const dep = lc(address);
  if (!dep) {
    return { address: null, known: false, launches: [], related: [],
             pattern: "no deployer", caveat: CAVEAT };
  }

  const row = db.prepare("SELECT * FROM deployers WHERE address = ?").get(dep);
  const launches = launchesOf(db, dep);

  const total = launches.length;
  const rugged = launches.filter((l) => ["rugged", "abandoned"].includes(l.current_status)).length;
  const alive = launches.filter((l) => l.current_status === "alive").length;

  // age: on-chain first transaction if a provider supplied it, otherwise
  // the first time this memory saw the address — and we say which
  const firstChain = row?.chain_first_tx_at || null;
  const firstSeen = firstChain || row?.first_seen || launches[0]?.launched_at || null;
  const age = firstSeen
    ? { days: Math.max(0, (Date.now() - firstSeen) / DAY),
        source: firstChain ? "chain" : "observed" }
    : null;

  // An address can be linked in more than one way — a crew wallet that is
  // also paid by the same funder. Keeping only the first reason would hide
  // the stronger one, so independent evidence is combined instead:
  // 1 - (1-a)(1-b), capped below certainty.
  const byAddr = new Map();
  const push = (addr, confidence, reason, kind) => {
    const a = lc(addr);
    if (!a || a === dep) return;
    const cur = byAddr.get(a);
    if (!cur) {
      byAddr.set(a, { address: a, kind, kinds: [kind], confidence, reasons: [reason] });
      return;
    }
    cur.confidence = Math.min(0.95, 1 - (1 - cur.confidence) * (1 - confidence));
    if (!cur.kinds.includes(kind)) cur.kinds.push(kind);
    cur.reasons.push(reason);
    if (confidence > (cur.top || 0)) { cur.kind = kind; cur.top = confidence; }
  };

  // 1. who funded this deployer, and whom it funded
  const fundedBy = db.prepare(
    "SELECT funder_address AS a, source FROM wallet_funding WHERE wallet_address = ?").all(dep);
  for (const f of fundedBy) push(f.a, 0.8, `funded this deployer (${f.source})`, "funder");
  const funded = db.prepare(
    "SELECT wallet_address AS a, source FROM wallet_funding WHERE funder_address = ?").all(dep);
  for (const f of funded) push(f.a, 0.8, `received funds from this deployer (${f.source})`, "funded");

  // 2. siblings: other wallets paid by the same funder
  for (const f of fundedBy) {
    const sibs = db.prepare(
      "SELECT wallet_address AS a FROM wallet_funding WHERE funder_address = ? AND wallet_address != ?",
    ).all(f.a, dep);
    for (const s of sibs) push(s.a, 0.6, `shares a funder (${f.a.slice(0, 10)}…)`, "sibling");
  }

  // 3. the crew: wallets buying early on two or more of its launches
  const tokenAddrs = launches.map((l) => l.address);
  const buyers = earlyBuyers(db, tokenAddrs);
  for (const [w, toks] of buyers) {
    if (toks.size >= 2) {
      const c = Math.min(0.8, 0.35 + 0.15 * (toks.size - 2));
      push(w, c, `early buyer on ${toks.size} of its ${total} launches`, "crew");
    }
  }

  // 4. other deployers whose launches drew the same crew
  const crew = [...buyers.entries()].filter(([, t]) => t.size >= 1).map(([w]) => w);
  if (crew.length) {
    const ph = crew.map(() => "?").join(",");
    const others = db.prepare(
      `SELECT t.deployer AS d, COUNT(DISTINCT x.w) AS shared
         FROM (SELECT wallet_address AS w, token_address AS tok FROM wallet_bundles
                WHERE wallet_address IN (${ph})
               UNION
               SELECT wallet_address, token_address FROM wallet_activity
                WHERE side = 'buy' AND wallet_address IN (${ph})) x
         JOIN tokens t ON t.address = x.tok
        WHERE t.deployer IS NOT NULL AND t.deployer != ?
        GROUP BY t.deployer
       HAVING shared >= 2
        ORDER BY shared DESC LIMIT 10`,
    ).all(...crew, ...crew, dep);
    for (const o of others) {
      const c = Math.min(0.75, 0.3 + 0.08 * o.shared);
      push(o.d, c, `${o.shared} of the same early buyers on its launches`, "deployer");
    }
  }

  const related = [...byAddr.values()].map((r) => ({
    address: r.address,
    kind: r.kind,
    kinds: r.kinds,
    confidence: Number(r.confidence.toFixed(2)),
    reason: r.reasons.join("; "),
  })).sort((a, b) => b.confidence - a.confidence);

  return {
    address: dep,
    chain: row?.chain || chain,
    known: Boolean(row) || total > 0,
    age,
    launches: launches.map((l) => ({
      token: l.address, chain: l.chain, launchedAt: l.launched_at,
      verdict: l.verdict, score: l.first_score, status: l.current_status,
    })),
    counts: { total, rugged, alive, live: total - rugged - alive },
    reputation: row?.reputation ?? null,
    pattern: pattern(total, rugged, alive),
    related,
    caveat: CAVEAT,
  };
}
