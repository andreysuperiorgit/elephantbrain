/**
 * The raw memory: totals, one deployer's record, one wallet's record.
 */

import { initMemory, getStats, getDb } from "../../memory/index.js";

export function register(app) {
  app.get("/api/memory/stats", (req, res) => {
    try { initMemory(); res.json(getStats()); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/memory/deployer/:address", (req, res) => {
    try {
      initMemory();
      const db = getDb();
      const addr = req.params.address.toLowerCase();
      const deployer = db.prepare("SELECT * FROM deployers WHERE address = ?").get(addr);
      if (!deployer) return res.status(404).json({ error: "deployer not seen yet" });
      const tokens = db.prepare(
        "SELECT address, chain, first_score, verdict, current_status, launched_at " +
        "FROM tokens WHERE deployer = ? ORDER BY launched_at DESC LIMIT 50",
      ).all(addr);
      res.json({ deployer, tokens });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/memory/wallet/:address", (req, res) => {
    try {
      initMemory();
      const wallet = getDb().prepare("SELECT * FROM wallets WHERE address = ?")
        .get(req.params.address.toLowerCase());
      if (!wallet) return res.status(404).json({ error: "wallet not seen yet" });
      res.json(wallet);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
}
