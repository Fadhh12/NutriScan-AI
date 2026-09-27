import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError";

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(", ");
      throw new AppError(message, 422, "VALIDATION_ERROR");
    }
    req.body = result.data;
    next();
  };
}

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dailyCalorieTarget: z
    .number()
    .int()
    .min(800, "Daily calorie target must be between 800 and 6000")
    .max(6000, "Daily calorie target must be between 800 and 6000")
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const confirmScanSchema = z
  .object({
    confirmed: z.boolean().optional(),
    rejected: z.boolean().optional(),
    foodName: z.string().trim().min(1).optional(),
    portionEstimateG: z.number().positive().optional(),
    mealType: mealTypeSchema.optional(),
  })
  .refine((data) => data.confirmed || data.rejected || data.foodName, {
    message: "Provide one of: confirmed, rejected, or foodName",
  });

export const manualEntrySchema = z.object({
  foodName: z.string().trim().min(1, "Food name is required"),
  portionEstimateG: z.number().positive("Portion must be a positive number"),
  mealType: mealTypeSchema.optional(),
  source: z.enum(["barcode", "table"]),
  nutrition: z
    .object({
      calories: z.number().nonnegative(),
      proteinG: z.number().nonnegative(),
      carbsG: z.number().nonnegative(),
      fatG: z.number().nonnegative(),
      fiberG: z.number().nonnegative().optional(),
      sugarG: z.number().nonnegative().optional(),
    })
    .optional(),
});

export const updateTargetSchema = z.object({
  dailyCalorieTarget: z
    .number()
    .int()
    .min(800, "Daily calorie target must be between 800 and 6000")
    .max(6000, "Daily calorie target must be between 800 and 6000"),
});
