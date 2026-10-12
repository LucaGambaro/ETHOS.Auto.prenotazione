"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_HISTORY_ENTRIES = void 0;
exports.createHistoryStore = createHistoryStore;
const json_file_js_1 = require("../storage/json-file.js");
const schema_js_1 = require("./schema.js");
exports.MAX_HISTORY_ENTRIES = 200;
function createHistoryStore(filePath) {
    async function readAll() {
        const text = await (0, json_file_js_1.readTextIfExists)(filePath);
        if (text === null)
            return [];
        return schema_js_1.historyFileSchema.parse(JSON.parse(text));
    }
    return {
        async list(limit = exports.MAX_HISTORY_ENTRIES) {
            const all = await readAll();
            return all.slice(-limit).reverse();
        },
        async append(entry) {
            const all = await readAll();
            const next = [...all, entry].slice(-exports.MAX_HISTORY_ENTRIES);
            await (0, json_file_js_1.writeTextAtomic)(filePath, `${JSON.stringify(next, null, 2)}\n`);
        },
    };
}
