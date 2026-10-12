import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { recordHistory } from "./recorder.js";
import type { HistoryStore } from "./store.js";
import type { HistoryEntry } from "./types.js";

describe("recordHistory", () => {
  it("aggiunge il timestamp e salva", async () => {
    const saved: HistoryEntry[] = [];
    const store: HistoryStore = {
      list: async () => [],
      append: async (e) => {
        saved.push(e);
      },
    };
    await recordHistory(
      store,
      { targetDate: "2026-10-19", outcome: "full", message: "x" },
      new Date("2026-10-12T08:00:00Z"),
    );
    assert.deepEqual(saved, [
      { at: "2026-10-12T08:00:00.000Z", targetDate: "2026-10-19", outcome: "full", message: "x" },
    ]);
  });

  it("non lancia se la scrittura fallisce, logga soltanto", async () => {
    const error = mock.method(console, "error", () => {});
    const store: HistoryStore = {
      list: async () => [],
      append: async () => {
        throw new Error("disco pieno");
      },
    };
    await recordHistory(store, { targetDate: "2026-10-19", outcome: "error", message: "x" });
    assert.equal(error.mock.callCount(), 1);
    error.mock.restore();
  });
});
