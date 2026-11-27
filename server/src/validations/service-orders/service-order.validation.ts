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

// ADMIN INSPECTION
export const inspectServiceOrderSchema = z.object({
  inspectionNotes: z
    .string()
    .trim()
    .min(5, "Inspection notes must be at least 5 characters")
    .max(2000, "Inspection notes must not exceed 2000 characters"),
});

// ADMIN ESTIMATE
export const createEstimateSchema = z.object({
  estimatedTotal: z
    .number()
    .nonnegative("Estimated total must not be negative"),
});

// ADMIN SERVICE PROGRESS
export const serviceProgressSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(5, "Notes must be at least 5 characters")
    .max(2000, "Notes must not exceed 2000 characters"),
});

// FINAL SERVICE COMPLETION
export const completeServiceOrderSchema = z.object({
  finalNotes: z
    .string()
    .trim()
    .min(5, "Final notes must be at least 5 characters")
    .max(2000, "Final notes must not exceed 2000 characters"),

  finalTotal: z.number().nonnegative("Final total must not be negative"),
});

// SERVICE ORDER ITEM
export const serviceOrderItemSchema = z.object({
  serviceId: z
    .number()
    .int("Service ID must be an integer")
    .positive("Invalid service ID")
    .nullable()
    .optional(),

  itemType: z.enum(["service", "part"]),

  name: z
    .string()
    .trim()
    .min(3, "Item name must be at least 3 characters")
    .max(100, "Item name must not exceed 100 characters"),

  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than zero"),

  unitPrice: z
    .number()
    .nonnegative("Unit price must not be negative")
    .refine(
      (value) => Number.isFinite(value),
      "Unit price must be a finite number",
    )
    .refine(
      (value) => Number.isInteger(value * 100),
      "Unit price must have at most 2 decimal places",
    ),
});

// CREATE DETAILED ESTIMATE
export const createDetailedEstimateSchema = z.object({
  items: z
    .array(serviceOrderItemSchema)
    .min(1, "At least one item is required"),
});
