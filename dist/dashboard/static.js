"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveStatic = serveStatic;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const FILES = {
    "/": { file: "index.html", type: "text/html; charset=utf-8" },
    "/styles.css": { file: "styles.css", type: "text/css; charset=utf-8" },
    "/app.js": { file: "app.js", type: "text/javascript; charset=utf-8" },
};
/** Serve solo i file in whitelist: nessun path dell'utente raggiunge il filesystem. */
async function serveStatic(publicDir, pathname, res) {
    const entry = FILES[pathname];
    if (entry === undefined)
        return false;
    const content = await (0, promises_1.readFile)(node_path_1.default.join(publicDir, entry.file));
    res.writeHead(200, { "content-type": entry.type });
    res.end(content);
    return true;
}
