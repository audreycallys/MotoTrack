import type { Request, Response } from "express";
import { registerUser, loginUser } from "../../services/auth/auth.service";
import {
  loginSchema,
  registerSchema,
} from "../../validations/auth/auth.validation";

// REGISTER
export const register = async (req: Request, res: Response): Promise<void> => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validation.error.issues,
    });
    return;
  }

  try {
    const user = await registerUser(validation.data);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EMAIL_EXISTS") {
        res.status(409).json({
          success: false,
          message: "Email already registered",
        });
        return;
      }

      if (error.message === "CUSTOMER_ROLE_NOT_FOUND") {
        res.status(500).json({
          success: false,
          message: "Server configuration error",
        });
        return;
      }
    }

    // PostgreSQL unique constraint
    const dbError = error as {
      code?: string;
      cause?: { code?: string };
    };

    if (dbError.code === "23505" || dbError.cause?.code === "23505") {
      res.status(409).json({
        success: false,
        message: "Email already registered",
      });
      return;
    }

    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// LOGIN
export const login = async (req: Request, res: Response): Promise<void> => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validation.error.issues,
    });
    return;
  }

  try {
    const result = await loginUser(validation.data);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
