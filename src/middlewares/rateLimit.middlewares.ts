import rateLimit from "express-rate-limit";

export const bookingRateLimit = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "TOO_MANY_REQUESTS" },
});
