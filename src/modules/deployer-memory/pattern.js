/** Naming a deployer's record from its counts. */

export const CAVEAT = "Links between addresses are probabilistic, not forensic.";

export function pattern(total, rugged, alive) {
  if (total === 0) return "no history";
  const settled = rugged + alive;
  if (settled === 0) return "unsettled";
  const rate = rugged / settled;
  if (rugged >= 3 && rate >= 0.66) return "serial";
  if (rate >= 0.5) return "mostly died";
  if (alive >= 3 && rate <= 0.2) return "track record";
  return "mixed";
}
