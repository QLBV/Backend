import { CorsOptions } from "cors";

const getAllowedOrigins = (): string[] => {
  const originsEnv = process.env.CORS_ORIGIN || "";

  
  const origins = originsEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0 && process.env.NODE_ENV === "development") {
    return ["http://localhost:3000", "http://localhost:5173"];
  }

  
  if (origins.length === 0 && process.env.NODE_ENV === "production") {
    console.error("️  CORS_ORIGIN not configured for production!");
    throw new Error("CORS_ORIGIN must be configured in production");
  }

  return origins;
};

const allowedOrigins = getAllowedOrigins();

console.log(` CORS allowed origins: ${allowedOrigins.join(", ")}`);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    
    if (!origin) {
      return callback(null, true);
    }

    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(` CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count"], 
  maxAge: 86400, 
};
