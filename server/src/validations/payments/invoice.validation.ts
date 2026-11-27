import { z } from "zod";

export const invoiceOrderIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
