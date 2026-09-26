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
