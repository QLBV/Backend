import { CorsOptions } from "cors";

/**
 * CORS Configuration
 * Whitelist specific origins instead of allowing all (*)
 */

// Parse allowed origins from environment variable
const getAllowedOrigins = (): string[] => {
  const originsEnv = process.env.CORS_ORIGIN || "";

  // Support comma-separated origins: "http://localhost:3000,https://app.example.com"
  const origins = originsEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  // Default to localhost in development
  if (origins.length === 0 && process.env.NODE_ENV === "development") {
    return ["http://localhost:3000", "http://localhost:5173"];
  }

  // In production, MUST have explicit origins
  if (origins.length === 0 && process.env.NODE_ENV === "production") {
    console.error("⚠️  CORS_ORIGIN not configured for production!");
    throw new Error("CORS_ORIGIN must be configured in production");
  }

  return origins;
};

const allowedOrigins = getAllowedOrigins();

console.log(`✅ CORS allowed origins: ${allowedOrigins.join(", ")}`);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true, // Allow cookies, authorization headers
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count"], // For pagination
  maxAge: 86400, // 24 hours - cache preflight requests
};
