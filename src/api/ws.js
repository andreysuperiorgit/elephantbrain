/**
 * The live event stream at /ws. Everything the dashboard shows as it
 * happens — new launches, scan results, alerts — goes out through here.
 */

import { WebSocketServer } from "ws";
import { createLogger } from "../utils/logger.js";

const log = createLogger("ws");

export function attachWebSocket(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });
  const clients = new Set();

  wss.on("connection", (ws) => {
    clients.add(ws);
    log.info(`client connected (${clients.size})`);
    ws.on("close", () => clients.delete(ws));
  });

  function broadcast(type, data) {
    const msg = JSON.stringify({ type, data, timestamp: Date.now() });
    for (const c of clients) if (c.readyState === 1) c.send(msg);
  }

  return { wss, clients, broadcast };
}
