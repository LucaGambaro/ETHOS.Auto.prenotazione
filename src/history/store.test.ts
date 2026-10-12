import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { createHistoryStore, MAX_HISTORY_ENTRIES } from "./store.js";
import type { HistoryEntry } from "./types.js";

async function tmpFile(): Promise<string> {
  return path.join(await mkdtemp(path.join(os.tmpdir(), "history-")), "history.json");
}

function entry(n: number): HistoryEntry {
  return {
    at: new Date(Date.UTC(2026, 9, 1, 0, n)).toISOString(),
    targetDate: "2026-10-19",
    outcome: "booked",
    message: `m${n}`,
  };
}

describe("history store", () => {
  it("è vuoto se il file non esiste", async () => {
    assert.deepEqual(await createHistoryStore(await tmpFile()).list(), []);
  });

  it("elenca dal più recente e rispetta il limite", async () => {
    const store = createHistoryStore(await tmpFile());
    for (const n of [1, 2, 3]) await store.append(entry(n));
    assert.deepEqual((await store.list()).map((e) => e.message), ["m3", "m2", "m1"]);
    assert.deepEqual((await store.list(2)).map((e) => e.message), ["m3", "m2"]);
  });

  it("conserva solo le ultime voci", async () => {
    const store = createHistoryStore(await tmpFile());
    for (let n = 0; n < MAX_HISTORY_ENTRIES + 5; n++) await store.append(entry(n % 59));
    assert.equal((await store.list()).length, MAX_HISTORY_ENTRIES);
  });
});
