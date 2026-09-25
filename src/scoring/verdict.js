/**
 * Where a final score lands. The bands are the only place the words SAFE,
 * CAUTION, WARNING and DANGER are decided.
 */

export const VERDICT_BANDS = [
  { min: 80, verdict: "SAFE" },
  { min: 60, verdict: "CAUTION" },
  { min: 40, verdict: "WARNING" },
  { min: 0, verdict: "DANGER" },
];

export function verdictFor(score) {
  return VERDICT_BANDS.find((b) => score >= b.min).verdict;
}
