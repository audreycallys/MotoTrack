import { z } from "zod";

// CREATE SERVICE
export const createServiceSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must not exceed 50 characters")
    .regex(
      /^[A-Z0-9_]+$/,
      "Code must use uppercase letters, numbers, or underscores",
    ),

  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .optional(),

  basePrice: z.number().nonnegative("Base price must not be negative"),

  reminderIntervalDays: z
    .number()
    .int("Reminder interval must be an integer")
    .positive("Reminder interval must be greater than zero")
    .nullable()
    .optional(),
});

// UPDATE SERVICE
export const updateServiceSchema = createServiceSchema.partial();

// SERVICE ID
export const serviceIdSchema = z.object({
  id: z.coerce.number<number>().int().positive(),
});
