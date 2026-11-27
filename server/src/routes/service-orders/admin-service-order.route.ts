import { Router } from "express";
import adminServiceOrderController from "../../controllers/service-orders/admin-service-order.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { isAdmin } from "../../middleware/role.middleware";

const router = Router();

// ALL ROUTES REQUIRE ADMIN ACCESS
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
 *     summary: Get service order by ID
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
 *     summary: Receive a submitted service order
 *     description: Changes status from submitted to received.
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
 *           minimum: 1
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
 *                 example: Oli mesin kotor dan kampas rem depan menipis
 *     responses:
 *       200:
 *         description: Vehicle inspected successfully
 *       400:
 *         description: Validation failed or incorrect status
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
 *     summary: Submit detailed service estimate
 *     description: Calculates the estimated total from service and part items. Changes status from inspected to awaiting_approval.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Service order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemType
 *                     - name
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     serviceId:
 *                       type: integer
 *                       nullable: true
 *                       minimum: 1
 *                       description: Optional active catalog service ID.
 *                       example: 1
 *                     itemType:
 *                       type: string
 *                       enum:
 *                         - service
 *                         - part
 *                       example: service
 *                     name:
 *                       type: string
 *                       minLength: 3
 *                       maxLength: 100
 *                       example: Ganti Oli Mesin
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 1
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                       multipleOf: 0.01
 *                       example: 75000
 *     responses:
 *       200:
 *         description: Detailed estimate submitted successfully
 *       400:
 *         description: Validation failed or order not ready
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
 *     description: Changes status from awaiting_approval to in_progress after customer approval.
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
 *         description: Service started successfully
 *       400:
 *         description: Estimate not approved
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
router.patch("/:id/start", adminServiceOrderController.startServiceOrder);

/**
 * @openapi
 * /api/admin/service-orders/{id}/final-inspection:
 *   patch:
 *     tags:
 *       - Admin Service Orders
 *     summary: Move service order to final inspection
 *     description: Changes status from in_progress to final_inspection.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
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
 *                 minLength: 5
 *                 maxLength: 2000
 *                 example: Semua komponen sudah terpasang dan diuji
 *     responses:
 *       200:
 *         description: Final inspection started successfully
 *       400:
 *         description: Validation failed or incorrect status
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
 *     description: Changes status from final_inspection to completed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
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
 *                 minLength: 5
 *                 maxLength: 2000
 *                 example: Servis selesai dan motor telah diuji
 *               finalTotal:
 *                 type: number
 *                 minimum: 0
 *                 example: 175000
 *     responses:
 *       200:
 *         description: Service completed successfully
 *       400:
 *         description: Validation failed or incorrect status
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
router.patch("/:id/complete", adminServiceOrderController.completeServiceOrder);

/**
 * @openapi
 * /api/admin/service-orders/{id}/cancel:
 *   patch:
 *     tags:
 *       - Admin Service Orders
 *     summary: Cancel rejected service order
 *     description: Cancel an order with rejected estimate after returning the vehicle to the customer.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Service order ID
 *     responses:
 *       200:
 *         description: Service order cancelled successfully
 *       400:
 *         description: Estimate is not rejected
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
router.patch("/:id/cancel", adminServiceOrderController.cancelRejectedOrder);

export default router;
