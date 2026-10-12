import { z } from "zod";

export const historyOutcomeSchema = z.enum([
  "booked",
  "already_booked",
  "full",
  "no_sessions",
  "error",
]);

export const historyEntrySchema = z.object({
  at: z.iso.datetime(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  outcome: historyOutcomeSchema,
  message: z.string(),
  sessionTime: z.string().optional(),
  ticketId: z.string().optional(),
});

export const historyFileSchema = z.array(historyEntrySchema);
