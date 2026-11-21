import { Router } from "express";
import { register, login } from "../../controllers/auth/auth.controller";

import {
  getMe,
  adminTest,
  customerTest,
} from "../../controllers/auth/auth.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { isAdmin, isCustomer } from "../../middleware/role.middleware";

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
router.post("/register", register);

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
router.post("/login", login);

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
router.get("/me", authMiddleware, getMe);

/**
 * @openapi
 * /api/auth/admin-test:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Test admin authorization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/admin-test", authMiddleware, isAdmin, adminTest);

/**
 * @openapi
 * /api/auth/customer-test:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Test customer authorization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer access granted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/customer-test", authMiddleware, isCustomer, customerTest);

export default router;
