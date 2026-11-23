import type { Request, Response } from "express";
import { db } from "../../config/db";
import { eq, and, ne } from "drizzle-orm";
import { servicesTable } from "../../config/schema";

import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
} from "../../validations/services/service.validation";

export class ServiceController {
  // CREATE SERVICE
  createService = async (req: Request, res: Response) => {
    try {
      const validation = createServiceSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.issues,
        });
      }

      const data = validation.data;

      const existingService = await db.query.servicesTable.findFirst({
        where: eq(servicesTable.code, data.code),
      });

      if (existingService) {
        return res.status(409).json({
          success: false,
          message: "Service code already exists",
        });
      }

      const [newService] = await db
        .insert(servicesTable)
        .values({
          code: data.code,
          name: data.name,
          description: data.description ?? null,
          basePrice: data.basePrice.toString(),
          reminderIntervalDays: data.reminderIntervalDays ?? null,
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: newService,
      });
    } catch (error: unknown) {
      const dbError = error as {
        code?: string;
        cause?: { code?: string };
      };

      if (dbError.code === "23505" || dbError.cause?.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Service code already exists",
        });
      }

      console.error("Create service error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // GET ALL ACTIVE SERVICES
  getServices = async (req: Request, res: Response) => {
    try {
      const services = await db.query.servicesTable.findMany({
        where: eq(servicesTable.isActive, true),
      });

      return res.status(200).json({
        success: true,
        message: "Services retrieved successfully",
        data: services,
      });
    } catch (error) {
      console.error("Get services error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // GET SERVICE BY ID
  getServiceById = async (req: Request, res: Response) => {
    try {
      const validation = serviceIdSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid service ID",
        });
      }

      const service = await db.query.servicesTable.findFirst({
        where: and(
          eq(servicesTable.id, validation.data.id),
          eq(servicesTable.isActive, true),
        ),
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Service retrieved successfully",
        data: service,
      });
    } catch (error) {
      console.error("Get service error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // UPDATE SERVICE
  updateService = async (req: Request, res: Response) => {
    try {
      const idValidation = serviceIdSchema.safeParse(req.params);
      const bodyValidation = updateServiceSchema.safeParse(req.body);

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

      const serviceId = idValidation.data.id;
      const data = bodyValidation.data;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No service data provided",
        });
      }

      const existingService = await db.query.servicesTable.findFirst({
        where: and(
          eq(servicesTable.id, serviceId),
          eq(servicesTable.isActive, true),
        ),
      });

      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      if (data.code) {
        const duplicateCode = await db.query.servicesTable.findFirst({
          where: and(
            eq(servicesTable.code, data.code),
            ne(servicesTable.id, serviceId),
          ),
        });

        if (duplicateCode) {
          return res.status(409).json({
            success: false,
            message: "Service code already exists",
          });
        }
      }

      const [updatedService] = await db
        .update(servicesTable)
        .set({
          ...(data.code !== undefined && { code: data.code }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.basePrice !== undefined && {
            basePrice: data.basePrice.toString(),
          }),
          ...(data.reminderIntervalDays !== undefined && {
            reminderIntervalDays: data.reminderIntervalDays,
          }),
        })
        .where(
          and(
            eq(servicesTable.id, serviceId),
            eq(servicesTable.isActive, true),
          ),
        )
        .returning();

      if (!updatedService) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: updatedService,
      });
    } catch (error: unknown) {
      const dbError = error as {
        code?: string;
        cause?: { code?: string };
      };

      if (dbError.code === "23505" || dbError.cause?.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Service code already exists",
        });
      }

      console.error("Update service error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // DELETE SERVICE (SOFT DELETE)
  deleteService = async (req: Request, res: Response) => {
    try {
      const validation = serviceIdSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid service ID",
        });
      }

      const [deletedService] = await db
        .update(servicesTable)
        .set({
          isActive: false,
        })
        .where(
          and(
            eq(servicesTable.id, validation.data.id),
            eq(servicesTable.isActive, true),
          ),
        )
        .returning({
          id: servicesTable.id,
        });

      if (!deletedService) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Service deactivated successfully",
      });
    } catch (error) {
      console.error("Delete service error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new ServiceController();
