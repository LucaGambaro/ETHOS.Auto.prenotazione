import type { IncomingMessage, ServerResponse } from "node:http";

const MAX_BODY_BYTES = 16 * 1024;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function sendJson(
  res: ServerResponse,
  status: number,
  body: object,
): void {
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
export async function readJsonBody(req: IncomingMessage): Promise<object> {
  if (!req.headers["content-type"]?.startsWith("application/json")) {
    throw new HttpError(415, "Content-Type deve essere application/json");
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buf.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "Body troppo grande");
    chunks.push(buf);
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (typeof parsed !== "object" || parsed === null) {
      throw new HttpError(400, "Il body deve essere un oggetto JSON");
    }
    return parsed;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, "JSON non valido");
  }
}
