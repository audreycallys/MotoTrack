import { Router } from "express";

import paymentHistoryController from "../../controllers/payments/payment-history.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { isAdmin, isCustomer } from "../../middleware/role.middleware";

const router = Router();

/**
 * @openapi
 * /api/admin/payments:
 *   get:
 *     tags:
 *       - Payment History
 *     summary: Admin - Get all payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All payments retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 */
router.get(
  "/admin/payments",
  authMiddleware,
  isAdmin,
  paymentHistoryController.getAllPayments,
);

/**
 * @openapi
 * /api/payments:
 *   get:
 *     tags:
 *       - Payment History
 *     summary: Customer - Get my payment history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Customer only
 */
router.get(
  "/payments",
  authMiddleware,
  isCustomer,
  paymentHistoryController.getMyPayments,
);

/**
 * @openapi
 * /api/payments/{id}:
 *   get:
 *     tags:
 *       - Payment History
 *     summary: Customer - Get my payment detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Payment detail retrieved
 *       400:
 *         description: Invalid payment ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Customer only
 *       404:
 *         description: Payment not found
 */
router.get(
  "/payments/:id",
  authMiddleware,
  isCustomer,
  paymentHistoryController.getMyPaymentById,
);

export default router;
