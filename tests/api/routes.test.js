import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { tempMemory, A } from "../helpers/memory.js";
import { recordToken, recordBundle } from "../../src/memory/index.js";
import { createServer } from "../../src/api/server.js";

const mem = tempMemory("api");
let server, base;

before(async () => {
  mem.setup();
  recordToken({ address: A("apitok"), chain: "base", deployer: A("apidep"), score: 55, verdict: "WARNING" });
  recordBundle(A("apitok"), [A("a1"), A("a2")], 700, "base");
  ({ server } = createServer({}));
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  mem.teardown();
});

const get = async (p) => { const r = await fetch(base + p); return [r.status, await r.json()]; };
const post = async (p, body) => {
  const r = await fetch(base + p, { method: "POST", headers: { "content-type": "application/json" },
                                    body: JSON.stringify(body) });
  return [r.status, await r.json()];
};

describe("HTTP API", () => {
  it("answers health", async () => {
    const [st, j] = await get("/api/health");
    assert.equal(st, 200);
    assert.equal(j.status, "ok");
  });

  it("returns the full report for a known contract", async () => {
    const [st, j] = await get(`/api/elephant/base/${A("apitok")}`);
    assert.equal(st, 200);
    assert.equal(j.known, true);
    assert.ok(j.deployer && j.herd && j.matriarch);
  });

  it("404s a contract memory has not seen", async () => {
    const [st, j] = await get(`/api/elephant/base/${A("ghost")}`);
    assert.equal(st, 404);
    assert.equal(j.known, false);
  });

  it("does not read /wallet/ as a chain name", async () => {
    const [st, j] = await get(`/api/elephant/wallet/${A("a1")}`);
    assert.equal(st, 200);
    assert.ok(Number.isFinite(j.score), "a Matriarch Score, not a contract report");
  });

  it("raises an alert from a fed movement, then lists it", async () => {
    const [st, j] = await post("/api/elephant/activity", {
      wallet: A("big"), token: A("apitok"), chain: "base", side: "remove_lp",
      amountUsd: 30_000, liquidityUsd: 60_000, block: 900,
    });
    assert.equal(st, 200);
    assert.equal(j.alerts[0].kind, "liquidity_shift");
    const [, list] = await get(`/api/elephant/alerts?token=${A("apitok")}`);
    assert.equal(list.length, 1);
  });

  it("rejects a malformed movement", async () => {
    const [st] = await post("/api/elephant/activity", { wallet: A("x"), side: "hodl" });
    assert.equal(st, 400);
  });

  it("records a funding link once", async () => {
    const body = { wallet: A("kid"), funder: A("mum"), chain: "base" };
    assert.equal((await post("/api/elephant/funding", body))[1].added, true);
    assert.equal((await post("/api/elephant/funding", body))[1].added, false);
  });

  it("reports memory totals", async () => {
    const [st, j] = await get("/api/memory/stats");
    assert.equal(st, 200);
    assert.ok(j.tokensSeen >= 1);
  });

  it("refuses to start a monitor for an unknown chain", async () => {
    const [st] = await post("/api/monitor/start", { chain: "dogechain" });
    assert.equal(st, 400);
  });
});
