/**
 * ELEPHANTBRAIN — a terminal for token memory.
 *
 * Paste a contract address; get back what the market forgets. Four
 * modules, one call:
 *
 *   Deployer Memory       who launched it, and what happened last time
 *   Herd Map              which wallets move together around it
 *   Low-Frequency Alerts  large movements before price does anything
 *   Matriarch Score       how experienced the wallets around it are
 *
 * It does not predict prices, guarantee safety, or simulate neurons. It
 * remembers, and it says where each memory came from.
 */

import { traceDeployer } from "../modules/deployer-memory/index.js";
import { buildHerd } from "../modules/herd-map/index.js";
import { recentAlerts, observe, classify, DEFAULTS as ALERT_DEFAULTS } from "../modules/low-frequency/index.js";
import { matriarchScore, band } from "../modules/matriarch/index.js";
import { recordActivity, recordFunding, ingestScan } from "./ingest.js";
import { inspect } from "./inspect.js";
import { formatReport, formatWallet, formatAlerts } from "./format.js";


export const VERSION = "0.4.0";

export {
  inspect, formatReport, formatWallet, formatAlerts,
  traceDeployer, buildHerd, recentAlerts, observe, classify, ALERT_DEFAULTS,
  matriarchScore, band, recordActivity, recordFunding, ingestScan,
};
