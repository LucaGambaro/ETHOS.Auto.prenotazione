import path from "node:path";
import { config } from "../config.js";
import { createHistoryStore } from "../history/store.js";
import { createSettingsStore } from "../settings/store.js";
import { createDashboardServer } from "./server.js";

// Funziona sia da src/ (tsx) sia da dist/ (node): gli asset statici restano in src/
const publicDir = path.resolve(__dirname, "../../src/dashboard/public");

const server = createDashboardServer({
  settingsStore: createSettingsStore(path.join(config.dataDir, "settings.json")),
  historyStore: createHistoryStore(path.join(config.dataDir, "history.json")),
  now: () => new Date(),
  publicDir,
});

server.listen(config.dashboardPort, config.dashboardHost, () => {
  console.log(
    `[Dashboard] http://${config.dashboardHost}:${config.dashboardPort}`,
  );
});
