import { Request, Response } from "express";
import { and, desc, eq, gt, inArray } from "drizzle-orm";

import { db } from "../../config/db";
import {
  vehiclesTable,
  servicesTable,
  serviceOrdersTable,
  serviceOrderItemsTable,
} from "../../config/schema";

class ReminderController {
  // CUSTOMER - GET OIL SERVICE REMINDERS
  getMyReminders = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const history = await db
        .select({
          serviceOrderId: serviceOrdersTable.id,
          vehicleId: vehiclesTable.id,
          brand: vehiclesTable.brand,
          model: vehiclesTable.model,
          plateNumber: vehiclesTable.plateNumber,
          serviceId: servicesTable.id,
          serviceName: servicesTable.name,
          serviceCode: servicesTable.code,
          reminderIntervalDays: servicesTable.reminderIntervalDays,
          completedAt: serviceOrdersTable.completedAt,
        })
        .from(serviceOrdersTable)
        .innerJoin(
          vehiclesTable,
          eq(serviceOrdersTable.vehicleId, vehiclesTable.id),
        )
        .innerJoin(
          serviceOrderItemsTable,
          eq(serviceOrderItemsTable.serviceOrderId, serviceOrdersTable.id),
        )
        .innerJoin(
          servicesTable,
          eq(serviceOrderItemsTable.serviceId, servicesTable.id),
        )
        .where(
          and(
            eq(serviceOrdersTable.userId, req.user.id),
            eq(vehiclesTable.isActive, true),
            inArray(serviceOrdersTable.status, ["completed", "handed_over"]),
            eq(serviceOrderItemsTable.itemType, "service"),
            gt(servicesTable.reminderIntervalDays, 0),
          ),
        )
        .orderBy(desc(serviceOrdersTable.completedAt));

      // Only oil-related services, not every catalog service.
      const oilHistory = history.filter((item) => {
        const label = `${item.serviceName} ${item.serviceCode}`.toLowerCase();

        return /\boli\b|\boil\b/.test(label);
      });

      // One latest oil reminder per vehicle.
      const latestByVehicle = new Map<number, (typeof oilHistory)[number]>();

      for (const item of oilHistory) {
        if (item.completedAt && !latestByVehicle.has(item.vehicleId)) {
          latestByVehicle.set(item.vehicleId, item);
        }
      }

      const now = new Date();
      const MS_PER_DAY = 24 * 60 * 60 * 1000;

      const reminders = Array.from(latestByVehicle.values()).map((item) => {
        const completedAt = item.completedAt!;
        const interval = item.reminderIntervalDays!;

        // Calculate due date in UTC calendar days.
        const dueDate = new Date(completedAt);
        dueDate.setUTCHours(0, 0, 0, 0);
        dueDate.setUTCDate(dueDate.getUTCDate() + interval);

        const today = new Date(now);
        today.setUTCHours(0, 0, 0, 0);

        const daysUntilDue = Math.round(
          (dueDate.getTime() - today.getTime()) / MS_PER_DAY,
        );

        let status: "upcoming" | "due" | "overdue";

        if (daysUntilDue < 0) {
          status = "overdue";
        } else if (daysUntilDue <= 7) {
          status = "due";
        } else {
          status = "upcoming";
        }

        return {
          serviceOrderId: item.serviceOrderId,
          vehicleId: item.vehicleId,
          vehicle: {
            brand: item.brand,
            model: item.model,
            plateNumber: item.plateNumber,
          },
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          lastServiceAt: completedAt,
          reminderIntervalDays: interval,
          nextServiceAt: dueDate.toISOString(),
          daysUntilDue,
          status,
          message:
            status === "overdue"
              ? "Oil change is overdue"
              : status === "due"
                ? "Oil change is due soon"
                : "Oil change is not due yet",
        };
      });

      reminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

      return res.status(200).json({
        success: true,
        message: "Maintenance reminders retrieved successfully",
        data: reminders,
      });
    } catch (error) {
      console.error("Get reminders error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new ReminderController();
