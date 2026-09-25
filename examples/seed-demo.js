#!/usr/bin/env node
/**
 * npm run demo — fill a separate demo memory and show the report.
 *
 * One deployer with four earlier launches (three died), the same three
 * wallets buying early on every one of them, a shared funder, and a new
 * launch with liquidity leaving. Everything the four modules look for.
 *
 * Writes to data/demo.db, never to your real memory.
 */

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const here = path.dirname(fileURLToPath(import.meta.url));
const DB = process.env.EB_MEMORY_PATH || path.join(here, "../data/demo.db");
process.env.EB_MEMORY_PATH = DB;
for (const f of [DB, DB + "-wal", DB + "-shm"]) fs.rmSync(f, { force: true });

const { initMemory, closeMemory, recordToken, recordBundle, updateTokenStatus, flagWallet } =
  await import("../src/memory/index.js");
const { migrate } = await import("../src/memory/migrate.js");
const EB = await import("../src/terminal/index.js");

// stable, valid-looking addresses derived from readable labels
const addr = (label) => ethers.id(label).slice(0, 42);

initMemory();
migrate({ quiet: true });

const deployer = addr("demo:deployer");
const crew = ["crew:1", "crew:2", "crew:3"].map(addr);
const boss = addr("demo:funder");

for (let i = 0; i < 4; i++) {
  const t = addr(`demo:old-${i}`);
  recordToken({ address: t, chain: "base", deployer, score: 62, verdict: "CAUTION" });
  recordBundle(t, crew, 21_000_000 + i * 4_000, "base");
  updateTokenStatus(t, i === 3 ? "alive" : "rugged", i === 3 ? 1.2 : 0.001);
}
flagWallet(crew[0], "base", "known_rugger", "first block on three dead launches");
EB.recordFunding(deployer, boss, "base", { source: "demo" });
EB.recordFunding(crew[1], boss, "base", { source: "demo" });

const token = addr("demo:new-launch");
recordToken({ address: token, chain: "base", deployer, score: 34, verdict: "DANGER" });
recordBundle(token, [...crew, addr("demo:stranger")], 21_020_000, "base");
EB.observe({ wallet: crew[1], token, chain: "base", side: "remove_lp",
             amountUsd: 48_000, block: 21_020_030 }, { liquidityUsd: 90_000 });

console.log(EB.formatReport(EB.inspect(token), { color: process.stdout.isTTY }));
console.log(`  demo memory: ${path.relative(process.cwd(), DB)}`);
console.log(`  token:       ${token}\n`);

if (process.argv.includes("--write-examples")) {
  const out = (name, data) => fs.writeFileSync(path.join(here, name), JSON.stringify(data, null, 2) + "\n");
  out("inspect-report.json", EB.inspect(token));
  out("herd-map.json", EB.buildHerd({ token }));
  out("deployer-memory.json", EB.traceDeployer(deployer));
  out("matriarch-score.json", EB.matriarchScore(crew[1]));
  out("alerts.json", EB.recentAlerts({ token }));
  console.log("  wrote examples/*.json\n");
}

closeMemory();
