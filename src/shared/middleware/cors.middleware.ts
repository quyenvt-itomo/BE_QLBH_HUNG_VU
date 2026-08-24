import { config } from "@/config/env";
import cors from "cors";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://rnlgq04w-8080.asse.devtunnels.ms",
];

const corsMiddleware = cors({
  origin: (origin: any, callback: any) => {
    if (!config.NODE_ENV || config.NODE_ENV === "development") {
      callback(null, true);
      return;
    }
    // Check if the incoming request's origin is in the allowedOrigins array
    if (
      !origin || // undefined
      origin === "null" || // ⚠️ Flutter WebView
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-store-id",
    "x-device-id",
    "x-timezone",
    "x-ip-address",
    "x-refresh-token",
  ],
});

export default corsMiddleware;
