import { Request, Response } from "express";
import { eq } from "drizzle-orm";

import { db } from "../../config/db";
import { paymentsTable, serviceOrdersTable } from "../../config/schema";

import { createCashPaymentSchema } from "../../validations/payments/payment.validation";

class PaymentController {
  // ADMIN - CREATE CASH PAYMENT
  createCashPayment = async (req: Request, res: Response) => {
    try {
      const validation = createCashPaymentSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment data",
          errors: validation.error.flatten(),
        });
      }

      const { serviceOrderId } = validation.data;

      const result = await db.transaction(async (tx) => {
        // Lock service order to prevent simultaneous payments
        const [order] = await tx
          .select()
          .from(serviceOrdersTable)
          .where(eq(serviceOrdersTable.id, serviceOrderId))
          .for("update");

        if (!order) {
          return {
            code: 404,
            message: "Service order not found",
            payment: null,
          };
        }

        if (order.status !== "completed") {
          return {
            code: 400,
            message: "Service order must be completed before payment",
            payment: null,
          };
        }

        if (
          order.finalTotal === null ||
          !Number.isFinite(Number(order.finalTotal)) ||
          Number(order.finalTotal) <= 0
        ) {
          return {
            code: 400,
            message: "Service order does not have a valid final total",
            payment: null,
          };
        }

        // Find existing payments
        const existingPayments = await tx
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.serviceOrderId, serviceOrderId));

        const paidPayment = existingPayments.find(
          (payment) => payment.status === "paid",
        );

        if (paidPayment) {
          return {
            code: 409,
            message: "Service order has already been paid",
            payment: null,
          };
        }

        const pendingPayment = existingPayments.find(
          (payment) => payment.status === "pending",
        );

        if (pendingPayment) {
          return {
            code: 409,
            message: "Another payment is still pending",
            payment: null,
          };
        }

        // Amount is always obtained from the service order
        const [payment] = await tx
          .insert(paymentsTable)
          .values({
            serviceOrderId: order.id,
            method: "cash",
            amount: order.finalTotal,
            status: "paid",
            paidAt: new Date(),
          })
          .returning();

        return {
          code: 201,
          message: "Cash payment recorded successfully",
          payment,
        };
      });

      if (!result.payment) {
        return res.status(result.code).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(201).json({
        success: true,
        message: result.message,
        data: result.payment,
      });
    } catch (error) {
      console.error("Create cash payment error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new PaymentController();
