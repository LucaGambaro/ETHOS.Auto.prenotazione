import { readTextIfExists, writeTextAtomic } from "../storage/json-file.js";
import { historyFileSchema } from "./schema.js";
import type { HistoryEntry } from "./types.js";

export const MAX_HISTORY_ENTRIES = 200;

export interface HistoryStore {
  /** Voci dalla più recente alla più vecchia. */
  list(limit?: number): Promise<HistoryEntry[]>;
  append(entry: HistoryEntry): Promise<void>;
}

export function createHistoryStore(filePath: string): HistoryStore {
  async function readAll(): Promise<HistoryEntry[]> {
    const text = await readTextIfExists(filePath);
    if (text === null) return [];
    return historyFileSchema.parse(JSON.parse(text));
  }

  return {
    async list(limit = MAX_HISTORY_ENTRIES) {
      const all = await readAll();
      return all.slice(-limit).reverse();
    },
    async append(entry) {
      const all = await readAll();
      const next = [...all, entry].slice(-MAX_HISTORY_ENTRIES);
      await writeTextAtomic(filePath, `${JSON.stringify(next, null, 2)}\n`);
    },
  };
}
