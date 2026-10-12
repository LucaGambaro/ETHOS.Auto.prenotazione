"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDashboardServer = createDashboardServer;
const node_http_1 = require("node:http");
const http_utils_js_1 = require("./http-utils.js");
const handlers_js_1 = require("./handlers.js");
const static_js_1 = require("./static.js");
function createDashboardServer(deps) {
    return (0, node_http_1.createServer)(async (req, res) => {
        const { pathname } = new URL(req.url ?? "/", "http://localhost");
        const method = req.method ?? "GET";
        try {
            if (pathname === "/api/overview" && method === "GET") {
                return await (0, handlers_js_1.getOverview)(deps, req, res);
            }
            if (pathname === "/api/settings" && method === "PUT") {
                return await (0, handlers_js_1.putSettings)(deps, req, res);
            }
            if (method === "GET" && (await (0, static_js_1.serveStatic)(deps.publicDir, pathname, res))) {
                return;
            }
            (0, http_utils_js_1.sendJson)(res, 404, { error: "Non trovato" });
        }
        catch (err) {
            if (err instanceof http_utils_js_1.HttpError) {
                (0, http_utils_js_1.sendJson)(res, err.status, { error: err.message });
                return;
            }
            console.error("[Dashboard] Errore:", err);
            (0, http_utils_js_1.sendJson)(res, 500, { error: "Errore interno" });
        }
    });
}
