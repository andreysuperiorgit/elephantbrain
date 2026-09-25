import "dotenv/config";
import { createServer } from "./api/server.js";
import { SolanaMonitor } from "./chains/solana/monitor.js";
import { RobinhoodMonitor } from "./chains/robinhood/monitor.js";
import { BaseMonitor } from "./chains/base/monitor.js";
import { createLogger } from "./utils/logger.js";
import { initMemory, closeMemory } from "./memory/index.js";
import { migrate } from "./memory/migrate.js";
import { startFollowupLoop } from "./jobs/followup.job.js";

const log = createLogger("main");
const PORT = process.env.PORT || 3001;

async function main() {
  log.info("═══════════════════════════════════════");
  log.info("  ELEPHANTBRAIN — token memory terminal");
  log.info("  Solana · Robinhood Chain · Base");
  log.info("═══════════════════════════════════════");

  // The memory outlives any single run, so the schema is brought
  // forward before anything is allowed to write to it.
  initMemory();
  migrate();

  // Without this loop nothing ever records what happened to a scanned
  // token, so deployer reputation would stay flat forever.
  let stopFollowup = null;
  if (process.env.EB_FOLLOWUP !== "off") {
    const every = parseInt(process.env.EB_FOLLOWUP_MINUTES || "30", 10);
    stopFollowup = startFollowupLoop({ intervalMinutes: every });
  } else {
    log.warn("Follow-up loop: disabled (EB_FOLLOWUP=off)");
  }

  let solanaMonitor = null;
  let robinhoodMonitor = null;
  let baseMonitor = null;

  if (process.env.SOLANA_WS_URL) {
    solanaMonitor = new SolanaMonitor(process.env.SOLANA_WS_URL);
    log.info("Solana monitor: configured (Pump.fun)");
  } else { log.warn("Solana monitor: no SOLANA_WS_URL, skipping"); }

  if (process.env.ROBINHOOD_RPC_URL) {
    robinhoodMonitor = new RobinhoodMonitor(
      process.env.ROBINHOOD_WS_URL || process.env.ROBINHOOD_RPC_URL
    );
    log.info("Robinhood Chain monitor: configured (Pons V2)");
  } else { log.warn("Robinhood monitor: no ROBINHOOD_RPC_URL, skipping"); }

  if (process.env.BASE_RPC_URL) {
    baseMonitor = new BaseMonitor(
      process.env.BASE_WS_URL || process.env.BASE_RPC_URL
    );
    log.info("Base monitor: configured (Clanker / Uniswap V3)");
  } else { log.warn("Base monitor: no BASE_RPC_URL, skipping"); }

  const { server } = createServer({ solanaMonitor, robinhoodMonitor, baseMonitor });

  server.listen(PORT, () => {
    log.info(`API server: http://localhost:${PORT}`);
    log.info(`WebSocket:  ws://localhost:${PORT}/ws`);
    log.info("───────────────────────────────────");
    log.info("Dashboard: http://localhost:3000");
  });

  if (process.env.SNIPER_ENABLED === "true") {
    log.warn("⚠️  SNIPER IS ENABLED — real funds will be used!");
  }

  // Ctrl+C locally, SIGTERM from Docker on `compose down`. Both stop the
  // follow-up loop and close SQLite cleanly, so the WAL is checkpointed
  // instead of being left for the next start to recover.
  let stopping = false;
  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    log.info(`${signal} — shutting down`);
    stopFollowup?.();
    await solanaMonitor?.stop();
    await robinhoodMonitor?.stop();
    await baseMonitor?.stop();
    server.close();
    closeMemory();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => { log.error("Fatal:", err.message); process.exit(1); });
