import type { Request, Response, NextFunction } from "express";

// ADMIN AUTHORIZATION
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin only",
    });
    return;
  }

  next();
};

// CUSTOMER AUTHORIZATION
export const isCustomer = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== "customer") {
    res.status(403).json({
      success: false,
      message: "Access denied. Customer only",
    });
    return;
  }

  next();
};
