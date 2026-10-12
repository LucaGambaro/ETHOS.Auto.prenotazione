"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyFileSchema = exports.historyEntrySchema = exports.historyOutcomeSchema = void 0;
const zod_1 = require("zod");
exports.historyOutcomeSchema = zod_1.z.enum([
    "booked",
    "already_booked",
    "full",
    "no_sessions",
    "error",
]);
exports.historyEntrySchema = zod_1.z.object({
    at: zod_1.z.iso.datetime(),
    targetDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    outcome: exports.historyOutcomeSchema,
    message: zod_1.z.string(),
    sessionTime: zod_1.z.string().optional(),
    ticketId: zod_1.z.string().optional(),
});
exports.historyFileSchema = zod_1.z.array(exports.historyEntrySchema);
