"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverview = getOverview;
exports.putSettings = putSettings;
const schema_js_1 = require("../settings/schema.js");
const overview_js_1 = require("../settings/overview.js");
const http_utils_js_1 = require("./http-utils.js");
const HISTORY_LIMIT = 30;
async function buildOverview(deps) {
    const [settings, history] = await Promise.all([
        deps.settingsStore.load(),
        deps.historyStore.list(HISTORY_LIMIT),
    ]);
    return {
        days: (0, overview_js_1.buildDayViews)(settings),
        next: (0, overview_js_1.nextBooking)(settings, deps.now()),
        history,
    };
}
async function getOverview(deps, _req, res) {
    (0, http_utils_js_1.sendJson)(res, 200, await buildOverview(deps));
}
async function putSettings(deps, req, res) {
    const parsed = schema_js_1.settingsSchema.safeParse(await (0, http_utils_js_1.readJsonBody)(req));
    if (!parsed.success) {
        throw new http_utils_js_1.HttpError(400, "Impostazioni non valide");
    }
    await deps.settingsStore.save(parsed.data);
    (0, http_utils_js_1.sendJson)(res, 200, await buildOverview(deps));
}
