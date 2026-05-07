"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_js_1 = require("./auth.js");
const config_js_1 = require("./config.js");
const telegram_js_1 = require("./telegram.js");
const timp_js_1 = require("./timp.js");
async function book() {
    const date = (0, config_js_1.targetDate)();
    // 1. Recupera le sessioni disponibili nella data target
    const admissions = await (0, timp_js_1.fetchAdmissions)(date);
    if (admissions.length === 0) {
        const msg = `⚠️ Nessuna sessione disponibile il ${date}`;
        console.log(msg);
        await (0, telegram_js_1.sendTelegram)(msg);
        return;
    }
    // 2. Prima sessione con posti liberi
    const available = admissions.find((a) => (a.raw.available_spots ?? a.raw.remaining_slots ?? a.raw.available ?? 1) >
        0 && !(a.raw.is_booked ?? false));
    if (!available) {
        const msg = `⚠️ Tutte le sessioni del ${date} sono al completo o già prenotate`;
        console.log(msg);
        await (0, telegram_js_1.sendTelegram)(msg);
        return;
    }
    console.log(`Sessione trovata: ID ${available.id} alle ${available.sessionTime}`);
    // 3. Prenotazione
    const result = await (0, timp_js_1.bookAdmission)(available);
    if (result === null) {
        const msg = `ℹ️ Sessione già prenotata (${date} ${available.sessionTime})`;
        console.log(msg);
        await (0, telegram_js_1.sendTelegram)(msg);
        return;
    }
    console.log(`Prenotazione effettuata. Ticket ID: ${result.ticketId}`);
    // 4. Verifica ticket
    const ticket = await (0, timp_js_1.fetchTicket)(result.ticketId);
    const msg = `✅ Prenotazione confermata!\n📅 Data: ${date}\n⏰ Sessione: ${available.sessionTime}\n🎫 Ticket: ${ticket.id}\n📋 Stato: ${ticket.status}`;
    console.log(msg);
    await (0, telegram_js_1.sendTelegram)(msg);
}
async function main() {
    const schedule = (0, config_js_1.bookingSchedule)();
    const timestamp = new Date().toLocaleString("it-IT", {
        timeZone: "Europe/Rome",
    });
    if (schedule === null) {
        console.log(`[${timestamp}] Domenica: nessuna sessione da prenotare.`);
        return;
    }
    console.log(`[${timestamp}] Avvio prenotazione per il ${(0, config_js_1.targetDate)()} (oggi + 7 giorni) — apertura prenotazioni: ${schedule.openTime}`);
    try {
        await book();
    }
    catch (err) {
        if (err instanceof timp_js_1.AuthError) {
            // Token scaduto: re-login e un secondo tentativo
            const newToken = await (0, auth_js_1.refreshToken)();
            await (0, telegram_js_1.sendTelegram)(`🔄 Token TIMP rinnovato automaticamente. Nuovo tentativo di prenotazione in corso...`);
            console.log(`[Auth] Nuovo token: ${newToken.slice(0, 8)}...`);
            await book();
        }
        else {
            throw err;
        }
    }
}
main().catch(async (err) => {
    const msg = err instanceof timp_js_1.AuthError
        ? `🔴 Re-login fallito: ${err.message}`
        : `❌ Errore inatteso: ${err instanceof Error ? err.message : String(err)}`;
    console.error(msg);
    await (0, telegram_js_1.sendTelegram)(msg).catch(() => { });
    process.exit(1);
});
