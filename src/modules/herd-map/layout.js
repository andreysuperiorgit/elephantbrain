export /**
 * Deterministic 3D placement: clusters spread on a sphere, members around
 * their cluster's centre, loose wallets on an outer shell. The dashboard
 * can draw it directly; the same input always gives the same picture.
 */
function layout(nodes, groups) {
  const pos = {};
  const golden = Math.PI * (3 - Math.sqrt(5));
  const inCluster = new Map();
  groups.forEach((g, gi) => g.forEach((w) => inCluster.set(w, gi)));

  groups.forEach((g, gi) => {
    const y = 1 - (2 * (gi + 0.5)) / Math.max(1, groups.length);
    const r = Math.sqrt(1 - y * y);
    const cx = Math.cos(gi * golden) * r * 6;
    const cy = y * 6;
    const cz = Math.sin(gi * golden) * r * 6;
    g.forEach((w, k) => {
      const a = k * golden;
      const rr = 0.9 + 0.25 * Math.sqrt(k);
      pos[w] = { x: cx + Math.cos(a) * rr, y: cy + ((k % 3) - 1) * 0.35, z: cz + Math.sin(a) * rr };
    });
  });
  const loose = nodes.filter((w) => !inCluster.has(w));
  loose.forEach((w, k) => {
    const y = 1 - (2 * (k + 0.5)) / Math.max(1, loose.length);
    const r = Math.sqrt(1 - y * y);
    pos[w] = { x: Math.cos(k * golden) * r * 11, y: y * 11, z: Math.sin(k * golden) * r * 11 };
  });
  return pos;
}
