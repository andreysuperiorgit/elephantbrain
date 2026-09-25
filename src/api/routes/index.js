import * as health from "./health.js";
import * as memory from "./memory.js";
import * as scan from "./scan.js";
import * as elephant from "./elephant.js";
import * as monitor from "./monitor.js";

export function registerRoutes(app, ctx) {
  for (const r of [health, memory, scan, elephant, monitor]) r.register(app, ctx);
}
