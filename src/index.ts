import { bookingSchedule, targetDate } from "./config.js";
import { sendTelegram } from "./telegram.js";
import {
  AuthError,
  bookAdmission,
  fetchAdmissions,
  fetchTicket,
} from "./timp.js";

async function main(): Promise<void> {
  const schedule = bookingSchedule();
  const timestamp = new Date().toLocaleString("it-IT", {
    timeZone: "Europe/Rome",
  });

  if (schedule === null) {
    console.log(`[${timestamp}] Domenica: nessuna sessione da prenotare.`);
    return;
  }

  const date = targetDate();
  console.log(
    `[${timestamp}] Avvio prenotazione per il ${date} (oggi + 7 giorni) — apertura prenotazioni: ${schedule.openTime}`,
  );

  // 1. Recupera le sessioni disponibili nella data target
  const admissions = await fetchAdmissions(date);

  if (admissions.length === 0) {
    const msg = `⚠️ Nessuna sessione disponibile il ${date}`;
    console.log(msg);
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
    await sendTelegram(msg);
    return;
  }

  console.log(`Prenotazione effettuata. Ticket ID: ${result.ticketId}`);

  // 4. Verifica ticket
  const ticket = await fetchTicket(result.ticketId);

  const msg = `✅ Prenotazione confermata!\n📅 Data: ${date}\n⏰ Sessione: ${available.sessionTime}\n🎫 Ticket: ${ticket.id}\n📋 Stato: ${ticket.status}`;
  console.log(msg);
  await sendTelegram(msg);
}

main().catch(async (err) => {
  const isAuth = err instanceof AuthError;
  const msg = isAuth
    ? `🔴 ${err.message}`
    : `❌ Errore inatteso: ${err instanceof Error ? err.message : String(err)}`;
  console.error(msg);
  await sendTelegram(msg).catch(() => {});
  process.exit(1);
});
