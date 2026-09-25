/**
 * How a report looks in a terminal. Returns strings rather than printing,
 * so the same output can go to a CLI, a log, a bot, or a test.
 */

import { short } from "../utils/address.js";

const PLAIN = { r: "", b: "", dim: "", or: "", red: "", grn: "", yel: "", cyan: "" };
const ANSI = { r: "\x1b[0m", b: "\x1b[1m", dim: "\x1b[90m", or: "\x1b[38;5;214m",
               red: "\x1b[31m", grn: "\x1b[32m", yel: "\x1b[33m", cyan: "\x1b[36m" };

const rule = (C) => C.dim + "─".repeat(64) + C.r;
const head = (C, t) => `\n${C.or}${C.b}${t}${C.r}\n${rule(C)}`;

export function formatReport(rep, { color = true } = {}) {
  const C = color ? ANSI : PLAIN;
  if (!rep.known) return `\n  ${C.yel}${rep.hint}${C.r}\n`;
  const out = [];
  out.push(`\n  ${C.or}${C.b}ELEPHANTBRAIN${C.r}  ${short(rep.token)}  ` +
           `${C.dim}${rep.chain} · ${rep.status}${rep.verdict ? " · " + rep.verdict : ""}${C.r}`);
  out.push(rule(C));
  for (const s of rep.summary) out.push(`  ${s}`);

  const d = rep.deployer;
  out.push(head(C, "DEPLOYER MEMORY"));
  out.push(`  ${short(d.address)}   ${C.b}${d.pattern}${C.r}` +
           (d.age ? `   ${C.dim}${Math.round(d.age.days)}d ${d.age.source}${C.r}` : ""));
  for (const l of d.launches.slice(-8)) {
    const col = l.status === "alive" ? C.grn : ["rugged", "abandoned"].includes(l.status) ? C.red : C.dim;
    out.push(`    ${short(l.token)}  ${col}${(l.status || "").padEnd(9)}${C.r} ${C.dim}${l.verdict || ""}${C.r}`);
  }
  for (const r of d.related.slice(0, 8)) {
    out.push(`  ${C.cyan}${r.confidence.toFixed(2)}${C.r}  ${short(r.address)}  ${C.dim}${r.reason}${C.r}`);
  }

  const h = rep.herd;
  out.push(head(C, "HERD MAP"));
  out.push(`  ${h.nodes.length} wallets · ${h.edges.length} links · ${h.clusters.length} groups`);
  for (const c of h.clusters.slice(0, 5)) {
    out.push(`  group ${c.id}: ${c.size} wallets${c.flagged ? `, ${C.red}${c.flagged} flagged${C.r}` : ""}`);
  }
  for (const e of h.edges.slice(0, 5)) {
    out.push(`    ${short(e.source)} ↔ ${short(e.target)}  ${C.dim}${e.evidence.join("; ")}${C.r}`);
  }

  out.push(head(C, "LOW-FREQUENCY ALERTS"));
  if (!rep.alerts.length) out.push(`  ${C.dim}none on this token${C.r}`);
  for (const a of rep.alerts.slice(0, 8)) out.push(`  ${C.or}${a.kind.padEnd(16)}${C.r} ${a.detail}`);

  out.push(head(C, "MATRIARCH SCORE"));
  out.push(`  average of wallets around it: ${C.b}${rep.matriarch.average ?? "—"}${C.r}`);
  for (const w of rep.matriarch.wallets.slice(0, 6)) {
    out.push(`    ${short(w.wallet)}  ${String(w.score).padStart(3)}  ${w.band.padEnd(9)} ${C.dim}${w.confidence}${C.r}`);
  }
  out.push(`\n  ${C.dim}${rep.notes.join("  ")}${C.r}\n`);
  return out.join("\n");
}

export function formatWallet(m, { color = true } = {}) {
  const C = color ? ANSI : PLAIN;
  const col = m.score >= 60 ? C.grn : m.score >= 40 ? C.yel : C.red;
  const out = [head(C, `MATRIARCH SCORE  ${short(m.wallet)}`)];
  out.push(`  ${col}${C.b}${m.score}${C.r} / 100   ${C.b}${m.band}${C.r}   ${C.dim}${m.confidence}${C.r}\n`);
  for (const [k, v] of Object.entries(m.components)) {
    const bar = "█".repeat(Math.round(v.value * 20)).padEnd(20, "·");
    out.push(`  ${k.padEnd(9)} ${C.or}${bar}${C.r} ${String(v.points).padStart(5)} / ${v.weight}`);
  }
  out.push("");
  for (const r of m.reasons) out.push(`  ${C.dim}·${C.r} ${r}`);
  return out.join("\n");
}

export function formatAlerts(rows, { color = true } = {}) {
  const C = color ? ANSI : PLAIN;
  const out = [head(C, "LOW-FREQUENCY ALERTS")];
  if (!rows.length) out.push(`  ${C.dim}none yet${C.r}`);
  for (const a of rows) {
    const t = new Date(a.createdAt).toISOString().slice(5, 16).replace("T", " ");
    out.push(`  ${C.dim}${t}${C.r}  ${C.or}${a.kind.padEnd(16)}${C.r} ${short(a.token)}  ${a.detail}`);
  }
  return out.join("\n");
}
