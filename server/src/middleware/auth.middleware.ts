import type { Request, Response, NextFunction } from "express";

import jwt, { type JwtPayload } from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { db } from "../config/db";
import { usersTable, rolesTable } from "../config/schema";

// JWT PAYLOAD
interface AuthPayload extends JwtPayload {
  id: number;
}

// EXTEND EXPRESS REQUEST
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      };
    }
  }
}

// AUTHENTICATION MIDDLEWARE
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
    return;
  }

  const token = authorization.slice(7);

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({
      success: false,
      message: "Server configuration error",
    });
    return;
  }

  let decoded: string | JwtPayload;

  try {
    decoded = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
    });
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
    return;
  }

  if (
    typeof decoded === "string" ||
    typeof decoded.id !== "number" ||
    !Number.isInteger(decoded.id) ||
    decoded.id <= 0
  ) {
    res.status(401).json({
      success: false,
      message: "Invalid token payload",
    });
    return;
  }

  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        role: rolesTable.title,
      })
      .from(usersTable)
      .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
      .where(eq(usersTable.id, decoded.id))
      .limit(1);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User account not found",
      });
      return;
    }

    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
