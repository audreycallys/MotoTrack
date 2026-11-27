import express from "express";
import dotenv from "dotenv";

import authRoutes from "./routes/auth/auth.route";
import vehicleRoutes from "./routes/vehicles/vehicle.route";
import serviceRoutes from "./routes/services/service.route";
import serviceOrderRoutes from "./routes/service-orders/service-order.route";
import adminServiceOrderRoutes from "./routes/service-orders/admin-service-order.route";
import paymentRoutes from "./routes/payments/payment.route";

import { swaggerUi, swaggerSpec } from "./config/swagger";

import xenditPaymentRoutes from "./routes/payments/xendit-payment.route";
import xenditWebhookRoutes from "./routes/payments/xendit-webhook.route";

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
app.use("/api/admin/payments", paymentRoutes);
app.use("/api/payments", xenditPaymentRoutes);
app.use("/api/webhooks", xenditWebhookRoutes);

// XENDIT PAYMENT SUCCESS PAGE
app.get("/payment/success", (req, res) => {
  res.status(200).send(`
    <html>
      <body style="font-family: Arial; text-align: center; padding: 60px;">
        <h2>Checkout MotoTrack Selesai</h2>
        <p>Silakan kembali ke MotoTrack untuk memeriksa status pembayaran.</p>
        <p>Status pembayaran akan dikonfirmasi melalui Xendit.</p>
      </body>
    </html>
  `);
});

// XENDIT PAYMENT CANCEL PAGE
app.get("/payment/cancel", (req, res) => {
  res.status(200).send(`
    <html>
      <body style="font-family: Arial; text-align: center; padding: 60px;">
        <h2>Checkout Dibatalkan</h2>
        <p>Silakan kembali ke MotoTrack.</p>
      </body>
    </html>
  `);
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});
