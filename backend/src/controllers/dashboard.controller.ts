import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { summarizeRange, type DaySummary } from "../services/log.service";
import { getUserById } from "../services/auth.service";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns a per-day summary for the last 7 days (inclusive of today) vs. the user's target. */
export async function getSummary(req: Request, res: Response) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6);

  const [user, days] = await Promise.all([
    getUserById(req.auth!.sub),
    summarizeRange(req.auth!.sub, toDateOnly(start), toDateOnly(today)),
  ]);

  const byDate = new Map(days.map((d) => [d.date, d]));
  const series: DaySummary[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = toDateOnly(d);
    series.push(
      byDate.get(key) ?? {
        date: key,
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
        sugarG: 0,
        logCount: 0,
      },
    );
  }

  const target = user.daily_calorie_target ?? 2000;
  const todayEntry = series[series.length - 1];

  return ok(res, {
    target,
    today: todayEntry,
    days: series,
  });
}
