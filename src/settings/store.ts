import { readTextIfExists, writeTextAtomic } from "../storage/json-file.js";
import { settingsSchema } from "./schema.js";
import type { Settings } from "./types.js";

export interface SettingsStore {
  load(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
}

/** Default: tutti i giorni attivi, come il comportamento storico dello script. */
export function defaultSettings(): Settings {
  return {
    days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true },
  };
}

export function createSettingsStore(filePath: string): SettingsStore {
  return {
    async load() {
      const text = await readTextIfExists(filePath);
      if (text === null) return defaultSettings();
      return settingsSchema.parse(JSON.parse(text));
    },
    async save(settings) {
      const valid = settingsSchema.parse(settings);
      await writeTextAtomic(filePath, `${JSON.stringify(valid, null, 2)}\n`);
    },
  };
}
