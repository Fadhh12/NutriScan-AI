import { Router } from "express";
import * as foodsController from "../controllers/foods.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const foodsRoutes = Router();

foodsRoutes.get("/", asyncHandler(foodsController.listFoods));
