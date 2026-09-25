import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectEvmBundles } from "../../src/chains/evm/index.js";

// a provider that answers from a fixed list of Transfer logs
const topic = (addr) => "0x" + "0".repeat(24) + addr.replace(/^0x/, "").padStart(40, "0");
const fake = (logs, head = 5000) => ({
  getBlockNumber: async () => head,
  getLogs: async () => logs.map(([block, to]) => ({ blockNumber: block, topics: ["0x", "0x", topic(to)] })),
});
const w = (n) => "0x" + String(n).padStart(40, "a");

describe("detectEvmBundles", () => {
  it("reports the block the buys landed in, not the chain head", async () => {
    const logs = [[4100, w(1)], ...[1, 2, 3, 4, 5].map((i) => [4200, w(10 + i)]), [4300, w(2)]];
    const r = await detectEvmBundles(fake(logs), "0xtoken");
    assert.equal(r.detected, true);
    assert.equal(r.blockNumber, 4200, "the bundle block, not 5000");
  });

  it("lists the bundle's wallets before the rest", async () => {
    const logs = [[4100, w(1)], ...[1, 2, 3, 4, 5].map((i) => [4200, w(10 + i)])];
    const r = await detectEvmBundles(fake(logs), "0xtoken");
    assert.equal(r.wallets[0], w(11).toLowerCase());
    assert.ok(r.wallets.includes(w(1).toLowerCase()));
  });

  it("does not call four buys in one block a bundle", async () => {
    const logs = [1, 2, 3, 4].map((i) => [4200, w(i)]);
    assert.equal((await detectEvmBundles(fake(logs), "0xtoken")).detected, false);
  });

  it("returns empty on too few transfers", async () => {
    const r = await detectEvmBundles(fake([[1, w(1)]]), "0xtoken");
    assert.deepEqual(r.wallets, []);
    assert.equal(r.detected, false);
  });

  it("survives a provider that throws", async () => {
    const broken = { getBlockNumber: async () => { throw new Error("rpc down"); } };
    const r = await detectEvmBundles(broken, "0xtoken");
    assert.equal(r.detected, false);
    assert.equal(r.blockNumber, null);
  });
});
