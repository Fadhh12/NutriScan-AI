import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import { todayLocalDate } from "../utils/localTime";
import type { Activity, ActivityIntensity, ActivityType } from "../models/types";

/**
 * Approximate kcal/minute per activity type + intensity for an average adult
 * (~70kg). No wearable/HR integration, so this is a deliberately simple
 * estimate rather than a true MET calculation — good enough for self-reported
 * tracking, consistent with the rest of the app's nutrition estimates.
 */
const CALORIES_PER_MINUTE: Record<ActivityType, Record<ActivityIntensity, number>> = {
  walking: { low: 3, medium: 5, high: 7 },
  running: { low: 8, medium: 10, high: 13 },
  cycling: { low: 5, medium: 8, high: 11 },
  weightlifting: { low: 4, medium: 6, high: 9 },
  swimming: { low: 6, medium: 9, high: 12 },
  yoga: { low: 2.5, medium: 3.5, high: 4.5 },
  other: { low: 4, medium: 6, high: 8 },
};

export function estimateCaloriesBurned(
  activityType: ActivityType,
  intensity: ActivityIntensity,
  durationMinutes: number,
): number {
  const rate = CALORIES_PER_MINUTE[activityType][intensity];
  return Math.round(rate * durationMinutes);
}

export async function createActivity(input: {
  userId: string;
  activityType: ActivityType;
  intensity: ActivityIntensity;
  durationMinutes: number;
  logDate?: string;
}): Promise<Activity> {
  const caloriesBurned = estimateCaloriesBurned(input.activityType, input.intensity, input.durationMinutes);

  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: input.userId,
      activity_type: input.activityType,
      intensity: input.intensity,
      duration_minutes: input.durationMinutes,
      calories_burned: caloriesBurned,
      log_date: input.logDate ?? todayLocalDate(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError(`Failed to save activity: ${error?.message ?? "unknown error"}`, 500);
  }
  return data as Activity;
}

export async function listActivitiesForDate(userId: string, date: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select()
    .eq("user_id", userId)
    .eq("log_date", date)
    .order("logged_at", { ascending: false });

  if (error) {
    throw new AppError(`Failed to load activities: ${error.message}`, 500);
  }
  return (data ?? []) as Activity[];
}

export async function deleteActivity(userId: string, activityId: string): Promise<void> {
  const { data, error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AppError(`Failed to delete activity: ${error.message}`, 500);
  }
  if (!data) {
    throw new AppError("Activity not found", 404, "ACTIVITY_NOT_FOUND");
  }
}

export interface ActivitySummary {
  date: string;
  totalCaloriesBurned: number;
  totalDurationMinutes: number;
  byType: Partial<Record<ActivityType, { calories: number; durationMinutes: number; count: number }>>;
}

export function summarizeActivities(date: string, activities: Activity[]): ActivitySummary {
  const byType: ActivitySummary["byType"] = {};
  let totalCaloriesBurned = 0;
  let totalDurationMinutes = 0;

  for (const activity of activities) {
    totalCaloriesBurned += activity.calories_burned;
    totalDurationMinutes += activity.duration_minutes;
    const entry = byType[activity.activity_type] ?? { calories: 0, durationMinutes: 0, count: 0 };
    entry.calories += activity.calories_burned;
    entry.durationMinutes += activity.duration_minutes;
    entry.count += 1;
    byType[activity.activity_type] = entry;
  }

  return { date, totalCaloriesBurned, totalDurationMinutes, byType };
}
