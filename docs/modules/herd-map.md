# Herd Map

![Herd Map](../../assets/04-herd.jpg)

*Knowing who travels with whom.*

Around one token, the wallets that move together — across the whole
memory, not just this launch:

- bought within two blocks of each other, on how many tokens
- sold within two blocks of each other, on how many tokens
- drew their first money from the same funder

A pair is counted once per token, however many times it traded, so one
busy block cannot fake a relationship. Edges below weight 2 are dropped;
the rest are grouped into clusters. Every node comes back with a
deterministic 3D position for the dashboard — the same memory always
draws the same herd.

> Similar on-chain behaviour does not prove shared ownership. It raises a
> question worth investigating.

## Where it lives

```
src/modules/herd-map/
  index.js — buildHerd()
  comovement.js — the evidence
  clusters.js — union-find
  layout.js — 3D positions
  weights.js — what each kind of evidence is worth
```

Back to the overview: [ELEPHANTBRAIN](../ELEPHANTBRAIN.md)
