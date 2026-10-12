import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBookingEnabled } from "./booking-day.js";
import { defaultSettings } from "./store.js";

describe("isBookingEnabled", () => {
  it("è attivo per i giorni abilitati", () => {
    assert.equal(isBookingEnabled(defaultSettings(), new Date("2026-10-12T08:00:00Z")), true);
  });

  it("è disattivo per i giorni disabilitati", () => {
    const settings = defaultSettings();
    settings.days.mon = false;
    assert.equal(isBookingEnabled(settings, new Date("2026-10-12T08:00:00Z")), false);
  });

  it("è sempre disattivo la domenica", () => {
    assert.equal(isBookingEnabled(defaultSettings(), new Date("2026-10-18T08:00:00Z")), false);
  });
});
