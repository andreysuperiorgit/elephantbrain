#!/usr/bin/env node
/**
 * elephant — what the market forgets about a contract.
 *
 *   npm run elephant -- <contract>              full report
 *   npm run elephant -- <contract> --json       raw JSON
 *   npm run elephant -- --wallet <address>      Matriarch Score
 *   npm run elephant -- --alerts [--token <a>]  recent alerts
 *   npm run elephant -- --fund <wallet> <funder> --chain base
 *                                               record a funding link by hand
 *   add --plain for output without colour
 */

import "dotenv/config";
import { initMemory, closeMemory } from "../src/memory/index.js";
import { migrate } from "../src/memory/migrate.js";
import {
  inspect, matriarchScore, recentAlerts, recordFunding,
  formatReport, formatWallet, formatAlerts,
} from "../src/terminal/index.js";

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i === -1 ? null : args[i + 1]; };
const color = !flag("--plain") && process.stdout.isTTY !== false;
const json = (x) => console.log(JSON.stringify(x, null, 2));

const HELP = `
  ELEPHANTBRAIN  a terminal for token memory

    npm run elephant -- <contract>               full report
    npm run elephant -- <contract> --json        raw JSON
    npm run elephant -- --wallet <address>       Matriarch Score
    npm run elephant -- --alerts [--token <a>]   recent alerts
    npm run elephant -- --fund <wallet> <funder> --chain <chain>
    add --plain for output without colour
`;

initMemory();
migrate({ quiet: true });

try {
  if (flag("--help") || args.length === 0) {
    console.log(HELP);
  } else if (flag("--fund")) {
    const i = args.indexOf("--fund");
    const chain = val("--chain");
    if (!chain) throw new Error("--chain is required");
    console.log(recordFunding(args[i + 1], args[i + 2], chain, { source: "manual" })
      ? "funding link recorded" : "already known");
  } else if (flag("--wallet")) {
    const m = matriarchScore(val("--wallet"));
    flag("--json") ? json(m) : console.log(formatWallet(m, { color }));
  } else if (flag("--alerts")) {
    const rows = recentAlerts({ token: val("--token"), limit: 30 });
    flag("--json") ? json(rows) : console.log(formatAlerts(rows, { color }));
  } else {
    const rep = inspect(args[0]);
    flag("--json") ? json(rep) : console.log(formatReport(rep, { color }));
  }
} finally {
  closeMemory();
}
