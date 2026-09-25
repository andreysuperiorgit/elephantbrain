export function register(app) {
  app.get("/api/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));
}
