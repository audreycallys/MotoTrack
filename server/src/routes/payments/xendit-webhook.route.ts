import { Router } from "express";

import xenditWebhookController from "../../controllers/payments/xendit-webhook.controller";

const router = Router();

router.post("/xendit", xenditWebhookController.handleWebhook);

export default router;
