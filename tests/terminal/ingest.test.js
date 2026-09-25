import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { tempMemory, A } from "../helpers/memory.js";
import { getDb } from "../../src/memory/index.js";
import { currentVersion, latestVersion } from "../../src/memory/migrate.js";
import * as EB from "../../src/terminal/index.js";

const mem = tempMemory("ingest");
before(() => mem.setup());
after(() => mem.teardown());
beforeEach(() => mem.reset());

describe("schema v5", () => {
  it("is applied", () => {
    assert.equal(currentVersion(), latestVersion());
    const tables = getDb().prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all().map((r) => r.name);
    for (const t of ["wallet_activity", "wallet_funding", "alerts"]) assert.ok(tables.includes(t), t);
  });
});

describe("record", () => {
  it("dedupes a movement in the same block", () => {
    const m = { wallet: A("w1"), token: A("t1"), chain: "base", side: "buy", block: 100 };
    assert.ok(EB.recordActivity(m));
    assert.equal(EB.recordActivity(m), null);
  });

  it("keeps two blockless buys at different moments apart", () => {
    const base = { wallet: A("w2"), token: A("t2"), chain: "base", side: "buy" };
    assert.ok(EB.recordActivity({ ...base, observedAt: 1000 }));
    assert.ok(EB.recordActivity({ ...base, observedAt: 2000 }),
      "a feed without block numbers must not collapse separate buys");
  });

  it("does not re-count early buyers when a token is scanned again", () => {
    const checks = { buyers: [A("b1"), A("b2")], bundleBlock: null };
    assert.equal(EB.ingestScan(A("t3"), "base", checks), 2);
    assert.equal(EB.ingestScan(A("t3"), "base", checks), 0);
  });

  it("refuses self-funding and bad sides", () => {
    assert.equal(EB.recordFunding(A("x"), A("x"), "base"), false);
    assert.throws(() => EB.recordActivity({ wallet: A("w"), token: A("t"), chain: "base", side: "hodl" }));
  });
});
