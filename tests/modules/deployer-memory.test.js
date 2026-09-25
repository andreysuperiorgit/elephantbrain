import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { tempMemory, A } from "../helpers/memory.js";
import { recordToken, recordBundle, updateTokenStatus } from "../../src/memory/index.js";
import * as EB from "../../src/terminal/index.js";

const mem = tempMemory("deployer");
before(() => mem.setup());
after(() => mem.teardown());
beforeEach(() => mem.reset());

describe("Deployer Memory", () => {
  it("says so when an address has no history", () => {
    const d = EB.traceDeployer(A("nobody"), "base");
    assert.equal(d.pattern, "no history");
    assert.equal(d.known, false);
    assert.match(d.caveat, /probabilistic/);
  });

  it("recognises a serial deployer", () => {
    for (let i = 0; i < 3; i++) {
      recordToken({ address: A("s" + i), chain: "base", deployer: A("dep"), score: 60, verdict: "CAUTION" });
      updateTokenStatus(A("s" + i), "rugged", 0);
    }
    const d = EB.traceDeployer(A("dep"));
    assert.equal(d.counts.rugged, 3);
    assert.equal(d.pattern, "serial");
  });

  it("links a funder, and siblings paid by the same funder", () => {
    recordToken({ address: A("f1"), chain: "base", deployer: A("dep2"), score: 70, verdict: "CAUTION" });
    EB.recordFunding(A("dep2"), A("boss"), "base");
    EB.recordFunding(A("sib"), A("boss"), "base");
    const d = EB.traceDeployer(A("dep2"));
    const funder = d.related.find((r) => r.address === A("boss").toLowerCase());
    const sib = d.related.find((r) => r.address === A("sib").toLowerCase());
    assert.equal(funder.kind, "funder");
    assert.equal(sib.kind, "sibling");
    assert.ok(funder.confidence > sib.confidence);
  });

  it("finds the crew that buys early on several launches", () => {
    for (let i = 0; i < 3; i++) {
      recordToken({ address: A("c" + i), chain: "base", deployer: A("dep3"), score: 50, verdict: "WARNING" });
      recordBundle(A("c" + i), [A("crew1"), A("crew2")], 500 + i * 10, "base");
    }
    const d = EB.traceDeployer(A("dep3"));
    const crew = d.related.filter((r) => r.kind === "crew");
    assert.equal(crew.length, 2);
    assert.match(crew[0].reason, /3 of its 3 launches/);
  });
});
