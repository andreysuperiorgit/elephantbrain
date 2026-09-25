/**
 * ELEPHANTBRAIN · Low-Frequency Alerts
 *
 * Elephants pick up infrasound and ground vibration — signals below the
 * threshold of ordinary attention. The market equivalent is large wallet
 * movement that happens before price action: one big move, a wallet
 * quietly accumulating, a wallet quietly distributing, liquidity leaving.
 *
 * `classify` is pure and decides what a movement means. `observe` records
 * the movement, asks `classify`, and stores whatever it raised.
 *
 * Alert speed depends on the data provider and RPC configuration. It is
 * not instant. It is faster than scrolling a feed.
 */

export { DEFAULTS } from "./thresholds.js";
export { classify } from "./classify.js";
export { observe, recentAlerts } from "./store.js";
