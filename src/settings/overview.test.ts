import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDayViews, nextBooking } from "./overview.js";
import { defaultSettings } from "./store.js";
import type { Settings } from "./types.js";

function only(...days: (keyof Settings["days"])[]): Settings {
  const settings = defaultSettings();
  for (const key of Object.keys(settings.days) as (keyof Settings["days"])[]) {
    settings.days[key] = days.includes(key);
  }
  return settings;
}

describe("buildDayViews", () => {
  it("combina giorni, orari e stato", () => {
    const views = buildDayViews(only("tue"));
    assert.equal(views.length, 6);
    assert.deepEqual(views[1], { key: "tue", label: "Martedì", openTime: "13:00", enabled: true });
    assert.equal(views[0]?.enabled, false);
  });
});

describe("nextBooking", () => {
  it("oggi se l'apertura non è ancora passata", () => {
    // lunedì 12/10/2026 06:00 Roma, apertura 08:00
    const next = nextBooking(only("mon"), new Date("2026-10-12T04:00:00Z"));
    assert.equal(next?.runDate, "2026-10-12");
    assert.equal(next?.targetDate, "2026-10-19");
    assert.equal(next?.openTime, "08:00");
  });

  it("salta oggi se l'apertura è già passata", () => {
    const next = nextBooking(only("mon"), new Date("2026-10-12T10:00:00Z"));
    assert.equal(next?.runDate, "2026-10-19");
    assert.equal(next?.weekday, "mon");
  });

  it("sceglie il primo giorno attivo successivo e salta le domeniche", () => {
    // sabato 17/10 tardi → domenica ignorata → lunedì 19
    const next = nextBooking(only("mon", "sat"), new Date("2026-10-17T12:00:00Z"));
    assert.equal(next?.weekday, "mon");
    assert.equal(next?.runDate, "2026-10-19");
    assert.equal(next?.label, "Lunedì");
  });

  it("restituisce null se nessun giorno è attivo", () => {
    assert.equal(nextBooking(only(), new Date("2026-10-12T04:00:00Z")), null);
  });
});
