import { z } from "zod";

export const createCashPaymentSchema = z.object({
  serviceOrderId: z.number().int().positive(),
});

export const paymentOrderIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
