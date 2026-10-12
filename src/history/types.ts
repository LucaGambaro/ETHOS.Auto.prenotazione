import type { z } from "zod";
import type { historyEntrySchema, historyOutcomeSchema } from "./schema.js";

export type HistoryEntry = z.infer<typeof historyEntrySchema>;
export type HistoryOutcome = z.infer<typeof historyOutcomeSchema>;
