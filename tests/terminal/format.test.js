import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { tempMemory, A } from "../helpers/memory.js";
import { recordToken, recordBundle } from "../../src/memory/index.js";
import * as EB from "../../src/terminal/index.js";

const mem = tempMemory("format");
before(() => mem.setup());
after(() => mem.teardown());

describe("formatReport", () => {
  it("prints every section, in plain text when asked", () => {
    recordToken({ address: A("ft"), chain: "base", deployer: A("fd"), score: 40, verdict: "WARNING" });
    recordBundle(A("ft"), [A("f1"), A("f2")], 100, "base");
    const out = EB.formatReport(EB.inspect(A("ft")), { color: false });
    for (const s of ["DEPLOYER MEMORY", "HERD MAP", "LOW-FREQUENCY ALERTS", "MATRIARCH SCORE"]) {
      assert.ok(out.includes(s), s);
    }
    assert.ok(!out.includes("\x1b["), "plain means no escape codes");
  });

  it("gives the hint for a contract memory has not seen", () => {
    assert.match(EB.formatReport(EB.inspect(A("never")), { color: false }), /Scan it first/);
  });
});

describe("formatWallet", () => {
  it("shows the four components with their weights", () => {
    const out = EB.formatWallet(EB.matriarchScore(A("fw")), { color: false });
    for (const k of ["age", "breadth", "survival", "conduct"]) assert.ok(out.includes(k), k);
    assert.match(out, /\/ 100/);
  });
});
