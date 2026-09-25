import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { tempMemory, A } from "../helpers/memory.js";
import { recordToken } from "../../src/memory/index.js";
import * as EB from "../../src/terminal/index.js";

const mem = tempMemory("inspect");
before(() => mem.setup());
after(() => mem.teardown());
beforeEach(() => mem.reset());

describe("inspect", () => {
  it("says it has not seen a contract rather than reporting it clean", () => {
    const r = EB.inspect(A("unknown"));
    assert.equal(r.known, false);
    assert.match(r.hint, /Scan it first/);
  });

  it("brings the four modules together", () => {
    recordToken({ address: A("main"), chain: "base", deployer: A("md"), score: 55, verdict: "WARNING" });
    EB.recordActivity({ wallet: A("m1"), token: A("main"), chain: "base", side: "buy", block: 10 });
    EB.recordActivity({ wallet: A("m2"), token: A("main"), chain: "base", side: "buy", block: 10 });
    EB.recordFunding(A("m1"), A("mf"), "base");
    EB.recordFunding(A("m2"), A("mf"), "base");
    EB.observe({ wallet: A("m1"), token: A("main"), chain: "base", side: "sell", amountUsd: 80_000, block: 20 });

    const r = EB.inspect(A("main"));
    assert.equal(r.known, true);
    assert.equal(r.herd.clusters.length, 1);
    assert.equal(r.alerts.length, 1);
    assert.ok(r.matriarch.wallets.length >= 2);
    assert.ok(r.summary.length >= 3);
    assert.ok(r.notes.some((n) => /predict/.test(n)));
  });
});
