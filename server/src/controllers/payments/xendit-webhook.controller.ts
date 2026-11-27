import { Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";

import { db } from "../../config/db";
import { paymentsTable, serviceOrdersTable } from "../../config/schema";
import { xenditConfig } from "../../config/xendit";

type XenditSession = {
  payment_session_id: string;
  reference_id: string;
  status: string;
  amount: number;
  currency: string;
  session_type: string;
  capture_method?: string;
};

function validWebhookToken(value: unknown): boolean {
  const expected = xenditConfig.webhookToken;

  if (!expected || typeof value !== "string" || value.length === 0) {
    return false;
  }

  const a = Buffer.from(value);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

async function getXenditSession(sessionId: string): Promise<XenditSession> {
  if (!xenditConfig.secretKey) {
    throw new Error("Xendit secret key is missing");
  }

  const authorization = Buffer.from(`${xenditConfig.secretKey}:`).toString(
    "base64",
  );

  const response = await fetch(
    `${xenditConfig.baseUrl}/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${authorization}`,
      },
      signal: AbortSignal.timeout(15000),
    },
  );

  if (!response.ok) {
    console.error("Xendit session verification failed:", response.status);
    throw new Error("Cannot verify payment session");
  }

  return (await response.json()) as XenditSession;
}

class XenditWebhookController {
  handleWebhook = async (req: Request, res: Response) => {
    if (!validWebhookToken(req.headers["x-callback-token"])) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook token",
      });
    }

    const event = req.body?.event;

    if (
      event !== "payment_session.completed" &&
      event !== "payment_session.expired"
    ) {
      return res.status(200).json({
        success: true,
        message: "Event ignored",
      });
    }

    // Xendit uses data.payment_session_id in the
    // current API. Some sample payloads use data.id.
    const sessionId = req.body?.data?.payment_session_id ?? req.body?.data?.id;

    if (
      typeof sessionId !== "string" ||
      !/^ps-[a-zA-Z0-9-]+$/.test(sessionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment session ID",
      });
    }

    try {
      // Never trust webhook body for payment status.
      const session = await getXenditSession(sessionId);

      if (session.payment_session_id !== sessionId) {
        return res.status(409).json({
          success: false,
          message: "Session ID mismatch",
        });
      }

      const expectedStatus =
        event === "payment_session.completed" ? "COMPLETED" : "EXPIRED";

      if (session.status !== expectedStatus) {
        return res.status(409).json({
          success: false,
          message: "Session status is not confirmed",
        });
      }

      const result = await db.transaction(async (tx) => {
        const [payment] = await tx
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.paymentSessionId, sessionId));

        if (!payment) {
          return "not_found";
        }

        // Lock the corresponding order to avoid
        // concurrent cash and Xendit confirmations.
        const [order] = await tx
          .select()
          .from(serviceOrdersTable)
          .where(eq(serviceOrdersTable.id, payment.serviceOrderId))
          .for("update");

        if (!order) {
          return "invalid";
        }

        const [current] = await tx
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.id, payment.id));

        if (!current) {
          return "not_found";
        }

        if (current.status === "paid") {
          return session.status === "COMPLETED" ? "duplicate" : "ignored";
        }

        if (current.status !== "pending") {
          return "ignored";
        }

        if (
          current.method !== "xendit" ||
          current.externalId !== session.reference_id ||
          session.currency !== "IDR" ||
          session.session_type !== "PAY" ||
          session.capture_method === "MANUAL" ||
          !Number.isSafeInteger(session.amount) ||
          session.amount <= 0 ||
          session.amount !== Number(current.amount) ||
          session.amount !== Number(order.finalTotal)
        ) {
          return "invalid";
        }

        if (session.status === "COMPLETED") {
          const [alreadyPaid] = await tx
            .select()
            .from(paymentsTable)
            .where(
              and(
                eq(paymentsTable.serviceOrderId, order.id),
                eq(paymentsTable.status, "paid"),
              ),
            );

          if (alreadyPaid) {
            return "invalid";
          }
        }

        const [updated] = await tx
          .update(paymentsTable)
          .set(
            session.status === "COMPLETED"
              ? {
                  status: "paid",
                  paidAt: new Date(),
                }
              : {
                  status: "expired",
                },
          )
          .where(
            and(
              eq(paymentsTable.id, current.id),
              eq(paymentsTable.status, "pending"),
            ),
          )
          .returning();

        return updated ? "updated" : "ignored";
      });

      if (result === "not_found") {
        // Retry after checkout controller has stored
        // the paymentSessionId in PostgreSQL.
        return res.status(503).json({
          success: false,
          message: "Payment not ready",
        });
      }

      if (result === "invalid") {
        console.error("Xendit payment data mismatch:", sessionId);

        return res.status(409).json({
          success: false,
          message: "Payment verification failed",
        });
      }

      return res.status(200).json({
        success: true,
        message: result,
      });
    } catch (error) {
      console.error("Xendit webhook error:", error);

      return res.status(500).json({
        success: false,
        message: "Webhook processing failed",
      });
    }
  };
}

export default new XenditWebhookController();
