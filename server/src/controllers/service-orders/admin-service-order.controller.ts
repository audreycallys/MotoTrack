import type { Request, Response } from "express";
import { db } from "../../config/db";
import { and, desc, eq } from "drizzle-orm";

import {
  serviceOrdersTable,
  serviceUpdatesTable,
  servicesTable,
  serviceOrderItemsTable,
} from "../../config/schema";

import {
  serviceOrderIdSchema,
  inspectServiceOrderSchema,
  createDetailedEstimateSchema,
  serviceProgressSchema,
  completeServiceOrderSchema,
} from "../../validations/service-orders/service-order.validation";

export class AdminServiceOrderController {
  // GET ALL SERVICE ORDERS
  getAllServiceOrders = async (req: Request, res: Response) => {
    try {
      const orders = await db.query.serviceOrdersTable.findMany({
        orderBy: [desc(serviceOrdersTable.createdAt)],
      });

      return res.status(200).json({
        success: true,
        message: "Service orders retrieved successfully",
        data: orders,
      });
    } catch (error) {
      console.error("Get all service orders error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // GET SERVICE ORDER BY ID
  getServiceOrderById = async (req: Request, res: Response) => {
    try {
      const validation = serviceOrderIdSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid service order ID",
        });
      }

      const order = await db.query.serviceOrdersTable.findFirst({
        where: eq(serviceOrdersTable.id, validation.data.id),
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

  // RECEIVE SERVICE ORDER
  receiveServiceOrder = async (req: Request, res: Response) => {
    try {
      const validation = serviceOrderIdSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid service order ID",
        });
      }

      const orderId = validation.data.id;

      const order = await db.query.serviceOrdersTable.findFirst({
        where: eq(serviceOrdersTable.id, orderId),
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Service order not found",
        });
      }

      if (order.status !== "submitted") {
        return res.status(400).json({
          success: false,
          message: "Only submitted orders can be received",
        });
      }

      const [updatedOrder] = await db
        .update(serviceOrdersTable)
        .set({
          status: "received",
          receivedAt: new Date(),
        })
        .where(
          and(
            eq(serviceOrdersTable.id, orderId),
            eq(serviceOrdersTable.status, "submitted"),
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
        message: "Service order received successfully",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Receive service order error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // INSPECT SERVICE ORDER
  inspectServiceOrder = async (req: Request, res: Response) => {
    try {
      const idValidation = serviceOrderIdSchema.safeParse(req.params);
      const bodyValidation = inspectServiceOrderSchema.safeParse(req.body);

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

      const order = await db.query.serviceOrdersTable.findFirst({
        where: eq(serviceOrdersTable.id, orderId),
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Service order not found",
        });
      }

      if (order.status !== "received") {
        return res.status(400).json({
          success: false,
          message: "Only received orders can be inspected",
        });
      }

      const [updatedOrder] = await db
        .update(serviceOrdersTable)
        .set({
          inspectionNotes: bodyValidation.data.inspectionNotes,
          status: "inspected",
        })
        .where(
          and(
            eq(serviceOrdersTable.id, orderId),
            eq(serviceOrdersTable.status, "received"),
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
        message: "Service order inspected successfully",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Inspect service order error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // CREATE DETAILED ESTIMATE
  createEstimate = async (req: Request, res: Response) => {
    try {
      const idValidation = serviceOrderIdSchema.safeParse(req.params);
      const bodyValidation = createDetailedEstimateSchema.safeParse(req.body);

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
      const items = bodyValidation.data.items;

      // Check service order
      const order = await db.query.serviceOrdersTable.findFirst({
        where: eq(serviceOrdersTable.id, orderId),
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Service order not found",
        });
      }

      if (order.status !== "inspected" || order.estimateStatus !== "draft") {
        return res.status(400).json({
          success: false,
          message: "Service order is not ready for estimation",
        });
      }

      // Validate catalog references
      for (const item of items) {
        if (item.serviceId != null) {
          if (item.itemType !== "service") {
            return res.status(400).json({
              success: false,
              message: "Only service items can reference a service ID",
            });
          }

          const catalogService = await db.query.servicesTable.findFirst({
            where: and(
              eq(servicesTable.id, item.serviceId),
              eq(servicesTable.isActive, true),
            ),
          });

          if (!catalogService) {
            return res.status(400).json({
              success: false,
              message: `Active service ${item.serviceId} not found`,
            });
          }
        }
      }

      // Calculate item subtotals
      const calculatedItems = items.map((item) => {
        const unitPriceCents = Math.round(item.unitPrice * 100);
        const subtotalCents = unitPriceCents * item.quantity;

        return {
          serviceId: item.serviceId ?? null,
          itemType: item.itemType,
          name: item.name,
          quantity: item.quantity,
          unitPriceCents,
          subtotalCents,
        };
      });

      // Calculate estimated total
      const totalCents = calculatedItems.reduce(
        (total, item) => total + item.subtotalCents,
        0,
      );

      // Maximum value for numeric(12,2)
      const maxCents = 999999999999;

      const invalidAmount =
        !Number.isSafeInteger(totalCents) ||
        totalCents > maxCents ||
        calculatedItems.some(
          (item) =>
            !Number.isSafeInteger(item.unitPriceCents) ||
            !Number.isSafeInteger(item.subtotalCents) ||
            item.unitPriceCents > maxCents ||
            item.subtotalCents > maxCents,
        );

      if (invalidAmount) {
        return res.status(400).json({
          success: false,
          message: "Estimate amount exceeds allowed limit",
        });
      }

      const estimatedTotal = (totalCents / 100).toFixed(2);

      // Save estimate and items in one transaction
      const result = await db.transaction(async (tx) => {
        const [updatedOrder] = await tx
          .update(serviceOrdersTable)
          .set({
            estimatedTotal,
            estimateStatus: "pending",
            status: "awaiting_approval",
          })
          .where(
            and(
              eq(serviceOrdersTable.id, orderId),
              eq(serviceOrdersTable.status, "inspected"),
              eq(serviceOrdersTable.estimateStatus, "draft"),
            ),
          )
          .returning();

        if (!updatedOrder) {
          return null;
        }

        // Remove previous draft items
        await tx
          .delete(serviceOrderItemsTable)
          .where(eq(serviceOrderItemsTable.serviceOrderId, orderId));

        // Insert detailed estimate items
        const savedItems = await tx
          .insert(serviceOrderItemsTable)
          .values(
            calculatedItems.map((item) => ({
              serviceOrderId: orderId,
              serviceId: item.serviceId,
              itemType: item.itemType,
              name: item.name,
              quantity: item.quantity,
              unitPrice: (item.unitPriceCents / 100).toFixed(2),
              subtotal: (item.subtotalCents / 100).toFixed(2),
            })),
          )
          .returning();

        return {
          order: updatedOrder,
          items: savedItems,
        };
      });

      if (!result) {
        return res.status(409).json({
          success: false,
          message: "Service order status has changed",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Detailed estimate submitted successfully",
        data: {
          order: result.order,
          items: result.items,
          estimatedTotal,
        },
      });
    } catch (error) {
      console.error("Create detailed estimate error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // START SERVICE
  startServiceOrder = async (req: Request, res: Response) => {
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

      const order = await db.query.serviceOrdersTable.findFirst({
        where: eq(serviceOrdersTable.id, orderId),
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Service order not found",
        });
      }

      if (
        order.status !== "awaiting_approval" ||
        order.estimateStatus !== "approved"
      ) {
        return res.status(400).json({
          success: false,
          message: "Service estimate must be approved first",
        });
      }

      const updatedOrder = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(serviceOrdersTable)
          .set({
            status: "in_progress",
          })
          .where(
            and(
              eq(serviceOrdersTable.id, orderId),
              eq(serviceOrdersTable.status, "awaiting_approval"),
              eq(serviceOrdersTable.estimateStatus, "approved"),
            ),
          )
          .returning();

        if (!updated) {
          return null;
        }

        await tx.insert(serviceUpdatesTable).values({
          serviceOrderId: orderId,
          updatedBy: req.user!.id,
          status: "in_progress",
          notes: "Service work started",
        });

        return updated;
      });

      if (!updatedOrder) {
        return res.status(409).json({
          success: false,
          message: "Service order status has changed",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Service started successfully",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Start service error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // FINAL INSPECTION
  finalInspection = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const idValidation = serviceOrderIdSchema.safeParse(req.params);
      const bodyValidation = serviceProgressSchema.safeParse(req.body);

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

      const order = await db.query.serviceOrdersTable.findFirst({
        where: eq(serviceOrdersTable.id, orderId),
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Service order not found",
        });
      }

      if (order.status !== "in_progress") {
        return res.status(400).json({
          success: false,
          message: "Only in-progress orders can enter final inspection",
        });
      }

      const updatedOrder = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(serviceOrdersTable)
          .set({
            status: "final_inspection",
          })
          .where(
            and(
              eq(serviceOrdersTable.id, orderId),
              eq(serviceOrdersTable.status, "in_progress"),
            ),
          )
          .returning();

        if (!updated) {
          return null;
        }

        await tx.insert(serviceUpdatesTable).values({
          serviceOrderId: orderId,
          updatedBy: req.user!.id,
          status: "final_inspection",
          notes: bodyValidation.data.notes,
        });

        return updated;
      });

      if (!updatedOrder) {
        return res.status(409).json({
          success: false,
          message: "Service order status has changed",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Final inspection started successfully",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Final inspection error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // COMPLETE SERVICE
  completeServiceOrder = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const idValidation = serviceOrderIdSchema.safeParse(req.params);
      const bodyValidation = completeServiceOrderSchema.safeParse(req.body);

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

      const order = await db.query.serviceOrdersTable.findFirst({
        where: eq(serviceOrdersTable.id, orderId),
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Service order not found",
        });
      }

      if (order.status !== "final_inspection") {
        return res.status(400).json({
          success: false,
          message: "Final inspection must be completed first",
        });
      }

      const updatedOrder = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(serviceOrdersTable)
          .set({
            status: "completed",
            finalNotes: bodyValidation.data.finalNotes,
            finalTotal: bodyValidation.data.finalTotal.toString(),
            completedAt: new Date(),
          })
          .where(
            and(
              eq(serviceOrdersTable.id, orderId),
              eq(serviceOrdersTable.status, "final_inspection"),
            ),
          )
          .returning();

        if (!updated) {
          return null;
        }

        await tx.insert(serviceUpdatesTable).values({
          serviceOrderId: orderId,
          updatedBy: req.user!.id,
          status: "completed",
          notes: bodyValidation.data.finalNotes,
        });

        return updated;
      });

      if (!updatedOrder) {
        return res.status(409).json({
          success: false,
          message: "Service order status has changed",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Service completed successfully",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Complete service error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new AdminServiceOrderController();
