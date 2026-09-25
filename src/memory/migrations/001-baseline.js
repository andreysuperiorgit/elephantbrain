/**
 * Schema v1 — baseline.
 */

export default {
    version: 1,
    name: "baseline",
    // The original four tables. Written as IF NOT EXISTS so databases
    // created before migrations existed adopt version 1 cleanly instead
    // of failing on tables that are already there.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS deployers (
          address       TEXT PRIMARY KEY,
          chain         TEXT NOT NULL,
          first_seen    INTEGER NOT NULL,
          last_seen     INTEGER NOT NULL,
          tokens_total  INTEGER DEFAULT 0,
          tokens_rugged INTEGER DEFAULT 0,
          tokens_alive  INTEGER DEFAULT 0,
          reputation    INTEGER DEFAULT 50
        );
        CREATE TABLE IF NOT EXISTS wallets (
          address      TEXT PRIMARY KEY,
          chain        TEXT NOT NULL,
          first_seen   INTEGER NOT NULL,
          bundle_count INTEGER DEFAULT 0,
          smart_money  INTEGER DEFAULT 0,
          known_rugger INTEGER DEFAULT 0,
          reputation   INTEGER DEFAULT 50,
          notes        TEXT
        );
        CREATE TABLE IF NOT EXISTS tokens (
          address           TEXT PRIMARY KEY,
          chain             TEXT NOT NULL,
          deployer          TEXT,
          launched_at       INTEGER NOT NULL,
          first_score       INTEGER,
          verdict           TEXT,
          sniped            INTEGER DEFAULT 0,
          current_status    TEXT DEFAULT 'live',
          died_at           INTEGER,
          peak_price_usd    REAL,
          current_price_usd REAL,
          FOREIGN KEY(deployer) REFERENCES deployers(address)
        );
        CREATE TABLE IF NOT EXISTS wallet_bundles (
          token_address  TEXT NOT NULL,
          wallet_address TEXT NOT NULL,
          block_number   INTEGER,
          PRIMARY KEY (token_address, wallet_address)
        );
      `);
    },
  };
