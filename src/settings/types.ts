import type { z } from "zod";
import type { settingsSchema } from "./schema.js";
import type { DayKey, WeekdayKey } from "./days.js";

export type Settings = z.infer<typeof settingsSchema>;

export interface NextBooking {
  weekday: WeekdayKey;
  label: string;
  openTime: string;
  /** Data in cui parte lo script (YYYY-MM-DD, Europe/Rome). */
  runDate: string;
  /** Data della sessione che verrà prenotata (runDate + 7 giorni). */
  targetDate: string;
}

export interface DayView {
  key: DayKey;
  label: string;
  openTime: string;
  enabled: boolean;
}
