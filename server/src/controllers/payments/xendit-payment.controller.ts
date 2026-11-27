import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../../config/db";
import { paymentsTable, serviceOrdersTable } from "../../config/schema";
import { xenditConfig } from "../../config/xendit";
import { createXenditPaymentSchema } from "../../validations/payments/xendit.validation";

type XenditSession = {
  payment_session_id: string;
  reference_id: string;
  status: string;
  payment_link_url: string;
};

class XenditPaymentController {
  createPayment = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const validation = createXenditPaymentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment data",
      });
    }

    if (
      !xenditConfig.secretKey ||
      !xenditConfig.successUrl ||
      !xenditConfig.cancelUrl
    ) {
      return res.status(500).json({
        success: false,
        message: "Xendit configuration is incomplete",
      });
    }

    const { serviceOrderId } = validation.data;

    try {
      const result = await db.transaction(async (tx) => {
        const [order] = await tx
          .select()
          .from(serviceOrdersTable)
          .where(eq(serviceOrdersTable.id, serviceOrderId))
          .for("update");

        if (!order || order.userId !== req.user!.id) {
          return {
            code: 404,
            message: "Service order not found",
          };
        }

        if (order.status !== "completed") {
          return {
            code: 400,
            message: "Service order must be completed",
          };
        }

        const amount = Number(order.finalTotal);

        if (
          order.finalTotal === null ||
          !Number.isSafeInteger(amount) ||
          amount <= 0
        ) {
          return {
            code: 400,
            message: "Invalid final total",
          };
        }

        const existingPayments = await tx
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.serviceOrderId, serviceOrderId));

        if (existingPayments.some((payment) => payment.status === "paid")) {
          return {
            code: 409,
            message: "Service order already paid",
          };
        }

        if (existingPayments.some((payment) => payment.status === "pending")) {
          return {
            code: 409,
            message: "A payment is already pending",
          };
        }

        const referenceId = `mt-${serviceOrderId}-${randomUUID()}`;

        const [payment] = await tx
          .insert(paymentsTable)
          .values({
            serviceOrderId,
            method: "xendit",
            amount: order.finalTotal,
            status: "pending",
            externalId: referenceId,
          })
          .returning();

        return {
          code: 201,
          payment,
          amount,
          referenceId,
        };
      });

      if (!("payment" in result) || !result.payment) {
        return res.status(result.code).json({
          success: false,
          message: result.message,
        });
      }

      const { payment, amount, referenceId } = result;

      const basicAuth = Buffer.from(`${xenditConfig.secretKey}:`).toString(
        "base64",
      );

      let response: globalThis.Response;

      try {
        response = await fetch(`${xenditConfig.baseUrl}/sessions`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reference_id: referenceId,
            session_type: "PAY",
            mode: "PAYMENT_LINK",
            amount,
            currency: "IDR",
            country: "ID",
            capture_method: "AUTOMATIC",
            description: `MotoTrack Service Order #${serviceOrderId}`,
            success_return_url: xenditConfig.successUrl,
            cancel_return_url: xenditConfig.cancelUrl,
          }),
          signal: AbortSignal.timeout(15000),
        });
      } catch (error) {
        console.error("Xendit request failed:", error);

        return res.status(502).json({
          success: false,
          message: "Xendit connection failed",
          paymentId: payment.id,
        });
      }

      if (!response.ok) {
        const errorBody = await response.text();

        console.error("Xendit API error:", response.status, errorBody);

        return res.status(502).json({
          success: false,
          message: "Failed to create Xendit checkout",
          paymentId: payment.id,
        });
      }

      const session = (await response.json()) as XenditSession;

      if (
        !session.payment_session_id ||
        !session.payment_link_url ||
        session.reference_id !== referenceId
      ) {
        return res.status(502).json({
          success: false,
          message: "Invalid Xendit session response",
          paymentId: payment.id,
        });
      }

      const [updatedPayment] = await db
        .update(paymentsTable)
        .set({
          paymentSessionId: session.payment_session_id,
          paymentUrl: session.payment_link_url,
        })
        .where(eq(paymentsTable.id, payment.id))
        .returning();

      return res.status(201).json({
        success: true,
        message: "Xendit checkout created successfully",
        data: updatedPayment,
      });
    } catch (error) {
      console.error("Create Xendit payment error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new XenditPaymentController();
