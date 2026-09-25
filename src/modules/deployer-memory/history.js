/** What memory holds about one deployer's launches and their early buyers. */

export function launchesOf(db, deployer) {
  return db.prepare(
    `SELECT address, chain, launched_at, first_score, verdict,
            current_status, died_at
       FROM tokens WHERE deployer = ? ORDER BY launched_at ASC`,
  ).all(deployer);
}

export /** Early buyers across a set of tokens, from bundles and observed buys. */
function earlyBuyers(db, tokens) {
  if (tokens.length === 0) return new Map();
  const ph = tokens.map(() => "?").join(",");
  const rows = db.prepare(
    `SELECT wallet_address AS w, token_address AS t FROM wallet_bundles
      WHERE token_address IN (${ph})
     UNION
     SELECT wallet_address AS w, token_address AS t FROM wallet_activity
      WHERE side = 'buy' AND token_address IN (${ph})`,
  ).all(...tokens, ...tokens);
  const byWallet = new Map();
  for (const { w, t } of rows) {
    if (!byWallet.has(w)) byWallet.set(w, new Set());
    byWallet.get(w).add(t);
  }
  return byWallet;
}
