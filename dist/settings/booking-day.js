"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBookingEnabled = isBookingEnabled;
const days_js_1 = require("./days.js");
/** True se oggi (Europe/Rome) è un giorno con sessioni e l'utente ha chiesto di prenotarlo. */
function isBookingEnabled(settings, now) {
    const key = (0, days_js_1.weekdayKey)(now);
    return key !== "sun" && settings.days[key];
}
