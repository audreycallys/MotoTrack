import { Request, Response } from "express";
import { desc, eq } from "drizzle-orm";

import { db } from "../../config/db";
import { paymentsTable, serviceOrdersTable } from "../../config/schema";

import { paymentHistoryIdSchema } from "../../validations/payments/payment-history.validation";

class PaymentHistoryController {
  // ADMIN - GET ALL PAYMENTS
  getAllPayments = async (req: Request, res: Response) => {
    try {
      const payments = await db
        .select({
          id: paymentsTable.id,
          serviceOrderId: paymentsTable.serviceOrderId,
          method: paymentsTable.method,
          amount: paymentsTable.amount,
          status: paymentsTable.status,
          externalId: paymentsTable.externalId,
          paymentSessionId: paymentsTable.paymentSessionId,
          paymentUrl: paymentsTable.paymentUrl,
          paidAt: paymentsTable.paidAt,
          createdAt: paymentsTable.createdAt,
          customerId: serviceOrdersTable.userId,
          serviceStatus: serviceOrdersTable.status,
        })
        .from(paymentsTable)
        .innerJoin(
          serviceOrdersTable,
          eq(paymentsTable.serviceOrderId, serviceOrdersTable.id),
        )
        .orderBy(desc(paymentsTable.createdAt));

      return res.status(200).json({
        success: true,
        message: "Payments retrieved successfully",
        data: payments,
      });
    } catch (error) {
      console.error("Get all payments error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // CUSTOMER - GET OWN PAYMENT HISTORY
  getMyPayments = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const payments = await db
        .select({
          id: paymentsTable.id,
          serviceOrderId: paymentsTable.serviceOrderId,
          method: paymentsTable.method,
          amount: paymentsTable.amount,
          status: paymentsTable.status,
          paymentUrl: paymentsTable.paymentUrl,
          paidAt: paymentsTable.paidAt,
          createdAt: paymentsTable.createdAt,
        })
        .from(paymentsTable)
        .innerJoin(
          serviceOrdersTable,
          eq(paymentsTable.serviceOrderId, serviceOrdersTable.id),
        )
        .where(eq(serviceOrdersTable.userId, req.user.id))
        .orderBy(desc(paymentsTable.createdAt));

      return res.status(200).json({
        success: true,
        message: "Payment history retrieved successfully",
        data: payments,
      });
    } catch (error) {
      console.error("Get my payments error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // CUSTOMER - GET OWN PAYMENT DETAIL
  getMyPaymentById = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const validation = paymentHistoryIdSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment ID",
        });
      }

      const [payment] = await db
        .select({
          id: paymentsTable.id,
          serviceOrderId: paymentsTable.serviceOrderId,
          method: paymentsTable.method,
          amount: paymentsTable.amount,
          status: paymentsTable.status,
          paymentSessionId: paymentsTable.paymentSessionId,
          paymentUrl: paymentsTable.paymentUrl,
          paidAt: paymentsTable.paidAt,
          createdAt: paymentsTable.createdAt,
        })
        .from(paymentsTable)
        .innerJoin(
          serviceOrdersTable,
          eq(paymentsTable.serviceOrderId, serviceOrdersTable.id),
        )
        .where(eq(paymentsTable.id, validation.data.id))
        .limit(1);

      // Check ownership without revealing other customers' payments
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      const [ownedPayment] = await db
        .select({
          id: paymentsTable.id,
        })
        .from(paymentsTable)
        .innerJoin(
          serviceOrdersTable,
          eq(paymentsTable.serviceOrderId, serviceOrdersTable.id),
        )
        .where(eq(serviceOrdersTable.userId, req.user.id));

      // The ownership query above should target the exact payment.
      // Use a scoped query below for the final ownership check.
      const [verifiedPayment] = await db
        .select({ id: paymentsTable.id })
        .from(paymentsTable)
        .innerJoin(
          serviceOrdersTable,
          eq(paymentsTable.serviceOrderId, serviceOrdersTable.id),
        )
        .where(eq(paymentsTable.id, payment.id));

      void ownedPayment;
      void verifiedPayment;

      // Retrieve order owner before returning any payment information.
      const [order] = await db
        .select({ userId: serviceOrdersTable.userId })
        .from(serviceOrdersTable)
        .where(eq(serviceOrdersTable.id, payment.serviceOrderId));

      if (!order || order.userId !== req.user.id) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment retrieved successfully",
        data: payment,
      });
    } catch (error) {
      console.error("Get payment detail error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new PaymentHistoryController();
