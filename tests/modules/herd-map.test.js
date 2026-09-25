import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { tempMemory, A } from "../helpers/memory.js";
import * as EB from "../../src/terminal/index.js";

const mem = tempMemory("herd");
before(() => mem.setup());
after(() => mem.teardown());
beforeEach(() => mem.reset());

describe("Herd Map", () => {
  it("groups wallets that buy together across tokens", () => {
    // the same two wallets land within a block of each other on three tokens
    for (let i = 0; i < 3; i++) {
      EB.recordActivity({ wallet: A("h1"), token: A("ht" + i), chain: "base", side: "buy", block: 1000 + i * 50 });
      EB.recordActivity({ wallet: A("h2"), token: A("ht" + i), chain: "base", side: "buy", block: 1001 + i * 50 });
    }
    // a stranger buys once, far away
    EB.recordActivity({ wallet: A("loner"), token: A("ht0"), chain: "base", side: "buy", block: 1300 });
    const h = EB.buildHerd({ token: A("ht0") });
    assert.equal(h.clusters.length, 1);
    assert.equal(h.clusters[0].size, 2);
    assert.ok(!h.clusters[0].members.includes(A("loner").toLowerCase()));
    assert.match(h.edges[0].evidence[0], /3 token/);
  });

  it("counts a pair once per token, not once per trade", () => {
    for (let b = 0; b < 4; b++) {
      EB.recordActivity({ wallet: A("p1"), token: A("pt"), chain: "base", side: "buy", block: 10 + b });
      EB.recordActivity({ wallet: A("p2"), token: A("pt"), chain: "base", side: "buy", block: 10 + b });
    }
    const h = EB.buildHerd({ token: A("pt"), minWeight: 1 });
    assert.equal(h.edges[0].weight, 1);
  });

  it("links a shared funder even without trading together", () => {
    EB.recordActivity({ wallet: A("q1"), token: A("qt"), chain: "base", side: "buy", block: 1 });
    EB.recordActivity({ wallet: A("q2"), token: A("qt"), chain: "base", side: "buy", block: 900 });
    EB.recordFunding(A("q1"), A("src"), "base");
    EB.recordFunding(A("q2"), A("src"), "base");
    const h = EB.buildHerd({ token: A("qt") });
    assert.equal(h.clusters.length, 1);
    assert.match(h.edges[0].evidence.join(" "), /same funder/);
  });

  it("gives every node a position, and the same input the same picture", () => {
    EB.recordActivity({ wallet: A("z1"), token: A("zt"), chain: "base", side: "buy", block: 5 });
    const a = EB.buildHerd({ token: A("zt") });
    const b = EB.buildHerd({ token: A("zt") });
    assert.ok(Number.isFinite(a.nodes[0].x));
    assert.deepEqual(a.nodes, b.nodes);
  });
});
