import { z } from "zod";

export const paymentHistoryIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
