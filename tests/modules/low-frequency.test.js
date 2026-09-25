import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { tempMemory, A } from "../helpers/memory.js";
import * as EB from "../../src/terminal/index.js";

const mem = tempMemory("lowfreq");
before(() => mem.setup());
after(() => mem.teardown());
beforeEach(() => mem.reset());

describe("Low-Frequency Alerts: classify", () => {
  const O = EB.ALERT_DEFAULTS;
  it("flags one large move", () => {
    const r = EB.classify({ side: "buy", amountUsd: 40_000 }, [], {}, O);
    assert.equal(r[0].kind, "large_move");
  });

  it("scales the threshold down for a thin pool", () => {
    const r = EB.classify({ side: "sell", amountUsd: 6_000 }, [], { liquidityUsd: 50_000 }, O);
    assert.equal(r[0].kind, "large_move", "12% of a $50k pool is large");
  });

  it("stays quiet on an ordinary trade", () => {
    assert.equal(EB.classify({ side: "buy", amountUsd: 900 }, [], {}, O).length, 0);
  });

  it("sees accumulation in several smaller buys", () => {
    const now = Date.now();
    const hist = [{ side: "buy", amountUsd: 6000, observedAt: now - 1000 },
                  { side: "buy", amountUsd: 6000, observedAt: now - 2000 }];
    const r = EB.classify({ side: "buy", amountUsd: 6000, observedAt: now }, hist, {}, O);
    assert.ok(r.some((a) => a.kind === "accumulation"));
  });

  it("ignores buys outside the window", () => {
    const now = Date.now();
    const hist = [{ side: "buy", amountUsd: 9000, observedAt: now - 5 * 3_600_000 },
                  { side: "buy", amountUsd: 9000, observedAt: now - 6 * 3_600_000 }];
    const r = EB.classify({ side: "buy", amountUsd: 9000, observedAt: now }, hist, {}, O);
    assert.ok(!r.some((a) => a.kind === "accumulation"));
  });

  it("flags liquidity leaving", () => {
    const r = EB.classify({ side: "remove_lp", amountUsd: 8000 }, [], { liquidityUsd: 40_000 }, O);
    assert.equal(r[0].kind, "liquidity_shift");
  });
});

describe("Low-Frequency Alerts: observe", () => {
  it("stores the alert, then honours the cooldown", () => {
    const m = { wallet: A("whale"), token: A("lt"), chain: "base", side: "buy", amountUsd: 50_000 };
    const first = EB.observe({ ...m, block: 1 });
    const second = EB.observe({ ...m, block: 2 });
    assert.equal(first.length, 1);
    assert.equal(second.length, 0, "same kind, same wallet, same token, inside the cooldown");
    assert.equal(EB.recentAlerts({ token: A("lt") }).length, 1);
  });

  it("does nothing for a movement it has already seen", () => {
    const m = { wallet: A("w9"), token: A("t9"), chain: "base", side: "buy", amountUsd: 90_000, block: 7 };
    EB.observe(m);
    assert.equal(EB.observe(m).length, 0);
  });
});
