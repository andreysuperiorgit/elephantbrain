/**
 * The score: six checks summed, then moved by memory, then banded.
 */

import { CHECKS } from "./checks.js";
import { verdictFor } from "./verdict.js";

export function calculateScore(checks) {
  const breakdown = {};
  for (const [name, fn] of Object.entries(CHECKS)) breakdown[name] = fn(checks);

  const baseScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // memory attaches { adjustment, reasons } to the scan; bounded at ±25 upstream
  const adjustment = checks.memory?.adjustment || 0;
  const score = Math.max(0, Math.min(100, baseScore + adjustment));

  return {
    baseScore,
    memoryAdjustment: adjustment,
    memoryReasons: checks.memory?.reasons || [],
    score,
    finalScore: score,
    breakdown,
    verdict: verdictFor(score),
  };
}
