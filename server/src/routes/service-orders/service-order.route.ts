import { Router } from "express";
import serviceOrderController from "../../controllers/service-orders/service-order.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { isCustomer } from "../../middleware/role.middleware";

const router = Router();

/**
 * @openapi
 * /api/service-orders:
 *   post:
 *     tags:
 *       - Service Orders
 *     summary: Submit a new service order
 *     description: Customer submits a service request for their active vehicle.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - complaint
 *               - mileage
 *             properties:
 *               vehicleId:
 *                 type: integer
 *                 example: 1
 *               complaint:
 *                 type: string
 *                 example: Oli mesin perlu diganti dan rem depan berbunyi
 *               mileage:
 *                 type: integer
 *                 example: 12500
 *     responses:
 *       201:
 *         description: Service order submitted successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Customer access required
 *       404:
 *         description: Vehicle not found or not owned by customer
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  authMiddleware,
  isCustomer,
  serviceOrderController.createServiceOrder,
);

/**
 * @openapi
 * /api/service-orders:
 *   get:
 *     tags:
 *       - Service Orders
 *     summary: Get my service orders
 *     description: Returns service orders belonging to the logged-in customer.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Customer access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authMiddleware,
  isCustomer,
  serviceOrderController.getServiceOrders,
);

/**
 * @openapi
 * /api/service-orders/{id}:
 *   get:
 *     tags:
 *       - Service Orders
 *     summary: Get my service order by ID
 *     description: Returns a service order belonging to the logged-in customer.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Service order ID
 *     responses:
 *       200:
 *         description: Service order retrieved successfully
 *       400:
 *         description: Invalid service order ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Customer access required
 *       404:
 *         description: Service order not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:id",
  authMiddleware,
  isCustomer,
  serviceOrderController.getServiceOrderById,
);

export default router;
