import { refreshToken } from "./auth.js";
import path from "node:path";
import { bookingSchedule, config, targetDate } from "./config.js";
import { recordHistory } from "./history/recorder.js";
import { createHistoryStore } from "./history/store.js";
import { isBookingEnabled } from "./settings/booking-day.js";
import { createSettingsStore } from "./settings/store.js";
import { sendTelegram } from "./telegram.js";
import {
  AuthError,
  bookAdmission,
  fetchAdmissions,
  fetchTicket,
} from "./timp.js";

const settingsStore = createSettingsStore(
  path.join(config.dataDir, "settings.json"),
);
const historyStore = createHistoryStore(
  path.join(config.dataDir, "history.json"),
);

async function book(): Promise<void> {
  const date = targetDate();

  // 1. Recupera le sessioni disponibili nella data target
  const admissions = await fetchAdmissions(date);

  if (admissions.length === 0) {
    const msg = `⚠️ Nessuna sessione disponibile il ${date}`;
    console.log(msg);
    await recordHistory(historyStore, {
      targetDate: date,
      outcome: "no_sessions",
      message: msg,
    });
    await sendTelegram(msg);
    return;
  }

  // 2. Prima sessione con posti liberi
  const available = admissions.find(
    (a) =>
      (a.raw.available_spots ?? a.raw.remaining_slots ?? a.raw.available ?? 1) >
        0 && !(a.raw.is_booked ?? false),
  );

  if (!available) {
    const msg = `⚠️ Tutte le sessioni del ${date} sono al completo o già prenotate`;
    console.log(msg);
    await recordHistory(historyStore, {
      targetDate: date,
      outcome: "full",
      message: msg,
    });
    await sendTelegram(msg);
    return;
  }

  console.log(
    `Sessione trovata: ID ${available.id} alle ${available.sessionTime}`,
  );

  // 3. Prenotazione
  const result = await bookAdmission(available);

  if (result === null) {
    const msg = `ℹ️ Sessione già prenotata (${date} ${available.sessionTime})`;
    console.log(msg);
    await recordHistory(historyStore, {
      targetDate: date,
      outcome: "already_booked",
      sessionTime: available.sessionTime,
      message: msg,
    });
    await sendTelegram(msg);
    return;
  }

  console.log(`Prenotazione effettuata. Ticket ID: ${result.ticketId}`);

  // 4. Verifica ticket
  const ticket = await fetchTicket(result.ticketId);

  const msg = `✅ Prenotazione confermata!\n📅 Data: ${date}\n⏰ Sessione: ${available.sessionTime}\n🎫 Ticket: ${ticket.id}\n📋 Stato: ${ticket.status}`;
  console.log(msg);
  await recordHistory(historyStore, {
    targetDate: date,
    outcome: "booked",
    sessionTime: available.sessionTime,
    ticketId: String(ticket.id),
    message: msg,
  });
  await sendTelegram(msg);
}

async function main(): Promise<void> {
  const schedule = bookingSchedule();
  const timestamp = new Date().toLocaleString("it-IT", {
    timeZone: "Europe/Rome",
  });

  if (schedule === null) {
    console.log(`[${timestamp}] Domenica: nessuna sessione da prenotare.`);
    return;
  }

  const settings = await settingsStore.load();
  if (!isBookingEnabled(settings, new Date())) {
    console.log(
      `[${timestamp}] Giorno disattivato dalla dashboard: nessuna prenotazione.`,
    );
    return;
  }

  console.log(
    `[${timestamp}] Avvio prenotazione per il ${targetDate()} (oggi + 7 giorni) — apertura prenotazioni: ${schedule.openTime}`,
  );

  try {
    await book();
  } catch (err) {
    if (err instanceof AuthError) {
      // Token scaduto: re-login e un secondo tentativo
      const newToken = await refreshToken();
      await sendTelegram(
        `🔄 Token TIMP rinnovato automaticamente. Nuovo tentativo di prenotazione in corso...`,
      );
      console.log(`[Auth] Nuovo token: ${newToken.slice(0, 8)}...`);
      await book();
    } else {
      throw err;
    }
  }
}

main().catch(async (err) => {
  const msg =
    err instanceof AuthError
      ? `🔴 Re-login fallito: ${err.message}`
      : `❌ Errore inatteso: ${err instanceof Error ? err.message : String(err)}`;
  console.error(msg);
  await recordHistory(historyStore, {
    targetDate: targetDate(),
    outcome: "error",
    message: msg,
  });
  await sendTelegram(msg).catch(() => {});
  process.exit(1);
});
