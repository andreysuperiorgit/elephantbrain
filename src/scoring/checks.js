/**
 * Points for each of the six checks. One function per check, so each rule
 * can be read, tested and changed on its own.
 */

import {
  SCORE_WEIGHTS as W,
  HOLDER_CONCENTRATION_DANGER,
  HOLDER_CONCENTRATION_WARNING,
  MIN_LP_BURN_PERCENT,
} from "../config/index.js";

/** Can the creator print more supply? */
export const mintAuthority = (c) => (c.mintAuthorityRevoked ? W.mintAuthority : 0);

/** Can the creator freeze your wallet? */
export const freezeAuthority = (c) => (c.freezeAuthorityRevoked ? W.freezeAuthority : 0);

/** How concentrated is the supply? Partial credit between the two thresholds. */
export function topHolderConc(c) {
  const p = c.topHolderPercent;
  if (p <= HOLDER_CONCENTRATION_WARNING) return W.topHolderConc;
  if (p <= HOLDER_CONCENTRATION_DANGER) {
    const ratio = (p - HOLDER_CONCENTRATION_WARNING) /
      (HOLDER_CONCENTRATION_DANGER - HOLDER_CONCENTRATION_WARNING);
    return Math.round(W.topHolderConc * (1 - ratio * 0.7));
  }
  return 0;
}

/** Were the first buys coordinated? */
export const bundleDetected = (c) => (c.bundleDetected ? 0 : W.bundleDetected);

/** Can the liquidity be pulled? */
export function lpStatus(c) {
  if (c.lpBurnPercent >= MIN_LP_BURN_PERCENT) return W.lpStatus;
  if (c.lpBurnPercent > 0.5) return Math.round(W.lpStatus * 0.5);
  return 0;
}

/** Anything odd in name, supply or bytecode? Three points per warning. */
export function metadataFlags(c) {
  const penalty = Math.min((c.metadataWarnings?.length || 0) * 3, W.metadataFlags);
  return W.metadataFlags - penalty;
}

export const CHECKS = {
  mintAuthority, freezeAuthority, topHolderConc, bundleDetected, lpStatus, metadataFlags,
};
