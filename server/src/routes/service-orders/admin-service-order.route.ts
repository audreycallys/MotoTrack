import { Router } from "express";
import adminServiceOrderController from "../../controllers/service-orders/admin-service-order.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { isAdmin } from "../../middleware/role.middleware";

const router = Router();

router.use(authMiddleware, isAdmin);

/**
 * @openapi
 * /api/admin/service-orders:
 *   get:
 *     tags:
 *       - Admin Service Orders
 *     summary: Get all service orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service orders retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get("/", adminServiceOrderController.getAllServiceOrders);

/**
 * @openapi
 * /api/admin/service-orders/{id}:
 *   get:
 *     tags:
 *       - Admin Service Orders
 *     summary: Get service order details
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
 *         description: Service order retrieved successfully
 *       400:
 *         description: Invalid service order ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Service order not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", adminServiceOrderController.getServiceOrderById);

/**
 * @openapi
 * /api/admin/service-orders/{id}/receive:
 *   patch:
 *     tags:
 *       - Admin Service Orders
 *     summary: Receive a submitted vehicle
 *     description: Changes status from submitted to received.
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
 *         description: Service order received successfully
 *       400:
 *         description: Invalid ID or incorrect order status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Service order status has changed
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/receive", adminServiceOrderController.receiveServiceOrder);

/**
 * @openapi
 * /api/admin/service-orders/{id}/inspect:
 *   patch:
 *     tags:
 *       - Admin Service Orders
 *     summary: Inspect a received vehicle
 *     description: Changes status from received to inspected.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inspectionNotes
 *             properties:
 *               inspectionNotes:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 2000
 *                 example: Oli mesin sudah kotor dan kampas rem depan menipis
 *     responses:
 *       200:
 *         description: Service order inspected successfully
 *       400:
 *         description: Validation failed or incorrect order status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Service order status has changed
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/inspect", adminServiceOrderController.inspectServiceOrder);

/**
 * @openapi
 * /api/admin/service-orders/{id}/estimate:
 *   patch:
 *     tags:
 *       - Admin Service Orders
 *     summary: Submit service cost estimate
 *     description: Changes status from inspected to awaiting_approval.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estimatedTotal
 *             properties:
 *               estimatedTotal:
 *                 type: number
 *                 minimum: 0
 *                 example: 175000
 *     responses:
 *       200:
 *         description: Service estimate submitted successfully
 *       400:
 *         description: Validation failed or incorrect order status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Service order status has changed
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/estimate", adminServiceOrderController.createEstimate);

/**
 * @openapi
 * /api/admin/service-orders/{id}/start:
 *   patch:
 *     tags:
 *       - Admin Service Orders
 *     summary: Start approved service work
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
 *         description: Service started successfully
 *       400:
 *         description: Estimate not approved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Status conflict
 */
router.patch("/:id/start", adminServiceOrderController.startServiceOrder);

/**
 * @openapi
 * /api/admin/service-orders/{id}/final-inspection:
 *   patch:
 *     tags:
 *       - Admin Service Orders
 *     summary: Move service to final inspection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notes
 *             properties:
 *               notes:
 *                 type: string
 *                 example: All parts installed and tested
 *     responses:
 *       200:
 *         description: Final inspection started
 *       400:
 *         description: Invalid status or input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Status conflict
 */
router.patch(
  "/:id/final-inspection",
  adminServiceOrderController.finalInspection,
);

/**
 * @openapi
 * /api/admin/service-orders/{id}/complete:
 *   patch:
 *     tags:
 *       - Admin Service Orders
 *     summary: Complete service order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - finalNotes
 *               - finalTotal
 *             properties:
 *               finalNotes:
 *                 type: string
 *                 example: Service completed and motorcycle tested
 *               finalTotal:
 *                 type: number
 *                 example: 175000
 *     responses:
 *       200:
 *         description: Service completed successfully
 *       400:
 *         description: Invalid status or input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Status conflict
 */
router.patch("/:id/complete", adminServiceOrderController.completeServiceOrder);

export default router;
