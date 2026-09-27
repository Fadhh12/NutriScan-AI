import { Router } from "express";
import * as aiChatController from "../controllers/aiChat.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { chatRateLimiter } from "../middlewares/rateLimit.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { chatSchema, validateBody } from "../utils/validation";

export const aiChatRoutes = Router();

aiChatRoutes.post("/chat", requireAuth, chatRateLimiter, validateBody(chatSchema), asyncHandler(aiChatController.chat));
