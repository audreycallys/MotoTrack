import { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import PDFDocument from "pdfkit";

import { db } from "../../config/db";
import {
  paymentsTable,
  serviceOrdersTable,
  serviceOrderItemsTable,
  serviceUpdatesTable,
  vehiclesTable,
  usersTable,
} from "../../config/schema";
import { invoiceOrderIdSchema } from "../../validations/payments/invoice.validation";

const rupiah = (value: string | number) =>
  `Rp ${Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

class InvoiceController {
  // ADMIN - ISSUE INVOICE
  issueInvoice = async (req: Request, res: Response) => {
    const parsed = invoiceOrderIdSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid service order ID",
      });
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [order] = await tx
          .select()
          .from(serviceOrdersTable)
          .where(eq(serviceOrdersTable.id, parsed.data.id))
          .for("update");

        if (!order) {
          return { code: 404, message: "Service order not found" };
        }

        if (!["completed", "handed_over"].includes(order.status)) {
          return { code: 400, message: "Service is not completed" };
        }

        const [paid] = await tx
          .select()
          .from(paymentsTable)
          .where(
            and(
              eq(paymentsTable.serviceOrderId, order.id),
              eq(paymentsTable.status, "paid"),
            ),
          )
          .limit(1);

        if (!paid) {
          return { code: 400, message: "Payment is not completed" };
        }

        if (order.finalTotal === null || paid.amount !== order.finalTotal) {
          return { code: 409, message: "Payment amount mismatch" };
        }

        if (order.invoiceNumber) {
          return { code: 200, message: "Invoice already issued", data: order };
        }

        const invoiceNumber = `MT-INV-${String(order.id).padStart(6, "0")}`;

        const [updated] = await tx
          .update(serviceOrdersTable)
          .set({
            invoiceNumber,
            invoiceIssuedAt: new Date(),
          })
          .where(
            and(
              eq(serviceOrdersTable.id, order.id),
              eq(serviceOrdersTable.status, "completed"),
            ),
          )
          .returning();

        if (!updated) {
          return { code: 409, message: "Order status changed" };
        }

        return {
          code: 201,
          message: "Invoice issued successfully",
          data: updated,
        };
      });

      return res.status(result.code).json({
        success: result.code === 200 || result.code === 201,
        message: result.message,
        ...("data" in result ? { data: result.data } : {}),
      });
    } catch (error) {
      console.error("Issue invoice error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // CUSTOMER - DOWNLOAD OWN INVOICE
  downloadInvoice = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const parsed = invoiceOrderIdSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid service order ID",
      });
    }

    try {
      const [order] = await db
        .select()
        .from(serviceOrdersTable)
        .where(
          and(
            eq(serviceOrdersTable.id, parsed.data.id),
            eq(serviceOrdersTable.userId, req.user.id),
          ),
        )
        .limit(1);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Service order not found",
        });
      }

      if (!order.invoiceNumber || !order.invoiceIssuedAt) {
        return res.status(400).json({
          success: false,
          message: "Invoice has not been issued",
        });
      }

      const [payment] = await db
        .select()
        .from(paymentsTable)
        .where(
          and(
            eq(paymentsTable.serviceOrderId, order.id),
            eq(paymentsTable.status, "paid"),
          ),
        )
        .limit(1);

      if (!payment || order.finalTotal !== payment.amount) {
        return res.status(409).json({
          success: false,
          message: "Valid payment not found",
        });
      }

      const [customer] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, order.userId))
        .limit(1);

      const [vehicle] = await db
        .select()
        .from(vehiclesTable)
        .where(eq(vehiclesTable.id, order.vehicleId))
        .limit(1);

      const items = await db
        .select()
        .from(serviceOrderItemsTable)
        .where(eq(serviceOrderItemsTable.serviceOrderId, order.id));

      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      doc.on("error", (error) => {
        console.error("PDF generation error:", error);
        if (!res.headersSent) {
          res.status(500).end("PDF generation failed");
        } else {
          res.destroy(error);
        }
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${order.invoiceNumber}.pdf"`,
      );

      doc.pipe(res);

      doc.fontSize(22).font("Helvetica-Bold").text("MOTOTRACK");
      doc
        .fontSize(11)
        .font("Helvetica")
        .text("Motorcycle Workshop Service Invoice");

      doc.moveDown();
      doc.fontSize(16).font("Helvetica-Bold").text("INVOICE");
      doc.fontSize(10).font("Helvetica");

      doc.text(`Invoice Number: ${order.invoiceNumber}`);
      doc.text(
        `Issue Date: ${order.invoiceIssuedAt.toLocaleDateString("id-ID")}`,
      );
      doc.text(`Service Order: #${order.id}`);
      doc.text(`Customer: ${customer?.name ?? "-"}`);
      doc.text(`Email: ${customer?.email ?? "-"}`);
      doc.text(`Vehicle: ${vehicle?.brand ?? "-"} ${vehicle?.model ?? "-"}`);
      doc.text(`Plate Number: ${vehicle?.plateNumber ?? "-"}`);
      doc.text(`Mileage: ${order.mileage ?? "-"} km`);
      doc.text(`Payment Method: ${payment.method.toUpperCase()}`);
      doc.text(`Payment Status: PAID`);

      doc.moveDown();
      doc.font("Helvetica-Bold").fontSize(12).text("Service Details");
      doc.moveDown(0.5);

      doc.font("Helvetica").fontSize(10);

      if (items.length === 0) {
        doc.text("No detailed service items recorded.");
      } else {
        for (const item of items) {
          doc.text(`${item.name} (${item.itemType})`);
          doc.text(
            `${item.quantity} x ${rupiah(item.unitPrice)} = ${rupiah(item.subtotal)}`,
            { indent: 15 },
          );
          doc.moveDown(0.4);
        }
      }

      doc.moveDown();
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(`FINAL TOTAL: ${rupiah(order.finalTotal!)}`);

      doc.moveDown();
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(`Final Notes: ${order.finalNotes ?? "-"}`);

      doc.moveDown(2);
      doc.fontSize(9).text("Thank you for choosing MotoTrack.", {
        align: "center",
      });

      doc.end();
    } catch (error) {
      console.error("Download invoice error:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }

      res.destroy(error instanceof Error ? error : undefined);
    }
  };

  // ADMIN - HAND OVER VEHICLE
  handOverVehicle = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const parsed = invoiceOrderIdSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid service order ID",
      });
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [order] = await tx
          .select()
          .from(serviceOrdersTable)
          .where(eq(serviceOrdersTable.id, parsed.data.id))
          .for("update");

        if (!order) {
          return { code: 404, message: "Service order not found" };
        }

        if (order.status === "handed_over") {
          return { code: 409, message: "Vehicle already handed over" };
        }

        if (order.status !== "completed") {
          return { code: 400, message: "Service is not completed" };
        }

        if (!order.invoiceNumber || !order.invoiceIssuedAt) {
          return { code: 400, message: "Issue invoice first" };
        }

        const [payment] = await tx
          .select()
          .from(paymentsTable)
          .where(
            and(
              eq(paymentsTable.serviceOrderId, order.id),
              eq(paymentsTable.status, "paid"),
            ),
          )
          .limit(1);

        if (
          !payment ||
          order.finalTotal === null ||
          payment.amount !== order.finalTotal
        ) {
          return { code: 400, message: "Valid payment required" };
        }

        const [updated] = await tx
          .update(serviceOrdersTable)
          .set({
            status: "handed_over",
            handedOverAt: new Date(),
          })
          .where(
            and(
              eq(serviceOrdersTable.id, order.id),
              eq(serviceOrdersTable.status, "completed"),
            ),
          )
          .returning();

        if (!updated) {
          return { code: 409, message: "Order status changed" };
        }

        await tx.insert(serviceUpdatesTable).values({
          serviceOrderId: order.id,
          updatedBy: req.user!.id,
          status: "handed_over",
          notes: "Vehicle handed over to customer",
        });

        return {
          code: 200,
          message: "Vehicle handed over successfully",
          data: updated,
        };
      });

      return res.status(result.code).json({
        success: result.code === 200 && "data" in result,
        message: result.message,
        ...("data" in result ? { data: result.data } : {}),
      });
    } catch (error) {
      console.error("Hand over vehicle error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new InvoiceController();
