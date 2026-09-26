import { Router } from "express";
import * as logController from "../controllers/log.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

export const logRoutes = Router();

logRoutes.get("/", requireAuth, asyncHandler(logController.getLogs));
logRoutes.delete("/:id", requireAuth, asyncHandler(logController.removeLog));
