"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAYS = exports.DAY_KEYS = void 0;
exports.weekdayKey = weekdayKey;
exports.findDay = findDay;
exports.DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat"];
/** Giorni con sessioni e orario di apertura prenotazioni (Europe/Rome). La domenica non ha sessioni. */
exports.DAYS = [
    { key: "mon", label: "Lunedì", openTime: "08:00", hour: 8, minute: 0 },
    { key: "tue", label: "Martedì", openTime: "13:00", hour: 13, minute: 0 },
    { key: "wed", label: "Mercoledì", openTime: "08:00", hour: 8, minute: 0 },
    { key: "thu", label: "Giovedì", openTime: "13:00", hour: 13, minute: 0 },
    { key: "fri", label: "Venerdì", openTime: "08:00", hour: 8, minute: 0 },
    { key: "sat", label: "Sabato", openTime: "06:00", hour: 6, minute: 0 },
];
const WEEKDAY_BY_SHORT_NAME = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
    Sun: "sun",
};
/** Giorno della settimana di `date` nel fuso Europe/Rome. */
function weekdayKey(date) {
    const short = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Rome",
        weekday: "short",
    }).format(date);
    return WEEKDAY_BY_SHORT_NAME[short] ?? "sun";
}
function findDay(key) {
    return exports.DAYS.find((d) => d.key === key) ?? null;
}
