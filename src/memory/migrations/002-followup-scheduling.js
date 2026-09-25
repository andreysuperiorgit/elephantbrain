/**
 * Schema v2 — followup scheduling.
 */

import { addColumn } from "./helpers.js";

export default {
    version: 2,
    name: "followup scheduling",
    // The follow-up job needs to know when a token was last looked at
    // and how many times, otherwise it either re-checks everything on
    // every pass or loses track of what it has already settled.
    up: (db) => {
      addColumn(db, "tokens", "last_checked_at", "INTEGER");
      addColumn(db, "tokens", "check_count", "INTEGER DEFAULT 0");
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_tokens_followup
          ON tokens(current_status, last_checked_at);
      `);
    },
  };
