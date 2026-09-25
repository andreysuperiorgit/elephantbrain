/** Addresses are compared lowercase everywhere; this is the one place that does it. */
export const lc = (a) => (a ? String(a).toLowerCase() : a);

/** 0x1234…abcd, for terminals and logs. */
export const short = (a) => (a ? `${a.slice(0, 8)}…${a.slice(-4)}` : "—");
