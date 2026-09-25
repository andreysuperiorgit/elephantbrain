/** Weights for each component, and the names for score ranges. */

export const WEIGHTS = { age: 25, breadth: 20, survival: 35, conduct: 20 };

export function band(score, flagged) {
  if (flagged) return "OUTSIDER";
  if (score >= 80) return "MATRIARCH";
  if (score >= 60) return "ELDER";
  if (score >= 40) return "HERD";
  return "CALF";
}
