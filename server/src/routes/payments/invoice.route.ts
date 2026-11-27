import { Router } from "express";

import invoiceController from "../../controllers/payments/invoice.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { isAdmin, isCustomer } from "../../middleware/role.middleware";

const router = Router();

/**
 * @openapi
 * /api/admin/service-orders/{id}/invoice:
 *   post:
 *     tags:
 *       - Invoice & Handover
 *     summary: Admin - Issue invoice after payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Invoice issued
 *       200:
 *         description: Invoice already exists
 *       400:
 *         description: Service or payment incomplete
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Payment amount mismatch
 */
router.post(
  "/admin/service-orders/:id/invoice",
  authMiddleware,
  isAdmin,
  invoiceController.issueInvoice,
);

/**
 * @openapi
 * /api/service-orders/{id}/invoice:
 *   get:
 *     tags:
 *       - Invoice & Handover
 *     summary: Customer - Download own invoice PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invoice PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invoice not issued
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Customer only
 *       404:
 *         description: Service order not found
 */
router.get(
  "/service-orders/:id/invoice",
  authMiddleware,
  isCustomer,
  invoiceController.downloadInvoice,
);

/**
 * @openapi
 * /api/admin/service-orders/{id}/handover:
 *   patch:
 *     tags:
 *       - Invoice & Handover
 *     summary: Admin - Confirm vehicle handover
 *     description: Use only after the vehicle is physically handed over.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehicle handed over
 *       400:
 *         description: Service, payment, or invoice incomplete
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Vehicle already handed over
 */
router.patch(
  "/admin/service-orders/:id/handover",
  authMiddleware,
  isAdmin,
  invoiceController.handOverVehicle,
);

export default router;
