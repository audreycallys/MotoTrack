import express from "express";
import dotenv from "dotenv";

import authRoutes from "./routes/auth/auth.route";
import vehicleRoutes from "./routes/vehicles/vehicle.route";
import serviceRoutes from "./routes/services/service.route";
import serviceOrderRoutes from "./routes/service-orders/service-order.route";
import adminServiceOrderRoutes from "./routes/service-orders/admin-service-order.route";

import { swaggerUi, swaggerSpec } from "./config/swagger";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello! This is MotoTrack Developer!");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/service-orders", serviceOrderRoutes);
app.use("/api/admin/service-orders", adminServiceOrderRoutes);

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});
