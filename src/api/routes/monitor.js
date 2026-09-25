/**
 * Start, stop and inspect the live chain monitors.
 */

export function register(app, { monitors }) {
  const byChain = {
    solana: monitors.solanaMonitor,
    robinhood: monitors.robinhoodMonitor,
    base: monitors.baseMonitor,
  };

  app.post("/api/monitor/start", async (req, res) => {
    const { chain } = req.body || {};
    const m = byChain[chain];
    if (!m) return res.status(400).json({ error: "Invalid chain" });
    await m.start();
    res.json({ status: "started", chain });
  });

  app.post("/api/monitor/stop", async (req, res) => {
    const { chain } = req.body || {};
    await byChain[chain]?.stop();
    res.json({ status: "stopped", chain });
  });

  app.get("/api/monitor/status", (req, res) => {
    res.json(Object.fromEntries(Object.entries(byChain)
      .map(([c, m]) => [c, { running: m?.running ?? false }])));
  });
}
