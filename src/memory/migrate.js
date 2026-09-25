/**
 * ELEPHANTBRAIN Memory — schema migrations.
 *
 * The memory database is meant to live for months. Once a deployer has
 * a year of history in it, throwing the file away to change a column is
 * not an option — so every schema change goes through here.
 *
 * Each migration is applied once, in order, inside a transaction, and
 * recorded in `schema_migrations`. Adding one means a new file in
 * migrations/ and a line in migrations/index.js; never edit a migration
 * that has already shipped.
 */

import { getDb } from "./db.js";
import { createLogger } from "../utils/logger.js";
import { MIGRATIONS } from "./migrations/index.js";

const log = createLogger("memory-migrate");


function ensureMigrationTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);
}


export function currentVersion(db = getDb()) {
  ensureMigrationTable(db);
  const row = db
    .prepare("SELECT MAX(version) AS v FROM schema_migrations")
    .get();
  return row?.v || 0;
}


export function latestVersion() {
  return MIGRATIONS[MIGRATIONS.length - 1].version;
}


/**
 * Bring the database up to the newest schema.
 * Safe to call on every boot — already-applied migrations are skipped.
 */
export function migrate({ quiet = false } = {}) {
  const db = getDb();
  ensureMigrationTable(db);

  const from = currentVersion(db);
  const pending = MIGRATIONS.filter((m) => m.version > from);

  if (pending.length === 0) {
    if (!quiet) log.info(`Memory schema up to date (v${from})`);
    return { from, to: from, applied: [] };
  }

  const applied = [];
  for (const m of pending) {
    const run = db.transaction(() => {
      m.up(db);
      db.prepare(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
      ).run(m.version, m.name, Date.now());
    });
    run();
    applied.push(m);
    if (!quiet) log.info(`  applied v${m.version} — ${m.name}`);
  }

  const to = currentVersion(db);
  if (!quiet) log.info(`Memory schema v${from} → v${to}`);
  return { from, to, applied: applied.map((m) => m.version) };
}


export function migrationStatus() {
  const db = getDb();
  ensureMigrationTable(db);
  const done = db
    .prepare("SELECT version, name, applied_at FROM schema_migrations ORDER BY version")
    .all();
  const doneVersions = new Set(done.map((r) => r.version));
  return {
    current: currentVersion(db),
    latest: latestVersion(),
    applied: done,
    pending: MIGRATIONS.filter((m) => !doneVersions.has(m.version))
      .map((m) => ({ version: m.version, name: m.name })),
  };
}
