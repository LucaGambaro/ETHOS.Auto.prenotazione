"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
exports.sendJson = sendJson;
exports.readJsonBody = readJsonBody;
const MAX_BODY_BYTES = 16 * 1024;
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = "HttpError";
    }
}
exports.HttpError = HttpError;
function sendJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "content-length": Buffer.byteLength(payload),
        "cache-control": "no-store",
    });
    res.end(payload);
}
/**
 * Legge e parsa il body JSON. Richiede `content-type: application/json`: un form cross-site
 * non può inviarlo senza preflight CORS, che il server non concede (protezione CSRF).
 */
async function readJsonBody(req) {
    if (!req.headers["content-type"]?.startsWith("application/json")) {
        throw new HttpError(415, "Content-Type deve essere application/json");
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
        size += buf.length;
        if (size > MAX_BODY_BYTES)
            throw new HttpError(413, "Body troppo grande");
        chunks.push(buf);
    }
    try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (typeof parsed !== "object" || parsed === null) {
            throw new HttpError(400, "Il body deve essere un oggetto JSON");
        }
        return parsed;
    }
    catch (err) {
        if (err instanceof HttpError)
            throw err;
        throw new HttpError(400, "JSON non valido");
    }
}
