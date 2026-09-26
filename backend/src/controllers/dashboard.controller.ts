import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { summarizeRange, type DaySummary } from "../services/log.service";
import { getUserById } from "../services/auth.service";
import { nowInWib } from "../utils/localTime";

// Date arithmetic below uses the UTC getters/setters on purpose: nowInWib()
// returns a UTC epoch pre-shifted by the WIB offset, so getUTCDate/setUTCDate
// read WIB calendar fields without the server's own local timezone bleeding in
// (see utils/localTime.ts).
function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns a per-day summary for the last 7 days (inclusive of today) vs. the user's target. */
export async function getSummary(req: Request, res: Response) {
  const today = nowInWib();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 6);

  const [user, days] = await Promise.all([
    getUserById(req.auth!.sub),
    summarizeRange(req.auth!.sub, toDateOnly(start), toDateOnly(today)),
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

  const target = user.daily_calorie_target ?? 2000;
  const todayEntry = series[series.length - 1];

  return ok(res, {
    target,
    today: todayEntry,
    days: series,
  });
}
