import { Router } from "express";

import xenditPaymentController from "../../controllers/payments/xendit-payment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { isCustomer } from "../../middleware/role.middleware";

const router = Router();

/**
 * @openapi
 * /api/payments/xendit:
 *   post:
 *     tags:
 *       - Xendit Payments
 *     summary: Create Xendit payment checkout
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
 *                 example: 5
 *     responses:
 *       201:
 *         description: Checkout created successfully
 *       400:
 *         description: Invalid payment data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Customer access required
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Payment already exists
 *       502:
 *         description: Failed to create checkout
 */
router.post(
  "/xendit",
  authMiddleware,
  isCustomer,
  xenditPaymentController.createPayment,
);

export default router;
