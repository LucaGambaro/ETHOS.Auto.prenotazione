import { z } from "zod";

export const settingsSchema = z
  .object({
    days: z
      .object({
        mon: z.boolean(),
        tue: z.boolean(),
        wed: z.boolean(),
        thu: z.boolean(),
        fri: z.boolean(),
        sat: z.boolean(),
      })
      .strict(),
  })
  .strict();
