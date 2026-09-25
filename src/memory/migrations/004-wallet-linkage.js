/**
 * Schema v4 — wallet linkage.
 */

export default {
    version: 4,
    name: "wallet linkage",
    // Which deployers a wallet has funded or bought into. This is the
    // edge set the dashboards draw as "shared crew"; deriving it from
    // wallet_bundles on every read was getting expensive.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS wallet_deployers (
          wallet_address   TEXT NOT NULL,
          deployer_address TEXT NOT NULL,
          chain            TEXT NOT NULL,
          times_seen       INTEGER DEFAULT 1,
          first_seen       INTEGER NOT NULL,
          last_seen        INTEGER NOT NULL,
          PRIMARY KEY (wallet_address, deployer_address)
        );
        CREATE INDEX IF NOT EXISTS idx_wd_deployer
          ON wallet_deployers(deployer_address);
      `);
    },
  };
