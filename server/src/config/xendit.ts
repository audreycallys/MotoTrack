import dotenv from "dotenv";

dotenv.config();

export const xenditConfig = {
  baseUrl: "https://api.xendit.co",

  secretKey: process.env.XENDIT_SECRET_KEY,
  webhookToken: process.env.XENDIT_WEBHOOK_TOKEN,
  successUrl: process.env.XENDIT_SUCCESS_URL,
  cancelUrl: process.env.XENDIT_CANCEL_URL,
};
