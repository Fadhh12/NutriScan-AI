import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { authRateLimiter } from "../middlewares/rateLimit.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { loginSchema, registerSchema, validateBody } from "../utils/validation";

export const authRoutes = Router();

authRoutes.post(
  "/register",
  authRateLimiter,
  validateBody(registerSchema),
  asyncHandler(authController.register),
);
authRoutes.post(
  "/login",
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(authController.login),
);
authRoutes.get("/me", requireAuth, asyncHandler(authController.me));
