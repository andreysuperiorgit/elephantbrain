/** Recording movements, raising alerts, reading them back. */

import { getDb } from "../../memory/db.js";
import { lc } from "../../utils/address.js";
import { recordActivity } from "../../terminal/ingest.js";
import { DEFAULTS } from "./thresholds.js";
import { classify } from "./classify.js";

/**
 * Record a movement and raise any alerts it warrants.
 * Returns the alerts that were stored (after cooldown), possibly empty.
 */
export function observe(movement, ctx = {}, opts = DEFAULTS) {
  const m = { ...movement, observedAt: movement.observedAt ?? Date.now() };
  const rowId = recordActivity(m);
  if (rowId === null) return [];

  const db = getDb();
  const history = db.prepare(
    `SELECT side, amount_usd AS amountUsd, observed_at AS observedAt
       FROM wallet_activity
      WHERE wallet_address = ? AND token_address = ? AND observed_at >= ?
        AND id != ?`,
  ).all(lc(m.wallet), lc(m.token), m.observedAt - opts.flowWindowMs, rowId);

  const raised = classify(m, history, ctx, opts);
  const stored = [];
  const recent = db.prepare(
    `SELECT 1 FROM alerts WHERE kind = ? AND token_address = ?
       AND IFNULL(wallet_address, '') = IFNULL(?, '') AND created_at >= ? LIMIT 1`,
  );
  const insert = db.prepare(
    `INSERT INTO alerts (kind, token_address, wallet_address, chain, amount_usd, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const al of raised) {
    if (recent.get(al.kind, lc(m.token), lc(m.wallet), m.observedAt - opts.cooldownMs)) continue;
    const info = insert.run(al.kind, lc(m.token), lc(m.wallet), m.chain,
                            al.amountUsd, al.detail, m.observedAt);
    stored.push({ id: Number(info.lastInsertRowid), ...al,
                  token: lc(m.token), wallet: lc(m.wallet), chain: m.chain });
  }
  return stored;
}

export function recentAlerts({ token = null, limit = 25 } = {}) {
  const db = getDb();
  const rows = token
    ? db.prepare(`SELECT * FROM alerts WHERE token_address = ?
                  ORDER BY created_at DESC LIMIT ?`).all(lc(token), limit)
    : db.prepare(`SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?`).all(limit);
  return rows.map((r) => ({
    id: r.id, kind: r.kind, token: r.token_address, wallet: r.wallet_address,
    chain: r.chain, amountUsd: r.amount_usd, detail: r.detail, createdAt: r.created_at,
  }));
}
