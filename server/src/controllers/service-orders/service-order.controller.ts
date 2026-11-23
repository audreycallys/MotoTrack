import type { Request, Response } from "express";
import { db } from "../../config/db";
import { and, desc, eq } from "drizzle-orm";
import { serviceOrdersTable, vehiclesTable } from "../../config/schema";

import {
  createServiceOrderSchema,
  serviceOrderIdSchema,
} from "../../validations/service-orders/service-order.validation";

export class ServiceOrderController {
  // CREATE SERVICE ORDER
  createServiceOrder = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const validation = createServiceOrderSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.issues,
        });
      }

      const { vehicleId, complaint, mileage } = validation.data;

      // Check vehicle ownership
      const vehicle = await db.query.vehiclesTable.findFirst({
        where: and(
          eq(vehiclesTable.id, vehicleId),
          eq(vehiclesTable.userId, req.user.id),
          eq(vehiclesTable.isActive, true),
        ),
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      // Create service order
      const [newOrder] = await db
        .insert(serviceOrdersTable)
        .values({
          userId: req.user.id,
          vehicleId,
          complaint,
          mileage,
          status: "submitted",
          estimateStatus: "draft",
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Service order submitted successfully",
        data: newOrder,
      });
    } catch (error) {
      console.error("Create service order error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // GET MY SERVICE ORDERS
  getServiceOrders = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const orders = await db.query.serviceOrdersTable.findMany({
        where: eq(serviceOrdersTable.userId, req.user.id),
        orderBy: [desc(serviceOrdersTable.createdAt)],
      });

      return res.status(200).json({
        success: true,
        message: "Service orders retrieved successfully",
        data: orders,
      });
    } catch (error) {
      console.error("Get service orders error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // GET MY SERVICE ORDER BY ID
  getServiceOrderById = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const validation = serviceOrderIdSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid service order ID",
        });
      }

      const order = await db.query.serviceOrdersTable.findFirst({
        where: and(
          eq(serviceOrdersTable.id, validation.data.id),
          eq(serviceOrdersTable.userId, req.user.id),
        ),
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Service order not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Service order retrieved successfully",
        data: order,
      });
    } catch (error) {
      console.error("Get service order error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new ServiceOrderController();
