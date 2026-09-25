import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lc, short } from "../../src/utils/address.js";

describe("address helpers", () => {
  it("lowercases, and leaves empty values alone", () => {
    assert.equal(lc("0xABCdef"), "0xabcdef");
    assert.equal(lc(null), null);
    assert.equal(lc(""), "");
  });

  it("shortens for display", () => {
    assert.equal(short("0x1234567890abcdef1234567890abcdef12345678"), "0x123456…5678");
    assert.equal(short(null), "—");
  });
});
