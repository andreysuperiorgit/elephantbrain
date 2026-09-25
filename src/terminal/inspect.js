/**
 * inspect(contract) — the four modules brought together for one token,
 * plus the few lines a person reads first.
 */

import { getDb } from "../memory/db.js";
import { lc } from "../utils/address.js";
import { traceDeployer } from "../modules/deployer-memory/index.js";
import { buildHerd } from "../modules/herd-map/index.js";
import { recentAlerts } from "../modules/low-frequency/index.js";
import { matriarchScore } from "../modules/matriarch/index.js";

/**
 * Everything ELEPHANTBRAIN remembers about one contract.
 * A token the memory has never seen returns `known: false` rather than an
 * empty report dressed up as a clean one.
 */
export function inspect(contractAddress, { chain = null, matriarchs = 12 } = {}) {
  const db = getDb();
  const addr = lc(contractAddress);
  const token = db.prepare("SELECT * FROM tokens WHERE address = ?").get(addr);

  if (!token) {
    return {
      token: addr,
      known: false,
      hint: "Memory has not seen this contract. Scan it first " +
            "(GET /api/scan/<chain>/<address>), then inspect again.",
    };
  }

  const deployer = traceDeployer(token.deployer, token.chain);
  const herd = buildHerd({ token: addr });
  const alerts = recentAlerts({ token: addr, limit: 20 });

  // score the wallets around the token, most connected first
  const degree = new Map();
  for (const e of herd.edges) {
    degree.set(e.source, (degree.get(e.source) || 0) + e.weight);
    degree.set(e.target, (degree.get(e.target) || 0) + e.weight);
  }
  const ranked = herd.nodes.map((n) => n.id)
    .sort((a, b) => (degree.get(b) || 0) - (degree.get(a) || 0))
    .slice(0, matriarchs);
  const wallets = ranked.map(matriarchScore).sort((a, b) => b.score - a.score);
  const avg = wallets.length
    ? Math.round(wallets.reduce((s, x) => s + x.score, 0) / wallets.length) : null;

  // the few lines a person reads first
  const summary = [];
  const c = deployer.counts;
  if (!token.deployer) summary.push("Deployer unknown to memory.");
  else if (c.total <= 1) summary.push("Deployer has no earlier launches in memory.");
  else summary.push(`Deployer has ${c.total} launches in memory: ${c.rugged} died, ${c.alive} survived.`);
  const strong = deployer.related.filter((r) => r.confidence >= 0.6).length;
  if (strong) summary.push(`${strong} related address${strong === 1 ? "" : "es"} with confidence ≥ 0.6.`);
  if (herd.clusters.length) {
    const big = herd.clusters[0];
    summary.push(`Largest coordinated group: ${big.size} wallets` +
                 (big.flagged ? `, ${big.flagged} flagged.` : "."));
  }
  if (alerts.length) summary.push(`${alerts.length} low-frequency alert${alerts.length === 1 ? "" : "s"} on this token.`);
  if (avg !== null) summary.push(`Wallets around it average a Matriarch Score of ${avg}.`);

  return {
    token: addr,
    known: true,
    chain: token.chain,
    verdict: token.verdict,
    score: token.first_score,
    status: token.current_status,
    summary,
    deployer,
    herd,
    alerts,
    matriarch: { average: avg, wallets },
    notes: [
      ...(chain && token.chain && chain !== token.chain
        ? [`Memory recorded this token on ${token.chain}, not ${chain}.`] : []),
      "Does not predict prices.",
      "Does not guarantee safety.",
      "Links and clusters are probabilistic, not forensic.",
    ],
  };
}
