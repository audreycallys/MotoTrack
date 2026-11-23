import type { Request, Response } from "express";
import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { usersTable, rolesTable } from "../../config/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "../../validations/auth/auth.validation";

export class AuthController {
  // REGISTER
  register = async (req: Request, res: Response) => {
    try {
      const validation = registerSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.issues,
        });
      }

      const { name, email, phone, password } = validation.data;

      const existingEmail = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, email),
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      const customerRole = await db.query.rolesTable.findFirst({
        where: eq(rolesTable.title, "customer"),
      });

      if (!customerRole) {
        return res.status(500).json({
          success: false,
          message: "Customer role not found",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const [newUser] = await db
        .insert(usersTable)
        .values({
          roleId: customerRole.id,
          name,
          email,
          phone,
          password: hashedPassword,
        })
        .returning({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          phone: usersTable.phone,
        });

      return res.status(201).json({
        success: true,
        message: "Register successful",
        data: { user: newUser },
      });
    } catch (error: unknown) {
      console.error("Register error:", error);

      const dbError = error as {
        code?: string;
        cause?: { code?: string };
      };

      if (dbError.code === "23505" || dbError.cause?.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Email or plate number already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // LOGIN
  login = async (req: Request, res: Response) => {
    try {
      const validation = loginSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.issues,
        });
      }

      const { email, password } = validation.data;

      const [user] = await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          password: usersTable.password,
          role: rolesTable.title,
        })
        .from(usersTable)
        .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
        .where(eq(usersTable.email, email))
        .limit(1);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email or password incorrect",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Email or password incorrect",
        });
      }

      const secret = process.env.JWT_SECRET;

      if (!secret) {
        return res.status(500).json({
          success: false,
          message: "Server configuration error",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
        },
        secret,
        { expiresIn: "1d" },
      );

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // GET CURRENT USER
  getMe = (req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: "Authenticated user",
      data: req.user,
    });
  };

  // CHANGE PASSWORD
  changePassword = async (req: Request, res: Response) => {
    try {
      const validation = changePasswordSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.issues,
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { currentPassword, newPassword } = validation.data;
      const userId = req.user.id;

      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);

      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: "New password must be different",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db
        .update(usersTable)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userId));

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new AuthController();
