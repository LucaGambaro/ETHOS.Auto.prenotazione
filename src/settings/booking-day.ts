import { weekdayKey } from "./days.js";
import type { Settings } from "./types.js";

/** True se oggi (Europe/Rome) è un giorno con sessioni e l'utente ha chiesto di prenotarlo. */
export function isBookingEnabled(settings: Settings, now: Date): boolean {
  const key = weekdayKey(now);
  return key !== "sun" && settings.days[key];
}
