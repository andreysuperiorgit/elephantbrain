/**
 * GET /api/scan/:chain/:address — the six checks, the score, memory's
 * adjustment, and (if configured) RugCheck and Grok.
 */

import { runScan, SCANNERS } from "../pipeline.js";

export function register(app) {
  for (const chain of Object.keys(SCANNERS)) {
    app.get(`/api/scan/${chain}/:address`, async (req, res) => {
      try { res.json(await runScan(chain, req.params.address, { extras: true })); }
      catch (err) { res.status(500).json({ error: err.message }); }
    });
  }
}
