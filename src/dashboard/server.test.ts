import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it, mock } from "node:test";
import { createHistoryStore } from "../history/store.js";
import { createSettingsStore } from "../settings/store.js";
import { createDashboardServer } from "./server.js";
import type { Overview } from "./types.js";

let baseUrl = "";
let close: () => Promise<void>;
let publicDir = "";
let dataDir = "";

before(async () => {
  dataDir = await mkdtemp(path.join(os.tmpdir(), "dash-data-"));
  publicDir = await mkdtemp(path.join(os.tmpdir(), "dash-public-"));
  for (const f of ["index.html", "styles.css", "app.js"]) {
    await writeFile(path.join(publicDir, f), `content of ${f}`);
  }
  const server = createDashboardServer({
    settingsStore: createSettingsStore(path.join(dataDir, "settings.json")),
    historyStore: createHistoryStore(path.join(dataDir, "history.json")),
    now: () => new Date("2026-10-12T04:00:00Z"),
    publicDir,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => new Promise((resolve) => server.close(() => resolve()));
});

after(() => close());

function put(body: string, contentType = "application/json"): Promise<Response> {
  return fetch(`${baseUrl}/api/settings`, {
    method: "PUT",
    headers: { "content-type": contentType },
    body,
  });
}

describe("dashboard server", () => {
  it("GET /api/overview restituisce giorni, prossima prenotazione e storico", async () => {
    const res = await fetch(`${baseUrl}/api/overview`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as Overview;
    assert.equal(body.days.length, 6);
    assert.equal(body.next?.runDate, "2026-10-12");
    assert.deepEqual(body.history, []);
  });

  it("PUT /api/settings salva e restituisce l'overview aggiornata", async () => {
    const days = { mon: false, tue: true, wed: true, thu: true, fri: true, sat: true };
    const res = await put(JSON.stringify({ days }));
    assert.equal(res.status, 200);
    const body = (await res.json()) as Overview;
    assert.equal(body.days[0]?.enabled, false);
    assert.equal(body.next?.weekday, "tue");

    const again = (await (await fetch(`${baseUrl}/api/overview`)).json()) as Overview;
    assert.equal(again.days[0]?.enabled, false);
  });

  it("PUT con payload non valido → 400", async () => {
    assert.equal((await put(JSON.stringify({ days: { mon: 1 } }))).status, 400);
  });

  it("PUT con JSON malformato → 400", async () => {
    assert.equal((await put("{ no")).status, 400);
  });

  it("PUT con body non oggetto → 400", async () => {
    assert.equal((await put("42")).status, 400);
  });

  it("PUT senza content-type JSON → 415", async () => {
    assert.equal((await put("{}", "text/plain")).status, 415);
  });

  it("PUT con body troppo grande → 413", async () => {
    assert.equal((await put(JSON.stringify({ pad: "x".repeat(20_000) }))).status, 413);
  });

  it("serve gli asset statici in whitelist", async () => {
    const html = await fetch(`${baseUrl}/`);
    assert.equal(html.status, 200);
    assert.match(html.headers.get("content-type") ?? "", /text\/html/);
    assert.equal(await html.text(), "content of index.html");
    assert.match((await fetch(`${baseUrl}/styles.css`)).headers.get("content-type") ?? "", /css/);
    assert.match((await fetch(`${baseUrl}/app.js`)).headers.get("content-type") ?? "", /javascript/);
  });

  it("non serve path fuori whitelist → 404", async () => {
    assert.equal((await fetch(`${baseUrl}/../package.json`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/api/unknown`)).status, 404);
  });

  it("errori inattesi → 500 senza dettagli", async () => {
    const error = mock.method(console, "error", () => {});
    await writeFile(path.join(dataDir, "settings.json"), "{ corrotto");
    const res = await fetch(`${baseUrl}/api/overview`);
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: "Errore interno" });
    error.mock.restore();
  });
});
