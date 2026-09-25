export /** Union-find over the kept edges. */
function clusters(nodes, edges) {
  const parent = new Map(nodes.map((n) => [n, n]));
  const find = (x) => {
    while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); }
    return x;
  };
  for (const e of edges) {
    const a = find(e.source), b = find(e.target);
    if (a !== b) parent.set(a, b);
  }
  const groups = new Map();
  for (const n of nodes) {
    const r = find(n);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(n);
  }
  return [...groups.values()].filter((g) => g.length >= 2)
    .sort((a, b) => b.length - a.length);
}
