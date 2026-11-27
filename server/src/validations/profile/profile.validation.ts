import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(3).max(100).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{9,15}$/, "Invalid phone number")
      .nullable()
      .optional(),
  })
  .strict()
  .refine((data) => data.name !== undefined || data.phone !== undefined, {
    message: "Provide at least one field to update",
  });
