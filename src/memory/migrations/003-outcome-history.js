/**
 * Schema v3 — outcome history.
 */

export default {
    version: 3,
    name: "outcome history",
    // One row per observation, so a token that limps before it dies is
    // visible as a trajectory rather than a single final flag.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS token_observations (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          token_address TEXT NOT NULL,
          observed_at   INTEGER NOT NULL,
          age_hours     REAL,
          status        TEXT NOT NULL,
          price_usd     REAL,
          liquidity_usd REAL,
          note          TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_obs_token
          ON token_observations(token_address, observed_at DESC);
      `);
    },
  };
