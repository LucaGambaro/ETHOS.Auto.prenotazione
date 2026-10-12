import { createServer, type Server } from "node:http";
import { HttpError, sendJson } from "./http-utils.js";
import { getOverview, putSettings, type HandlerDeps } from "./handlers.js";
import { serveStatic } from "./static.js";

export interface ServerDeps extends HandlerDeps {
  publicDir: string;
}

export function createDashboardServer(deps: ServerDeps): Server {
  return createServer(async (req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    const method = req.method ?? "GET";

    try {
      if (pathname === "/api/overview" && method === "GET") {
        return await getOverview(deps, req, res);
      }
      if (pathname === "/api/settings" && method === "PUT") {
        return await putSettings(deps, req, res);
      }
      if (method === "GET" && (await serveStatic(deps.publicDir, pathname, res))) {
        return;
      }
      sendJson(res, 404, { error: "Non trovato" });
    } catch (err) {
      if (err instanceof HttpError) {
        sendJson(res, err.status, { error: err.message });
        return;
      }
      console.error("[Dashboard] Errore:", err);
      sendJson(res, 500, { error: "Errore interno" });
    }
  });
}
