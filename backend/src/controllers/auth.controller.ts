import type { Request, Response } from "express";
import { getUserById, loginUser, registerUser } from "../services/auth.service";
import { ok } from "../utils/response";
import { AppError } from "../utils/AppError";

export async function register(req: Request, res: Response) {
  const { name, email, password, dailyCalorieTarget } = req.body;
  const result = await registerUser({ name, email, password, dailyCalorieTarget });
  return ok(res, result, 201);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await loginUser({ email, password });
  return ok(res, result);
}

export async function me(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }
  const user = await getUserById(req.auth.sub);
  return ok(res, user);
}
