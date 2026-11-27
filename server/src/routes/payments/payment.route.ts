import { Router } from "express";

import paymentController from "../../controllers/payments/payment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { isAdmin } from "../../middleware/role.middleware";

const router = Router();

// Only authenticated admin can record cash payments
router.use(authMiddleware, isAdmin);

/**
 * @openapi
 * /api/admin/payments/cash:
 *   post:
 *     tags:
 *       - Admin Payments
 *     summary: Record cash payment
 *     description: Record a cash payment for a completed service order after the cashier has received the money.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceOrderId
 *             properties:
 *               serviceOrderId:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       201:
 *         description: Cash payment recorded successfully
 *       400:
 *         description: Invalid data or service order not completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Payment already exists
 *       500:
 *         description: Internal server error
 */
router.post("/cash", paymentController.createCashPayment);

export default router;
