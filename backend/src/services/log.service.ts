import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import { todayLocalDate } from "../utils/localTime";
import type { DailyLog, MealType, Scan, ScanNutrition } from "../models/types";

export interface DailyLogWithDetails extends DailyLog {
  scan: Pick<Scan, "id" | "image_url" | "detected_food_name" | "portion_estimate_g"> | null;
  nutrition: ScanNutrition | null;
}

export interface DaySummary {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  logCount: number;
}

/**
 * Idempotent by scan_id (unique constraint, migration 0003): a retried or
 * double-tapped confirm re-writes the same row instead of creating a
 * duplicate log that would double-count that meal's calories.
 */
export async function createDailyLog(input: {
  userId: string;
  scanId: string;
  mealType: MealType;
  logDate?: string;
}): Promise<DailyLog> {
  const { data, error } = await supabase
    .from("daily_logs")
    .upsert(
      {
        user_id: input.userId,
        scan_id: input.scanId,
        meal_type: input.mealType,
        log_date: input.logDate ?? todayLocalDate(),
      },
      { onConflict: "scan_id" },
    )
    .select()
    .single();

  if (error || !data) {
    throw new AppError(`Failed to save log: ${error?.message ?? "unknown error"}`, 500);
  }
  return data as DailyLog;
}

/** Fetches daily_logs for a user on one date, joined with the underlying scan + nutrition. */
export async function listLogsForDate(userId: string, date: string): Promise<DailyLogWithDetails[]> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*, scans(id, image_url, detected_food_name, portion_estimate_g, scan_nutrition(*))")
    .eq("user_id", userId)
    .eq("log_date", date)
    .order("created_at", { ascending: true });

  if (error) {
    throw new AppError(`Failed to load logs: ${error.message}`, 500);
  }

  return (data ?? []).map((row) => {
    const { scans, ...log } = row as DailyLog & {
      scans: (Pick<Scan, "id" | "image_url" | "detected_food_name" | "portion_estimate_g"> & {
        scan_nutrition: ScanNutrition[];
      }) | null;
    };
    return {
      ...log,
      scan: scans ? { id: scans.id, image_url: scans.image_url, detected_food_name: scans.detected_food_name, portion_estimate_g: scans.portion_estimate_g } : null,
      nutrition: scans?.scan_nutrition?.[0] ?? null,
    };
  });
}

export async function deleteLog(userId: string, logId: string): Promise<void> {
  const { data, error } = await supabase
    .from("daily_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AppError(`Failed to delete log: ${error.message}`, 500);
  }
  if (!data) {
    throw new AppError("Log not found", 404, "LOG_NOT_FOUND");
  }
}

/** Aggregates calories/macros per day across a [startDate, endDate] range, for the dashboard chart. */
export async function summarizeRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<DaySummary[]> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("log_date, scans(scan_nutrition(*))")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate);

  if (error) {
    throw new AppError(`Failed to load summary: ${error.message}`, 500);
  }

  const byDate = new Map<string, DaySummary>();
  for (const row of (data ?? []) as unknown as Array<{
    log_date: string;
    scans: { scan_nutrition: ScanNutrition[] } | null;
  }>) {
    const nutrition = row.scans?.scan_nutrition?.[0];
    const entry =
      byDate.get(row.log_date) ??
      ({
        date: row.log_date,
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
        sugarG: 0,
        logCount: 0,
      } satisfies DaySummary);

    entry.logCount += 1;
    if (nutrition) {
      entry.calories += nutrition.calories;
      entry.proteinG += nutrition.protein_g;
      entry.carbsG += nutrition.carbs_g;
      entry.fatG += nutrition.fat_g;
      entry.fiberG += nutrition.fiber_g;
      entry.sugarG += nutrition.sugar_g;
    }
    byDate.set(row.log_date, entry);
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
