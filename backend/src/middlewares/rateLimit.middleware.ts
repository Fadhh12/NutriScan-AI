import rateLimit from "express-rate-limit";

/** Throttles auth attempts to slow down brute-force login/register abuse. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many attempts, please try again later" } },
});

/** Enforces SRS 2.1: max 1 scan per 3 seconds per user, to protect the 3rd-party API quota. */
export const scanRateLimiter = rateLimit({
  windowMs: 3 * 1000,
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Please wait a moment before scanning again" } },
});
