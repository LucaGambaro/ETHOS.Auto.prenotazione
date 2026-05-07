import "dotenv/config";

export const config = {
  timpApiKey: process.env.TIMP_API_KEY ?? "",
  timpApiToken: process.env.TIMP_API_TOKEN ?? "",
  timpActivityId: process.env.TIMP_ACTIVITY_ID ?? "",
  timpEmail: process.env.TIMP_EMAIL ?? "",
  timpPassword: process.env.TIMP_PASSWORD ?? "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  timpBaseUrl: "https://panel.timp.pro/api/user_app/v2",
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
  // Calcola il giorno della settimana corrente in Europe/Rome
  const dayName = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    weekday: "short",
  }).format(new Date()); // "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"

  switch (dayName) {
    case "Mon":
    case "Wed":
    case "Fri":
      return { openTime: "08:00", hour: 8, minute: 0 };
    case "Tue":
    case "Thu":
      return { openTime: "13:00", hour: 13, minute: 0 };
    case "Sat":
      return { openTime: "06:00", hour: 6, minute: 0 };
    default: // "Sun"
      return null;
  }
}
