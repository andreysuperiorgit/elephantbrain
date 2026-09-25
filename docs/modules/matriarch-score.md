# Matriarch Score

![Matriarch Score](../../assets/04-herd.jpg)

*Experience, as a number that draws attention.*

| component | measures | weight |
|:--|:--|:--|
| age | days on chain, or in memory if the chain age is unknown | 25 |
| breadth | how many tokens it has touched | 20 |
| survival | of its tokens that settled, how many survived | 35 |
| conduct | first-block buys into tokens that died; flags | 20 |

Fewer than three settled outcomes is neutral for survival — not good, not
bad. A wallet flagged `known_rugger` is capped at 15.

`MATRIARCH` 80+ · `ELDER` 60–79 · `HERD` 40–59 · `CALF` under 40 ·
`OUTSIDER` flagged. Each score reports its confidence: `thin record`,
`partial` or `solid`.

> It is a number designed to draw your attention, not to replace your
> judgment.

## Where it lives

```
src/modules/matriarch/
  index.js — matriarchScore()
  bands.js — weights and band names
```

Back to the overview: [ELEPHANTBRAIN](../ELEPHANTBRAIN.md)
