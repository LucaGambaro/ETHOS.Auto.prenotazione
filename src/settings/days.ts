export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;

export type DayKey = (typeof DAY_KEYS)[number];
export type WeekdayKey = DayKey | "sun";

export interface DayInfo {
  key: DayKey;
  label: string;
  openTime: string;
  hour: number;
  minute: number;
}

/** Giorni con sessioni e orario di apertura prenotazioni (Europe/Rome). La domenica non ha sessioni. */
export const DAYS: readonly DayInfo[] = [
  { key: "mon", label: "Lunedì", openTime: "08:00", hour: 8, minute: 0 },
  { key: "tue", label: "Martedì", openTime: "13:00", hour: 13, minute: 0 },
  { key: "wed", label: "Mercoledì", openTime: "08:00", hour: 8, minute: 0 },
  { key: "thu", label: "Giovedì", openTime: "13:00", hour: 13, minute: 0 },
  { key: "fri", label: "Venerdì", openTime: "08:00", hour: 8, minute: 0 },
  { key: "sat", label: "Sabato", openTime: "06:00", hour: 6, minute: 0 },
];

const WEEKDAY_BY_SHORT_NAME: Record<string, WeekdayKey> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

/** Giorno della settimana di `date` nel fuso Europe/Rome. */
export function weekdayKey(date: Date): WeekdayKey {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    weekday: "short",
  }).format(date);
  return WEEKDAY_BY_SHORT_NAME[short] ?? "sun";
}

export function findDay(key: WeekdayKey): DayInfo | null {
  return DAYS.find((d) => d.key === key) ?? null;
}
