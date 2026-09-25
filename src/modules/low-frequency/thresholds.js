/** When a movement is worth an alert. Two of these can be set from the environment. */

const HOUR = 3_600_000;
export const DEFAULTS = {
  largeMoveUsd: Number(process.env.EB_LARGE_MOVE_USD || 25_000),
  largeMoveShareOfLiquidity: 0.05,   // or 5% of the pool, whichever is lower
  flowUsd: Number(process.env.EB_FLOW_USD || 15_000),
  flowMinTrades: 3,
  flowWindowMs: HOUR,
  liquidityShiftShare: 0.10,
  cooldownMs: 30 * 60_000,           // one alert per kind per wallet per token
};
