/**
 * The four memory modules over HTTP.
 */

import {
  inspect, matriarchScore, recentAlerts, observe, recordFunding,
} from "../../terminal/index.js";

export function register(app, { broadcast }) {
  // Registered before /:chain/:address on purpose: Express matches in
  // order, and that pattern would otherwise read "wallet" as a chain name.
  app.get("/api/elephant/wallet/:address", (req, res) => {
    try { res.json(matriarchScore(req.params.address)); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/elephant/alerts", (req, res) => {
    try {
      const limit = Math.min(200, parseInt(req.query.limit || "25", 10));
      res.json(recentAlerts({ token: req.query.token || null, limit }));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/elephant/:chain/:address", (req, res) => {
    try {
      const report = inspect(req.params.address, { chain: req.params.chain });
      res.status(report.known ? 200 : 404).json(report);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Feed a movement from any source; alerts are raised and broadcast
  app.post("/api/elephant/activity", (req, res) => {
    try {
      const { wallet, token, chain, side, block, amountUsd, liquidityUsd } = req.body || {};
      const raised = observe({ wallet, token, chain, side, block, amountUsd }, { liquidityUsd });
      for (const a of raised) broadcast("elephantAlert", a);
      res.json({ recorded: true, alerts: raised });
    } catch (err) { res.status(400).json({ error: err.message }); }
  });

  // Record who funded whom (manual, or from a provider)
  app.post("/api/elephant/funding", (req, res) => {
    try {
      const { wallet, funder, chain, amountUsd, source } = req.body || {};
      res.json({ added: recordFunding(wallet, funder, chain, { amountUsd, source: source || "api" }) });
    } catch (err) { res.status(400).json({ error: err.message }); }
  });
}
