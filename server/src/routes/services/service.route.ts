import { Router } from "express";
import serviceController from "../../controllers/services/service.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { isAdmin } from "../../middleware/role.middleware";

const router = Router();

/**
 * @openapi
 * /api/services:
 *   post:
 *     tags:
 *       - Services
 *     summary: Create a new service
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - basePrice
 *             properties:
 *               code:
 *                 type: string
 *                 example: OIL_CHANGE
 *               name:
 *                 type: string
 *                 example: Ganti Oli Mesin
 *               description:
 *                 type: string
 *                 example: Penggantian oli mesin sepeda motor
 *               basePrice:
 *                 type: number
 *                 example: 75000
 *               reminderIntervalDays:
 *                 type: integer
 *                 nullable: true
 *                 example: 60
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Service code already exists
 */
router.post("/", authMiddleware, isAdmin, serviceController.createService);

/**
 * @openapi
 * /api/services:
 *   get:
 *     tags:
 *       - Services
 *     summary: Get all active services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware, serviceController.getServices);

/**
 * @openapi
 * /api/services/{id}:
 *   get:
 *     tags:
 *       - Services
 *     summary: Get active service by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service retrieved successfully
 *       400:
 *         description: Invalid service ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 */
router.get("/:id", authMiddleware, serviceController.getServiceById);

/**
 * @openapi
 * /api/services/{id}:
 *   patch:
 *     tags:
 *       - Services
 *     summary: Update a service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: OIL_CHANGE
 *               name:
 *                 type: string
 *                 example: Ganti Oli Mesin Premium
 *               description:
 *                 type: string
 *                 example: Penggantian oli mesin premium
 *               basePrice:
 *                 type: number
 *                 example: 95000
 *               reminderIntervalDays:
 *                 type: integer
 *                 nullable: true
 *                 example: 60
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Service not found
 *       409:
 *         description: Service code already exists
 */
router.patch("/:id", authMiddleware, isAdmin, serviceController.updateService);

/**
 * @openapi
 * /api/services/{id}:
 *   delete:
 *     tags:
 *       - Services
 *     summary: Deactivate a service
 *     description: Soft delete by setting isActive to false.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service deactivated successfully
 *       400:
 *         description: Invalid service ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Service not found
 */
router.delete("/:id", authMiddleware, isAdmin, serviceController.deleteService);

export default router;
