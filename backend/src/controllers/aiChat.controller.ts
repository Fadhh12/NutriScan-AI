import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { getUserById } from "../services/auth.service";
import { listLogsForDate, summarizeRange } from "../services/log.service";
import { listActivitiesForDate, summarizeActivities } from "../services/activity.service";
import { getChatReply, type ChatContext, type ChatMessage } from "../services/aiChat.service";
import { nowInWib, todayLocalDate } from "../utils/localTime";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function chat(req: Request, res: Response) {
  const { messages } = req.body as { messages: ChatMessage[] };
  const userId = req.auth!.sub;
  const today = todayLocalDate();

  const rangeEnd = nowInWib();
  const rangeStart = new Date(rangeEnd);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 6);

  const [user, week, todayActivitiesRows, todayLogs] = await Promise.all([
    getUserById(userId),
    summarizeRange(userId, toDateOnly(rangeStart), toDateOnly(rangeEnd)),
    listActivitiesForDate(userId, today),
    listLogsForDate(userId, today),
  ]);

  const todaySummary =
    week.find((d) => d.date === today) ??
    ({ date: today, calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0, logCount: 0 } as const);

  const context: ChatContext = {
    userName: user.name,
    target: user.daily_calorie_target ?? 2000,
    today: todaySummary,
    week,
    todayActivities: summarizeActivities(today, todayActivitiesRows),
    todayMeals: todayLogs.map((log) => ({
      name: log.scan?.detected_food_name ?? "Makanan",
      calories: log.nutrition?.calories ?? 0,
      mealType: log.meal_type,
    })),
  };

  const reply = await getChatReply(messages, context);
  return ok(res, { reply });
}
