/**
 * Live monitors → dashboard. Solana launches are announced; Robinhood and
 * Base launches are also scanned the moment they appear.
 */

import { createLogger } from "../utils/logger.js";
import { runScan } from "./pipeline.js";

const log = createLogger("monitors");

function autoScan(monitor, chain, broadcast) {
  monitor.on("newToken", async (d) => {
    broadcast("newLaunch", d);
    if (!d.token) return;
    try {
      // the token comes from the monitor event — there is no request here
      broadcast("scanResult", await runScan(chain, d.token));
    } catch (err) {
      log.error(`${chain} auto-scan failed: ${err.message}`);
    }
  });
}

export function wireMonitors({ solanaMonitor, robinhoodMonitor, baseMonitor }, broadcast) {
  if (solanaMonitor) {
    solanaMonitor.on("newToken", (d) => broadcast("newLaunch", d));
    solanaMonitor.on("status", (s) => broadcast("monitorStatus", { chain: "solana", ...s }));
  }
  if (robinhoodMonitor) {
    autoScan(robinhoodMonitor, "robinhood", broadcast);
    robinhoodMonitor.on("status", (s) => broadcast("monitorStatus", { chain: "robinhood", ...s }));
  }
  if (baseMonitor) {
    autoScan(baseMonitor, "base", broadcast);
    baseMonitor.on("status", (s) => broadcast("monitorStatus", { chain: "base", ...s }));
  }
}
