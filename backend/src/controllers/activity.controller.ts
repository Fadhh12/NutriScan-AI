import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";
import { todayLocalDate } from "../utils/localTime";
import { createActivity, deleteActivity, listActivitiesForDate, summarizeActivities } from "../services/activity.service";
import type { ActivityIntensity, ActivityType } from "../models/types";

function parseDateQuery(raw: unknown): string {
  if (raw === undefined) return todayLocalDate();
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new AppError("Query param 'date' harus format YYYY-MM-DD", 422, "INVALID_DATE");
  }
  return raw;
}

export async function getActivities(req: Request, res: Response) {
  const date = parseDateQuery(req.query.date);
  const activities = await listActivitiesForDate(req.auth!.sub, date);
  const summary = summarizeActivities(date, activities);
  return ok(res, { date, activities, summary });
}

export async function logActivity(req: Request, res: Response) {
  const { activityType, intensity, durationMinutes } = req.body as {
    activityType: ActivityType;
    intensity: ActivityIntensity;
    durationMinutes: number;
  };

  const activity = await createActivity({
    userId: req.auth!.sub,
    activityType,
    intensity,
    durationMinutes,
  });

  return ok(res, { activity }, 201);
}

export async function removeActivity(req: Request, res: Response) {
  await deleteActivity(req.auth!.sub, req.params.id);
  return ok(res, { deleted: true });
}
