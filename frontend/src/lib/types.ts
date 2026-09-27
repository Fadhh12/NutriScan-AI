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

export interface ScanCandidate {
  name: string;
  confidence: number;
  portionEstimateG: number;
  nutrition: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sugarG: number;
  };
}

export interface ScanItemBreakdown {
  name: string;
  confidence: number;
  portionEstimateG: number;
  nutrition: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sugarG: number;
  };
}

export interface ScanResponse {
  scan: Scan;
  nutrition: ScanNutrition;
  lowConfidence: boolean;
  candidates?: ScanCandidate[];
  /** Set when the vision model detected multiple distinct foods on the plate — one entry per component, already summed into `nutrition` above. */
  items?: ScanItemBreakdown[];
}

export interface ConfirmScanResponse {
  scan: Scan;
  nutrition: ScanNutrition | null;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  daily_calorie_target: number | null;
  created_at: string;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

export interface LogEntry {
  id: string;
  user_id: string;
  scan_id: string;
  log_date: string;
  meal_type: MealType;
  created_at: string;
  scan: {
    id: string;
    image_url: string | null;
    detected_food_name: string | null;
    portion_estimate_g: number | null;
  } | null;
  nutrition: ScanNutrition | null;
}

export interface LogsResponse {
  date: string;
  logs: LogEntry[];
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

export interface DashboardSummaryResponse {
  target: number;
  today: DaySummary;
  days: DaySummary[];
}

export interface FoodDatasetEntry {
  name: string;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g: number;
}

export interface FoodsResponse {
  foods: FoodDatasetEntry[];
}

export interface ManualEntryInput {
  foodName: string;
  portionEstimateG: number;
  mealType?: MealType;
  source: "barcode" | "table";
  nutrition?: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;
    sugarG?: number;
  };
}

export interface ManualEntryResponse {
  scan: Scan;
  nutrition: ScanNutrition;
  source: "barcode" | "table";
}

export interface InsightResponse {
  content: string;
  date: string;
  cached: boolean;
}

export type ActivityType = "walking" | "running" | "cycling" | "weightlifting" | "swimming" | "yoga" | "other";
export type ActivityIntensity = "low" | "medium" | "high";

export interface Activity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  intensity: ActivityIntensity;
  duration_minutes: number;
  calories_burned: number;
  log_date: string;
  logged_at: string;
  created_at: string;
}

export interface ActivitySummary {
  date: string;
  totalCaloriesBurned: number;
  totalDurationMinutes: number;
  byType: Partial<Record<ActivityType, { calories: number; durationMinutes: number; count: number }>>;
}

export interface ActivitiesResponse {
  date: string;
  activities: Activity[];
  summary: ActivitySummary;
}

export interface LogActivityInput {
  activityType: ActivityType;
  intensity: ActivityIntensity;
  durationMinutes: number;
}
