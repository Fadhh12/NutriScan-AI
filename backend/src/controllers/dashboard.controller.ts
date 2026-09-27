import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { summarizeRange, type DaySummary } from "../services/log.service";
import { getUserById } from "../services/auth.service";
import { getOrCreateInsight } from "../services/aiInsight.service";
import { getPlanRecommendation } from "../services/aiPlan.service";
import { nowInWib } from "../utils/localTime";

// Date arithmetic below uses the UTC getters/setters on purpose: nowInWib()
// returns a UTC epoch pre-shifted by the WIB offset, so getUTCDate/setUTCDate
// read WIB calendar fields without the server's own local timezone bleeding in
// (see utils/localTime.ts).
function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Last 7 days (inclusive of today), zero-filled for days with no logs, plus the user's target. */
async function getWeekSeries(userId: string): Promise<{ target: number; series: DaySummary[] }> {
  const today = nowInWib();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 6);

  const [user, days] = await Promise.all([
    getUserById(userId),
    summarizeRange(userId, toDateOnly(start), toDateOnly(today)),
  ]);

  const byDate = new Map(days.map((d) => [d.date, d]));
  const series: DaySummary[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
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

  return { target: user.daily_calorie_target ?? 2000, series };
}

export async function getSummary(req: Request, res: Response) {
  const { target, series } = await getWeekSeries(req.auth!.sub);
  const todayEntry = series[series.length - 1];
  return ok(res, { target, today: todayEntry, days: series });
}

/** AI-generated insight from the same 7-day series, cached once per user per day. */
export async function getInsight(req: Request, res: Response) {
  const { target, series } = await getWeekSeries(req.auth!.sub);
  const result = await getOrCreateInsight(req.auth!.sub, { days: series, target });
  return ok(res, result);
}

/** AI-generated calorie/macro target recommendation from the same 7-day series. Not cached — recomputed on demand so the plan page can regenerate it. */
export async function getPlan(req: Request, res: Response) {
  const { target, series } = await getWeekSeries(req.auth!.sub);
  const result = await getPlanRecommendation({ days: series, currentTarget: target });
  return ok(res, result);
}
