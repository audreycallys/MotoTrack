import type { Request, Response } from "express";
import { db } from "../../config/db";
import { and, desc, eq, asc } from "drizzle-orm";
import {
  serviceOrdersTable,
  vehiclesTable,
  serviceUpdatesTable,
} from "../../config/schema";

import {
  createServiceOrderSchema,
  serviceOrderIdSchema,
  estimateDecisionSchema,
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

  // APPROVE OR REJECT ESTIMATE
  decideEstimate = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const idValidation = serviceOrderIdSchema.safeParse(req.params);
      const bodyValidation = estimateDecisionSchema.safeParse(req.body);

      if (!idValidation.success || !bodyValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: {
            params: idValidation.success ? [] : idValidation.error.issues,
            body: bodyValidation.success ? [] : bodyValidation.error.issues,
          },
        });
      }

      const orderId = idValidation.data.id;
      const decision = bodyValidation.data.decision;

      // Check order ownership
      const order = await db.query.serviceOrdersTable.findFirst({
        where: and(
          eq(serviceOrdersTable.id, orderId),
          eq(serviceOrdersTable.userId, req.user.id),
        ),
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Service order not found",
        });
      }

      // Estimate must be awaiting customer approval
      if (
        order.status !== "awaiting_approval" ||
        order.estimateStatus !== "pending"
      ) {
        return res.status(400).json({
          success: false,
          message: "Estimate is not awaiting approval",
        });
      }

      const [updatedOrder] = await db
        .update(serviceOrdersTable)
        .set({
          estimateStatus: decision,
          ...(decision === "approved" && {
            estimateApprovedAt: new Date(),
          }),
        })
        .where(
          and(
            eq(serviceOrdersTable.id, orderId),
            eq(serviceOrdersTable.userId, req.user.id),
            eq(serviceOrdersTable.status, "awaiting_approval"),
            eq(serviceOrdersTable.estimateStatus, "pending"),
          ),
        )
        .returning();

      if (!updatedOrder) {
        return res.status(409).json({
          success: false,
          message: "Service order status has changed",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          decision === "approved"
            ? "Service estimate approved successfully"
            : "Service estimate rejected successfully",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Estimate decision error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // GET MY SERVICE UPDATES
  getServiceUpdates = async (req: Request, res: Response) => {
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

      const orderId = validation.data.id;
      const userId = req.user.id;

      // Check service order ownership
      const order = await db.query.serviceOrdersTable.findFirst({
        where: and(
          eq(serviceOrdersTable.id, orderId),
          eq(serviceOrdersTable.userId, userId),
        ),
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Service order not found",
        });
      }

      // Get service updates
      const updates = await db
        .select({
          id: serviceUpdatesTable.id,
          serviceOrderId: serviceUpdatesTable.serviceOrderId,
          status: serviceUpdatesTable.status,
          notes: serviceUpdatesTable.notes,
          imageUrl: serviceUpdatesTable.imageUrl,
          createdAt: serviceUpdatesTable.createdAt,
        })
        .from(serviceUpdatesTable)
        .where(eq(serviceUpdatesTable.serviceOrderId, orderId))
        .orderBy(
          asc(serviceUpdatesTable.createdAt),
          asc(serviceUpdatesTable.id),
        );

      return res.status(200).json({
        success: true,
        message: "Service updates retrieved successfully",
        data: updates,
      });
    } catch (error) {
      console.error("Get service updates error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new ServiceOrderController();
