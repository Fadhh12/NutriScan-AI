import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { updateDailyCalorieTarget } from "../services/user.service";

export async function updateTarget(req: Request, res: Response) {
  const { dailyCalorieTarget } = req.body as { dailyCalorieTarget: number };
  const user = await updateDailyCalorieTarget(req.auth!.sub, dailyCalorieTarget);
  return ok(res, user);
}
