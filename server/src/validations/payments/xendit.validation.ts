import { z } from "zod";

export const createXenditPaymentSchema = z.object({
  serviceOrderId: z.number().int().positive(),
});

export const paymentIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
