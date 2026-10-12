import { readFile } from "node:fs/promises";
import type { ServerResponse } from "node:http";
import path from "node:path";

const FILES: Record<string, { file: string; type: string }> = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/styles.css": { file: "styles.css", type: "text/css; charset=utf-8" },
  "/app.js": { file: "app.js", type: "text/javascript; charset=utf-8" },
};

/** Serve solo i file in whitelist: nessun path dell'utente raggiunge il filesystem. */
export async function serveStatic(
  publicDir: string,
  pathname: string,
  res: ServerResponse,
): Promise<boolean> {
  const entry = FILES[pathname];
  if (entry === undefined) return false;
  const content = await readFile(path.join(publicDir, entry.file));
  res.writeHead(200, { "content-type": entry.type });
  res.end(content);
  return true;
}
