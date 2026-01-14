import logger from "../utils/logger";

interface EnvConfig {
  // Application
  NODE_ENV: string;
  PORT: string;
  FRONTEND_URL?: string;
  CLIENT_URL?: string; // Frontend URL for email links (reset password, etc.)

  // Database
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;

  // JWT
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN?: string;
  JWT_REFRESH_EXPIRES_IN?: string;

  // Redis (Optional for development)
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;

  // OAuth (Optional)
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_CALLBACK_URL?: string;

  // Email (Optional)
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;

  // CORS
  CORS_ORIGIN?: string;
}

/**
 * Validate required environment variables
 * Throws error if any required variable is missing
 */
export const validateEnv = (): void => {
  const requiredEnvVars: (keyof EnvConfig)[] = [
    "NODE_ENV",
    "PORT",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
  ];

  const missingVars: string[] = [];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(", ")}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Validate JWT secrets strength in production
  if (process.env.NODE_ENV === "production") {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production");
    }
    if (
      process.env.JWT_REFRESH_SECRET &&
      process.env.JWT_REFRESH_SECRET.length < 32
    ) {
      throw new Error(
        "JWT_REFRESH_SECRET must be at least 32 characters in production"
      );
    }
  }

  // Validate CORS_ORIGIN in production
  if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGIN) {
    logger.warn(
      "⚠️  CORS_ORIGIN not configured for production! This may cause CORS issues."
    );
  }

  // Validate database port
  const dbPort = parseInt(process.env.DB_PORT || "3306");
  if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error("DB_PORT must be a valid port number (1-65535)");
  }

  // Validate application port
  const appPort = parseInt(process.env.PORT || "5000");
  if (isNaN(appPort) || appPort < 1 || appPort > 65535) {
    throw new Error("PORT must be a valid port number (1-65535)");
  }

  logger.info("✅ Environment variables validated successfully");
};

/**
 * Get environment variable with type safety
 */
export const getEnv = (key: keyof EnvConfig, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};

/**
 * Get environment variable as number
 */
export const getEnvNumber = (
  key: keyof EnvConfig,
  defaultValue?: number
): number => {
  const value = process.env[key];
  if (!value && defaultValue !== undefined) {
    return defaultValue;
  }
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return num;
};

/**
 * Get environment variable as boolean
 */
export const getEnvBoolean = (
  key: keyof EnvConfig,
  defaultValue?: boolean
): boolean => {
  const value = process.env[key];
  if (!value && defaultValue !== undefined) {
    return defaultValue;
  }
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value.toLowerCase() === "true" || value === "1";
};
