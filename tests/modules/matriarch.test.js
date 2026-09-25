import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { tempMemory, A } from "../helpers/memory.js";
import { recordToken, updateTokenStatus, flagWallet } from "../../src/memory/index.js";
import * as EB from "../../src/terminal/index.js";

const mem = tempMemory("matriarch");
before(() => mem.setup());
after(() => mem.teardown());
beforeEach(() => mem.reset());

describe("Matriarch Score", () => {
  it("is cautious about a wallet it barely knows", () => {
    const m = EB.matriarchScore(A("new"));
    assert.equal(m.confidence, "thin record");
    assert.equal(m.components.survival.value, 0.5, "no outcomes is neutral, not good or bad");
  });

  it("caps a flagged wallet", () => {
    flagWallet(A("bad"), "base", "known_rugger", "test");
    const m = EB.matriarchScore(A("bad"));
    assert.ok(m.score <= 15);
    assert.equal(m.band, "OUTSIDER");
  });

  it("rewards a wallet whose picks survived", () => {
    for (let i = 0; i < 6; i++) {
      recordToken({ address: A("g" + i), chain: "base", deployer: A("gd" + i), score: 85, verdict: "SAFE" });
      updateTokenStatus(A("g" + i), "alive", 1);
      EB.recordActivity({ wallet: A("good"), token: A("g" + i), chain: "base", side: "buy", block: i });
    }
    for (let i = 0; i < 6; i++) {
      recordToken({ address: A("r" + i), chain: "base", deployer: A("rd" + i), score: 40, verdict: "WARNING" });
      updateTokenStatus(A("r" + i), "rugged", 0);
      EB.recordActivity({ wallet: A("poor"), token: A("r" + i), chain: "base", side: "buy", block: i });
    }
    const good = EB.matriarchScore(A("good"));
    const poor = EB.matriarchScore(A("poor"));
    assert.ok(good.score > poor.score, `${good.score} should beat ${poor.score}`);
    assert.equal(good.components.survival.value, 1);
    assert.equal(poor.components.survival.value, 0);
  });
});
