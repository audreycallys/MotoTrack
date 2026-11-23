import type { Request, Response } from "express";
import { db } from "../../config/db";
import { eq, and } from "drizzle-orm";
import { vehiclesTable } from "../../config/schema";

import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdSchema,
} from "../../validations/vehicles/vehicle.validation";

export class VehicleController {
  // CREATE VEHICLE
  createVehicle = async (req: Request, res: Response) => {
    try {
      const validation = createVehicleSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.issues,
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { brand, model, plateNumber, year } = validation.data;

      const existingVehicle = await db.query.vehiclesTable.findFirst({
        where: eq(vehiclesTable.plateNumber, plateNumber),
      });

      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          message: "Plate number already registered",
        });
      }

      const [newVehicle] = await db
        .insert(vehiclesTable)
        .values({
          userId: req.user.id,
          brand,
          model,
          plateNumber,
          year,
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Vehicle created successfully",
        data: newVehicle,
      });
    } catch (error: unknown) {
      const dbError = error as {
        code?: string;
        cause?: { code?: string };
      };

      if (dbError.code === "23505" || dbError.cause?.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Plate number already registered",
        });
      }

      console.error("Create vehicle error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // GET ALL MY VEHICLES
  getVehicles = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const vehicles = await db.query.vehiclesTable.findMany({
        where: and(
          eq(vehiclesTable.userId, req.user.id),
          eq(vehiclesTable.isActive, true),
        ),
      });

      return res.status(200).json({
        success: true,
        message: "Vehicles retrieved successfully",
        data: vehicles,
      });
    } catch (error) {
      console.error("Get vehicles error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // GET VEHICLE BY ID
  getVehicleById = async (req: Request, res: Response) => {
    try {
      const validation = vehicleIdSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle ID",
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const vehicle = await db.query.vehiclesTable.findFirst({
        where: and(
          eq(vehiclesTable.id, validation.data.id),
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

      return res.status(200).json({
        success: true,
        message: "Vehicle retrieved successfully",
        data: vehicle,
      });
    } catch (error) {
      console.error("Get vehicle error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // UPDATE VEHICLE
  updateVehicle = async (req: Request, res: Response) => {
    try {
      const idValidation = vehicleIdSchema.safeParse(req.params);
      const bodyValidation = updateVehicleSchema.safeParse(req.body);

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

      if (Object.keys(bodyValidation.data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No vehicle data provided",
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const vehicleId = idValidation.data.id;
      const userId = req.user.id;
      const data = bodyValidation.data;

      const existingVehicle = await db.query.vehiclesTable.findFirst({
        where: and(
          eq(vehiclesTable.id, vehicleId),
          eq(vehiclesTable.userId, userId),
          eq(vehiclesTable.isActive, true),
        ),
      });

      if (!existingVehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      if (data.plateNumber) {
        const duplicatePlate = await db.query.vehiclesTable.findFirst({
          where: eq(vehiclesTable.plateNumber, data.plateNumber),
        });

        if (duplicatePlate && duplicatePlate.id !== vehicleId) {
          return res.status(409).json({
            success: false,
            message: "Plate number already registered",
          });
        }
      }

      const [updatedVehicle] = await db
        .update(vehiclesTable)
        .set(data)
        .where(
          and(
            eq(vehiclesTable.id, vehicleId),
            eq(vehiclesTable.userId, userId),
            eq(vehiclesTable.isActive, true),
          ),
        )
        .returning();

      if (!updatedVehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Vehicle updated successfully",
        data: updatedVehicle,
      });
    } catch (error: unknown) {
      const dbError = error as {
        code?: string;
        cause?: { code?: string };
      };

      if (dbError.code === "23505" || dbError.cause?.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Plate number already registered",
        });
      }

      console.error("Update vehicle error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // DELETE VEHICLE (SOFT DELETE)
  deleteVehicle = async (req: Request, res: Response) => {
    try {
      const validation = vehicleIdSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle ID",
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const [deletedVehicle] = await db
        .update(vehiclesTable)
        .set({
          isActive: false,
        })
        .where(
          and(
            eq(vehiclesTable.id, validation.data.id),
            eq(vehiclesTable.userId, req.user.id),
            eq(vehiclesTable.isActive, true),
          ),
        )
        .returning({
          id: vehiclesTable.id,
        });

      if (!deletedVehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Vehicle deactivated successfully",
      });
    } catch (error) {
      console.error("Delete vehicle error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new VehicleController();
