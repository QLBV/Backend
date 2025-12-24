import rateLimit from "express-rate-limit";

export const bookingRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10, // tối đa 10 request/phút
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "TOO_MANY_REQUESTS" },
});
