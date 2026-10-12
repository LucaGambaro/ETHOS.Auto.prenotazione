"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSettings = defaultSettings;
exports.createSettingsStore = createSettingsStore;
const json_file_js_1 = require("../storage/json-file.js");
const schema_js_1 = require("./schema.js");
/** Default: tutti i giorni attivi, come il comportamento storico dello script. */
function defaultSettings() {
    return {
        days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true },
    };
}
function createSettingsStore(filePath) {
    return {
        async load() {
            const text = await (0, json_file_js_1.readTextIfExists)(filePath);
            if (text === null)
                return defaultSettings();
            return schema_js_1.settingsSchema.parse(JSON.parse(text));
        },
        async save(settings) {
            const valid = schema_js_1.settingsSchema.parse(settings);
            await (0, json_file_js_1.writeTextAtomic)(filePath, `${JSON.stringify(valid, null, 2)}\n`);
        },
    };
}
