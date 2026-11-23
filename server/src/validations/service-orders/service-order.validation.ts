import { z } from "zod";

// CREATE SERVICE ORDER (CUSTOMER)
export const createServiceOrderSchema = z.object({
  vehicleId: z
    .number()
    .int("Vehicle ID must be an integer")
    .positive("Invalid vehicle ID"),

  complaint: z
    .string()
    .trim()
    .min(5, "Complaint must be at least 5 characters")
    .max(1000, "Complaint must not exceed 1000 characters"),

  mileage: z
    .number()
    .int("Mileage must be an integer")
    .nonnegative("Mileage must not be negative"),
});

// APPROVE OR REJECT ESTIMATE (CUSTOMER)
export const estimateDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
});

// SERVICE ORDER ID
export const serviceOrderIdSchema = z.object({
  id: z.coerce.number<number>().int().positive(),
});
