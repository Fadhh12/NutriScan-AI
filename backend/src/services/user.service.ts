import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { PublicUser, User } from "../models/types";

export async function updateDailyCalorieTarget(
  userId: string,
  dailyCalorieTarget: number,
): Promise<PublicUser> {
  const { data, error } = await supabase
    .from("users")
    .update({ daily_calorie_target: dailyCalorieTarget })
    .eq("id", userId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError(`Failed to update target: ${error?.message ?? "unknown error"}`, 500);
  }

  const { password_hash: _password_hash, ...publicUser } = data as User;
  return publicUser;
}
