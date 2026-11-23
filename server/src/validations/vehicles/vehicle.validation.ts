import { z } from "zod";

// CREATE VEHICLE
export const createVehicleSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(2, "Brand must be at least 2 characters")
    .max(100, "Brand must not exceed 100 characters"),

  model: z
    .string()
    .trim()
    .min(2, "Model must be at least 2 characters")
    .max(100, "Model must not exceed 100 characters"),

  plateNumber: z
    .string()
    .trim()
    .min(3, "Plate number must be at least 3 characters")
    .max(20, "Plate number must not exceed 20 characters")
    .transform((value) => value.toUpperCase()),

  year: z
    .number()
    .int()
    .min(1900, "Invalid vehicle year")
    .max(new Date().getFullYear() + 1, "Invalid vehicle year"),
});

// UPDATE VEHICLE
export const updateVehicleSchema = createVehicleSchema.partial();

// VEHICLE ID PARAMETER
export const vehicleIdSchema = z.object({
  id: z.coerce.number<number>().int().positive(),
});

// TYPES
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
