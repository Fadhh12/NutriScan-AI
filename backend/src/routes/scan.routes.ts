import { Router } from "express";
import * as scanController from "../controllers/scan.controller";
import { optionalAuth } from "../middlewares/auth.middleware";
import { scanRateLimiter } from "../middlewares/rateLimit.middleware";
import { uploadScanPhotoMiddleware } from "../middlewares/upload.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { confirmScanSchema, validateBody } from "../utils/validation";

export const scanRoutes = Router();

scanRoutes.post(
  "/",
  optionalAuth,
  scanRateLimiter,
  uploadScanPhotoMiddleware,
  asyncHandler(scanController.scanPhoto),
);
scanRoutes.get("/:id", optionalAuth, asyncHandler(scanController.getScan));
scanRoutes.patch(
  "/:id/confirm",
  optionalAuth,
  validateBody(confirmScanSchema),
  asyncHandler(scanController.confirmScan),
);
