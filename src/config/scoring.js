/**
 * The six checks: how many points each is worth (total 100), and the
 * thresholds that decide partial credit. Edit these and scores change;
 * nothing hides behind a model.
 */

export const SCORE_WEIGHTS = {
  mintAuthority: 20,
  freezeAuthority: 15,
  topHolderConc: 20,
  bundleDetected: 20,
  lpStatus: 15,
  metadataFlags: 10,
};

export const HOLDER_CONCENTRATION_DANGER = 0.30;
export const HOLDER_CONCENTRATION_WARNING = 0.15;
export const BUNDLE_TIME_WINDOW_SLOTS = 5;
export const MIN_LP_BURN_PERCENT = 0.95;
