import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { createSettingsStore, defaultSettings } from "./store.js";

async function tmpFile(): Promise<string> {
  return path.join(await mkdtemp(path.join(os.tmpdir(), "settings-")), "nested", "settings.json");
}

describe("settings store", () => {
  it("restituisce i default se il file non esiste", async () => {
    const store = createSettingsStore(await tmpFile());
    assert.deepEqual(await store.load(), defaultSettings());
  });

  it("salva e rilegge, creando la cartella", async () => {
    const file = await tmpFile();
    const store = createSettingsStore(file);
    const settings = defaultSettings();
    settings.days.wed = false;
    await store.save(settings);
    assert.deepEqual(await store.load(), settings);
    assert.match(await readFile(file, "utf8"), /"wed": false/);
  });

  it("rifiuta impostazioni non valide in scrittura", async () => {
    const store = createSettingsStore(await tmpFile());
    const invalid = { days: { mon: "si" } } as never;
    await assert.rejects(store.save(invalid));
  });

  it("lancia se il file è corrotto", async () => {
    const file = await tmpFile();
    const store = createSettingsStore(file);
    await store.save(defaultSettings());
    await writeFile(file, "{ non json");
    await assert.rejects(store.load());
  });

  it("rilancia gli errori di lettura diversi da ENOENT", async () => {
    // il percorso è una cartella: readFile fallisce con EISDIR
    const dir = await mkdtemp(path.join(os.tmpdir(), "settings-dir-"));
    await assert.rejects(createSettingsStore(dir).load());
  });
});
