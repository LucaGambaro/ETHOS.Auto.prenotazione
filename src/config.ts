import "dotenv/config";
import path from "node:path";
import { findDay, weekdayKey } from "./settings/days.js";

export const config = {
  timpApiKey: process.env.TIMP_API_KEY ?? "",
  timpApiToken: process.env.TIMP_API_TOKEN ?? "",
  timpActivityId: process.env.TIMP_ACTIVITY_ID ?? "",
  timpEmail: process.env.TIMP_EMAIL ?? "",
  timpPassword: process.env.TIMP_PASSWORD ?? "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  timpBaseUrl: "https://panel.timp.pro/api/user_app/v2",
  // Dati modificabili dalla dashboard (impostazioni e storico); cartella montata come volume in Docker
  dataDir: process.env.DATA_DIR ?? path.resolve(process.cwd(), "data"),
  dashboardHost: process.env.DASHBOARD_HOST ?? "127.0.0.1",
  dashboardPort: Number(process.env.DASHBOARD_PORT ?? 3000),
};

/** Restituisce la data target: oggi + 7 giorni, nel formato YYYY-MM-DD (timezone Europe/Rome). */
export function targetDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Orario di apertura prenotazioni in base al giorno della settimana della sessione target.
 * Poiché il target è sempre oggi + 7 giorni, il giorno della settimana è lo stesso di oggi.
 *
 * Lun / Mer / Ven → 08:00
 * Mar / Gio       → 13:00
 * Sab             → 06:00
 * Dom             → null (nessuna sessione)
 */
export function bookingSchedule(): {
  openTime: string;
  hour: number;
  minute: number;
} | null {
  const day = findDay(weekdayKey(new Date()));
  if (day === null) return null; // Domenica
  return { openTime: day.openTime, hour: day.hour, minute: day.minute };
}
