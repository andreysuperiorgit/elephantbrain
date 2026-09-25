/**
 * The HTTP API and the live WebSocket stream.
 *
 *   pipeline.js   one scan, start to finish
 *   ws.js         the /ws event stream
 *   monitors.js   live launches → auto-scan → dashboard
 *   routes/       one file per group of endpoints
 */

import express from "express";
import http from "http";
import { attachWebSocket } from "./ws.js";
import { wireMonitors } from "./monitors.js";
import { registerRoutes } from "./routes/index.js";

export function createServer(monitors = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  const server = http.createServer(app);
  const { broadcast } = attachWebSocket(server);

  wireMonitors(monitors, broadcast);
  registerRoutes(app, { broadcast, monitors });

  return { app, server, broadcast };
}
