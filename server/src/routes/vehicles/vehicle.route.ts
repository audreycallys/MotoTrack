import { Router } from "express";
import vehicleController from "../../controllers/vehicles/vehicle.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { isCustomer } from "../../middleware/role.middleware";

const router = Router();

/**
 * @openapi
 * /api/vehicles:
 *   post:
 *     tags:
 *       - Vehicles
 *     summary: Register a new vehicle
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brand
 *               - model
 *               - plateNumber
 *               - year
 *             properties:
 *               brand:
 *                 type: string
 *                 example: Honda
 *               model:
 *                 type: string
 *                 example: Vario 160
 *               plateNumber:
 *                 type: string
 *                 example: B 1234 ABC
 *               year:
 *                 type: integer
 *                 example: 2024
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Plate number already registered
 */
router.post("/", authMiddleware, isCustomer, vehicleController.createVehicle);

/**
 * @openapi
 * /api/vehicles:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Get my active vehicles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", authMiddleware, isCustomer, vehicleController.getVehicles);

/**
 * @openapi
 * /api/vehicles/{id}:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Get my vehicle by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle retrieved successfully
 *       400:
 *         description: Invalid vehicle ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Vehicle not found
 */
router.get(
  "/:id",
  authMiddleware,
  isCustomer,
  vehicleController.getVehicleById,
);

/**
 * @openapi
 * /api/vehicles/{id}:
 *   patch:
 *     tags:
 *       - Vehicles
 *     summary: Update my vehicle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand:
 *                 type: string
 *                 example: Yamaha
 *               model:
 *                 type: string
 *                 example: NMAX
 *               plateNumber:
 *                 type: string
 *                 example: B 5678 XYZ
 *               year:
 *                 type: integer
 *                 example: 2025
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Vehicle not found
 *       409:
 *         description: Plate number already registered
 */
router.patch(
  "/:id",
  authMiddleware,
  isCustomer,
  vehicleController.updateVehicle,
);

/**
 * @openapi
 * /api/vehicles/{id}:
 *   delete:
 *     tags:
 *       - Vehicles
 *     summary: Deactivate my vehicle
 *     description: Soft delete by setting isActive to false.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle deactivated successfully
 *       400:
 *         description: Invalid vehicle ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Vehicle not found
 */
router.delete(
  "/:id",
  authMiddleware,
  isCustomer,
  vehicleController.deleteVehicle,
);

export default router;
