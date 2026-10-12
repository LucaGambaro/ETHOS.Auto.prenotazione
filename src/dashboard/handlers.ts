import type { IncomingMessage, ServerResponse } from "node:http";
import type { HistoryStore } from "../history/store.js";
import { settingsSchema } from "../settings/schema.js";
import { buildDayViews, nextBooking } from "../settings/overview.js";
import type { SettingsStore } from "../settings/store.js";
import { HttpError, readJsonBody, sendJson } from "./http-utils.js";
import type { Overview } from "./types.js";

export interface HandlerDeps {
  settingsStore: SettingsStore;
  historyStore: HistoryStore;
  now: () => Date;
}

const HISTORY_LIMIT = 30;

async function buildOverview(deps: HandlerDeps): Promise<Overview> {
  const [settings, history] = await Promise.all([
    deps.settingsStore.load(),
    deps.historyStore.list(HISTORY_LIMIT),
  ]);
  return {
    days: buildDayViews(settings),
    next: nextBooking(settings, deps.now()),
    history,
  };
}

export async function getOverview(
  deps: HandlerDeps,
  _req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  sendJson(res, 200, await buildOverview(deps));
}

export async function putSettings(
  deps: HandlerDeps,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const parsed = settingsSchema.safeParse(await readJsonBody(req));
  if (!parsed.success) {
    throw new HttpError(400, "Impostazioni non valide");
  }
  await deps.settingsStore.save(parsed.data);
  sendJson(res, 200, await buildOverview(deps));
}
