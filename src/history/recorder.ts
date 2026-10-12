import type { HistoryStore } from "./store.js";
import type { HistoryEntry } from "./types.js";

export type HistoryEntryInput = Omit<HistoryEntry, "at">;

/**
 * Registra un esito nello storico. Non lancia mai: un errore di scrittura dello storico
 * non deve far fallire la prenotazione, viene solo loggato.
 */
export async function recordHistory(
  store: HistoryStore,
  input: HistoryEntryInput,
  now: Date = new Date(),
): Promise<void> {
  try {
    await store.append({ ...input, at: now.toISOString() });
  } catch (err) {
    console.error(
      `[History] Impossibile salvare lo storico: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
