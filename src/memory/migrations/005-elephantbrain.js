/**
 * Schema v5 — elephantbrain.
 */

import { addColumn } from "./helpers.js";

export default {
    version: 5,
    name: "elephantbrain",
    // What ELEPHANTBRAIN needs on top of the Second Brain: every buy and
    // sell it observes (Herd Map, Low-Frequency Alerts, Matriarch Score),
    // who funded whom (Deployer Memory), and the alerts it raised.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS wallet_activity (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet_address TEXT NOT NULL,
          token_address  TEXT NOT NULL,
          chain          TEXT NOT NULL,
          side           TEXT NOT NULL,
          block_number   INTEGER,
          observed_at    INTEGER NOT NULL,
          amount_usd     REAL
        );
        CREATE INDEX IF NOT EXISTS idx_act_token
          ON wallet_activity(token_address, block_number);
        CREATE INDEX IF NOT EXISTS idx_act_wallet
          ON wallet_activity(wallet_address, observed_at);
        -- a movement with a block is unique per block; one without a block
        -- (a feed that does not report it) is unique per moment instead,
        -- or two separate buys would collapse into one
        CREATE UNIQUE INDEX IF NOT EXISTS idx_act_once
          ON wallet_activity(wallet_address, token_address, side,
                             IFNULL(block_number, -observed_at));

        CREATE TABLE IF NOT EXISTS wallet_funding (
          wallet_address TEXT NOT NULL,
          funder_address TEXT NOT NULL,
          chain          TEXT NOT NULL,
          first_seen     INTEGER NOT NULL,
          amount_usd     REAL,
          source         TEXT,
          PRIMARY KEY (wallet_address, funder_address)
        );
        CREATE INDEX IF NOT EXISTS idx_fund_funder
          ON wallet_funding(funder_address);

        CREATE TABLE IF NOT EXISTS alerts (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          kind           TEXT NOT NULL,
          token_address  TEXT NOT NULL,
          wallet_address TEXT,
          chain          TEXT NOT NULL,
          amount_usd     REAL,
          detail         TEXT,
          created_at     INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_alerts_token
          ON alerts(token_address, created_at DESC);
      `);
      // on-chain age, when a provider can tell us; memory age otherwise
      addColumn(db, "wallets", "chain_first_tx_at", "INTEGER");
      addColumn(db, "deployers", "chain_first_tx_at", "INTEGER");
    },
  };
