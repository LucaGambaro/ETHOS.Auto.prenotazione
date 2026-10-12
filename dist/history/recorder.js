"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordHistory = recordHistory;
/**
 * Registra un esito nello storico. Non lancia mai: un errore di scrittura dello storico
 * non deve far fallire la prenotazione, viene solo loggato.
 */
async function recordHistory(store, input, now = new Date()) {
    try {
        await store.append({ ...input, at: now.toISOString() });
    }
    catch (err) {
        console.error(`[History] Impossibile salvare lo storico: ${err instanceof Error ? err.message : String(err)}`);
    }
}
