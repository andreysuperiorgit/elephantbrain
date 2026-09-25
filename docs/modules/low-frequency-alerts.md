# Low-Frequency Alerts

*Hearing what travels below ordinary attention.*

| kind | when |
|:--|:--|
| `large_move` | one buy or sell over $25,000, or over 5% of the pool if liquidity is known |
| `accumulation` | three or more buys by one wallet in an hour, net over $15,000 |
| `distribution` | the same, selling |
| `liquidity_shift` | 10% of the pool removed, or over $25,000 |

One alert per kind, per wallet, per token, every 30 minutes. Thresholds
come from `EB_LARGE_MOVE_USD` and `EB_FLOW_USD`. Alerts are broadcast on the
WebSocket as `elephantAlert`.

> Alert speed depends on the data provider and RPC configuration. It is not
> instant. It is faster than scrolling a feed.

## Where it lives

```
src/modules/low-frequency/
  classify.js — what a movement means (pure)
  store.js — observe(), recentAlerts()
  thresholds.js — when a movement is worth an alert
```

Back to the overview: [ELEPHANTBRAIN](../ELEPHANTBRAIN.md)
