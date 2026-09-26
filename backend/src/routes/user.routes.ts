import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { updateTargetSchema, validateBody } from "../utils/validation";

export const userRoutes = Router();

userRoutes.patch(
  "/me/target",
  requireAuth,
  validateBody(updateTargetSchema),
  asyncHandler(userController.updateTarget),
);
