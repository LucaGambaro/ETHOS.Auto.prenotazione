import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DAYS, findDay, weekdayKey } from "./days.js";

describe("weekdayKey", () => {
  it("restituisce il giorno in Europe/Rome", () => {
    assert.equal(weekdayKey(new Date("2026-10-12T10:00:00Z")), "mon");
    assert.equal(weekdayKey(new Date("2026-10-17T10:00:00Z")), "sat");
    assert.equal(weekdayKey(new Date("2026-10-18T10:00:00Z")), "sun");
  });

  it("usa il fuso di Roma e non UTC", () => {
    // 23:30 UTC di domenica è già lunedì a Roma (UTC+2 in ottobre)
    assert.equal(weekdayKey(new Date("2026-10-11T23:30:00Z")), "mon");
  });
});

describe("findDay", () => {
  it("trova orario di apertura", () => {
    assert.equal(findDay("sat")?.openTime, "06:00");
    assert.equal(findDay("tue")?.openTime, "13:00");
  });

  it("restituisce null per la domenica", () => {
    assert.equal(findDay("sun"), null);
  });

  it("espone 6 giorni", () => {
    assert.equal(DAYS.length, 6);
  });
});
