export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  daily_calorie_target: number | null;
  created_at: string;
}

export type PublicUser = Omit<User, "password_hash">;

export type ScanStatus = "pending" | "confirmed" | "rejected";

export interface Scan {
  id: string;
  user_id: string | null;
  image_url: string | null;
  detected_food_name: string | null;
  confidence_score: number | null;
  portion_estimate_g: number | null;
  status: ScanStatus;
  created_at: string;
}

export interface ScanNutrition {
  id: string;
  scan_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface DailyLog {
  id: string;
  user_id: string;
  scan_id: string;
  log_date: string;
  meal_type: MealType;
  created_at: string;
}

export interface FoodReference {
  id: string;
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  source: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AiInsight {
  id: string;
  user_id: string;
  insight_date: string;
  content: string;
  created_at: string;
}
