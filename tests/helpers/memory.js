/**
 * A throwaway memory database per test file. node --test runs each file in
 * its own process, so the pid keeps parallel files from sharing a database.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initMemory, closeMemory, getDb } from "../../src/memory/index.js";
import { migrate } from "../../src/memory/migrate.js";

const TABLES = ["alerts", "wallet_funding", "wallet_activity", "token_observations",
                "wallet_bundles", "wallet_deployers", "tokens", "wallets", "deployers"];

export function tempMemory(label) {
  const file = path.join(os.tmpdir(), `eb-${label}-${process.pid}.db`);
  const wipe = () => { for (const f of [file, file + "-wal", file + "-shm"]) fs.rmSync(f, { force: true }); };
  return {
    file,
    setup() {
      wipe();
      process.env.EB_MEMORY_PATH = file;
      initMemory();
      migrate({ quiet: true });
    },
    teardown() { closeMemory(); wipe(); },
    reset() {
      const db = getDb();
      for (const t of TABLES) { try { db.exec(`DELETE FROM ${t}`); } catch {} }
    },
  };
}

/** A readable fake address: "0x" + label, zero-padded to 40 characters. */
export const A = (s) => "0x" + String(s).padEnd(40, "0");
