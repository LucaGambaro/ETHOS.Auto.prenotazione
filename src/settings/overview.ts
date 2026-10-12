import { DAYS, findDay, weekdayKey } from "./days.js";
import type { DayView, NextBooking, Settings } from "./types.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const BOOKING_ADVANCE_DAYS = 7;

function romeDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function romeMinutesOfDay(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return read("hour") * 60 + read("minute");
}

export function buildDayViews(settings: Settings): DayView[] {
  return DAYS.map((d) => ({
    key: d.key,
    label: d.label,
    openTime: d.openTime,
    enabled: settings.days[d.key],
  }));
}

/** Prossima esecuzione dello script che prenoterà una sessione, o null se nessun giorno è attivo. */
export function nextBooking(settings: Settings, now: Date): NextBooking | null {
  const nowMinutes = romeMinutesOfDay(now);
  for (let offset = 0; offset <= 7; offset++) {
    const run = new Date(now.getTime() + offset * DAY_MS);
    const key = weekdayKey(run);
    if (key === "sun" || !settings.days[key]) continue;
    const day = findDay(key);
    if (day === null) continue;
    if (offset === 0 && day.hour * 60 + day.minute <= nowMinutes) continue;
    return {
      weekday: key,
      label: day.label,
      openTime: day.openTime,
      runDate: romeDate(run),
      targetDate: romeDate(
        new Date(run.getTime() + BOOKING_ADVANCE_DAYS * DAY_MS),
      ),
    };
  }
  return null;
}
