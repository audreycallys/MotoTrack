import { Router } from "express";
import authController from "../../controllers/auth/auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new customer
 *     description: Creates a customer account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Test Customer
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@example.com
 *               phone:
 *                 type: string
 *                 example: "081234567890"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: MotoTrack123
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Email already registered
 *       500:
 *         description: Internal server error
 */
router.post("/register", authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login customer or admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MotoTrack123
 *     responses:
 *       200:
 *         description: Login successful and returns JWT
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */
router.post("/login", authController.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user information
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, authController.getMe);

/**
 * @openapi
 * /api/auth/change-password:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Change authenticated user password
 *     description: Available for customer and admin.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: OldPassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 maxLength: 72
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input or password
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/change-password", authMiddleware, authController.changePassword);

export default router;
