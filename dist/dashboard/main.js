"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const config_js_1 = require("../config.js");
const store_js_1 = require("../history/store.js");
const store_js_2 = require("../settings/store.js");
const server_js_1 = require("./server.js");
// Funziona sia da src/ (tsx) sia da dist/ (node): gli asset statici restano in src/
const publicDir = node_path_1.default.resolve(__dirname, "../../src/dashboard/public");
const server = (0, server_js_1.createDashboardServer)({
    settingsStore: (0, store_js_2.createSettingsStore)(node_path_1.default.join(config_js_1.config.dataDir, "settings.json")),
    historyStore: (0, store_js_1.createHistoryStore)(node_path_1.default.join(config_js_1.config.dataDir, "history.json")),
    now: () => new Date(),
    publicDir,
});
server.listen(config_js_1.config.dashboardPort, config_js_1.config.dashboardHost, () => {
    console.log(`[Dashboard] http://${config_js_1.config.dashboardHost}:${config_js_1.config.dashboardPort}`);
});
