import { Router } from "express";
import profileController from "../../controllers/profile/profile.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/profile:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get my profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       401:
 *         description: Unauthorized
 *
 *   patch:
 *     tags:
 *       - Profile
 *     summary: Update my profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Audrey Callysta
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "081234567890"
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Invalid profile data
 *       401:
 *         description: Unauthorized
 */
router.get("/", profileController.getProfile);
router.patch("/", profileController.updateProfile);

export default router;
