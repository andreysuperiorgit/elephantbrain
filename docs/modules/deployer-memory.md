# Deployer Memory

![Deployer Memory](../../assets/05-names.jpg)

*Recognising an individual, even under a new name.*

For the address behind a token: every launch memory has seen from it and
how each ended, how long the address has been around, and the addresses
it keeps company with.

| link | how it is found | confidence |
|:--|:--|:--|
| funder / funded | a recorded funding transfer between them | 0.80 |
| sibling | both were funded by the same wallet | 0.60 |
| crew | bought early on two or more of its launches | 0.35 → 0.80 |
| deployer | other launches drew the same early buyers | 0.30 → 0.75 |

When an address is linked in more than one way, the evidence combines —
`1 − (1−a)(1−b)`, capped at 0.95 — and every reason is shown. Keeping only
the first reason would hide the stronger one.

A pattern is named from the record: `no history`, `unsettled`, `mixed`,
`mostly died`, `serial`, `track record`.

> Connection between addresses is probabilistic, not forensic.

## Where it lives

```
src/modules/deployer-memory/
  index.js — traceDeployer()
  history.js — launches and early buyers
  pattern.js — naming the record
```

Back to the overview: [ELEPHANTBRAIN](../ELEPHANTBRAIN.md)
