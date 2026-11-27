import { Router } from "express";

import reminderController from "../../controllers/reminders/reminder.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { isCustomer } from "../../middleware/role.middleware";

const router = Router();

router.use(authMiddleware, isCustomer);

/**
 * @openapi
 * /api/reminders:
 *   get:
 *     tags:
 *       - Maintenance Reminders
 *     summary: Get my oil change reminders
 *     description: Calculate reminders from completed oil service history.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Customer access required
 */
router.get("/", reminderController.getMyReminders);

export default router;
