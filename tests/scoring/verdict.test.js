import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { verdictFor, VERDICT_BANDS, CHECKS } from "../../src/scoring/index.js";
import { SCORE_WEIGHTS } from "../../src/config/index.js";

describe("verdict bands", () => {
  it("draws the lines at 80, 60 and 40", () => {
    assert.equal(verdictFor(100), "SAFE");
    assert.equal(verdictFor(80), "SAFE");
    assert.equal(verdictFor(79), "CAUTION");
    assert.equal(verdictFor(60), "CAUTION");
    assert.equal(verdictFor(59), "WARNING");
    assert.equal(verdictFor(40), "WARNING");
    assert.equal(verdictFor(39), "DANGER");
    assert.equal(verdictFor(0), "DANGER");
  });

  it("covers every score from 0 to 100", () => {
    for (let s = 0; s <= 100; s++) assert.ok(VERDICT_BANDS.some((b) => s >= b.min));
  });
});

describe("the six checks", () => {
  it("weights add up to 100", () => {
    assert.equal(Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0), 100);
  });

  it("has one scoring rule per weight", () => {
    assert.deepEqual(Object.keys(CHECKS).sort(), Object.keys(SCORE_WEIGHTS).sort());
  });

  it("gives partial credit between the concentration thresholds", () => {
    const full = CHECKS.topHolderConc({ topHolderPercent: 0.10 });
    const mid = CHECKS.topHolderConc({ topHolderPercent: 0.22 });
    const none = CHECKS.topHolderConc({ topHolderPercent: 0.50 });
    assert.equal(full, SCORE_WEIGHTS.topHolderConc);
    assert.ok(mid > 0 && mid < full);
    assert.equal(none, 0);
  });

  it("takes three points per metadata warning, never below zero", () => {
    assert.equal(CHECKS.metadataFlags({ metadataWarnings: ["a"] }), SCORE_WEIGHTS.metadataFlags - 3);
    assert.equal(CHECKS.metadataFlags({ metadataWarnings: Array(10).fill("x") }), 0);
  });
});
