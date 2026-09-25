/**
 * The evidence: who touched a token, which pairs moved within a few blocks
 * of each other across the whole memory, and who shares a funder.
 */

export /** Wallets that touched this token, from observed activity and bundles. */
function walletsOn(db, token) {
  const rows = db.prepare(
    `SELECT wallet_address AS w FROM wallet_activity WHERE token_address = ?
     UNION
     SELECT wallet_address AS w FROM wallet_bundles WHERE token_address = ?`,
  ).all(token, token);
  return rows.map((r) => r.w);
}

export /**
 * Count, for every pair in `wallets`, how many tokens they both bought
 * (or both sold) within `windowBlocks` of each other — across the whole
 * memory, not just this token. That is what turns a coincidence into a
 * pattern.
 */
function coMovement(db, wallets, windowBlocks) {
  const pairs = new Map();
  if (wallets.length < 2) return pairs;
  const ph = wallets.map(() => "?").join(",");
  const rows = db.prepare(
    `SELECT wallet_address AS w, token_address AS t, side, block_number AS b
       FROM wallet_activity
      WHERE wallet_address IN (${ph}) AND block_number IS NOT NULL
        AND side IN ('buy', 'sell')
     UNION
     SELECT wallet_address, token_address, 'buy', block_number
       FROM wallet_bundles
      WHERE wallet_address IN (${ph}) AND block_number IS NOT NULL`,
  ).all(...wallets, ...wallets);

  const groups = new Map();          // token|side -> [{w, b}]
  for (const r of rows) {
    const k = `${r.t}|${r.side}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }

  for (const [k, list] of groups) {
    const side = k.split("|")[1];
    list.sort((a, b) => a.b - b.b);
    const counted = new Set();       // one count per pair per token
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length && list[j].b - list[i].b <= windowBlocks; j++) {
        const a = list[i].w, b = list[j].w;
        if (a === b) continue;
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (counted.has(key)) continue;
        counted.add(key);
        if (!pairs.has(key)) pairs.set(key, { buys: 0, sells: 0, funder: null });
        pairs.get(key)[side === "buy" ? "buys" : "sells"] += 1;
      }
    }
  }
  return pairs;
}

export function sharedFunders(db, wallets, pairs) {
  if (wallets.length < 2) return;
  const ph = wallets.map(() => "?").join(",");
  const rows = db.prepare(
    `SELECT wallet_address AS w, funder_address AS f
       FROM wallet_funding WHERE wallet_address IN (${ph})`,
  ).all(...wallets);
  const byFunder = new Map();
  for (const { w, f } of rows) {
    if (!byFunder.has(f)) byFunder.set(f, []);
    byFunder.get(f).push(w);
  }
  for (const [f, ws] of byFunder) {
    for (let i = 0; i < ws.length; i++) {
      for (let j = i + 1; j < ws.length; j++) {
        const [a, b] = ws[i] < ws[j] ? [ws[i], ws[j]] : [ws[j], ws[i]];
        const key = `${a}|${b}`;
        if (!pairs.has(key)) pairs.set(key, { buys: 0, sells: 0, funder: null });
        pairs.get(key).funder = f;
      }
    }
  }
}
