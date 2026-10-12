"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsSchema = void 0;
const zod_1 = require("zod");
exports.settingsSchema = zod_1.z
    .object({
    days: zod_1.z
        .object({
        mon: zod_1.z.boolean(),
        tue: zod_1.z.boolean(),
        wed: zod_1.z.boolean(),
        thu: zod_1.z.boolean(),
        fri: zod_1.z.boolean(),
        sat: zod_1.z.boolean(),
    })
        .strict(),
})
    .strict();
