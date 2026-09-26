/**
 * Seeds a demo account with a week of realistic scan/log history, so a
 * fresh install (or a reviewer opening the app for the first time) sees a
 * populated History/Dashboard instead of an empty state. Bypasses the normal
 * service layer in places (direct inserts with backdated created_at) since
 * the real API never lets a client set its own timestamps -- that's exactly
 * why this needs to be a separate script rather than just calling the API.
 *
 * Usage: npm run seed:demo
 */
import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import { uploadScanPhoto } from "../services/storage.service";
import { getNutritionForFood } from "../services/nutrition.service";
import { nowInWib } from "../utils/localTime";
import sharp from "sharp";

const DEMO_EMAIL = "demo@nutriscan.ai";
const DEMO_PASSWORD = "demo12345";
const DEMO_TARGET = 2200;

interface MealPlan {
  hour: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  food: string;
  portionG: number;
  color: { r: number; g: number; b: number };
}

// Rotates through real dataset entries (backend/src/data/foodDataset.ts) so
// nutrition numbers are real, not invented. One color per meal slot just
// gives each seeded photo a distinct thumbnail in History.
const DAY_PLANS: MealPlan[][] = [
  [
    { hour: 7, mealType: "breakfast", food: "Telur Dadar", portionG: 120, color: { r: 235, g: 195, b: 90 } },
    { hour: 12, mealType: "lunch", food: "Nasi Goreng", portionG: 220, color: { r: 200, g: 130, b: 60 } },
    { hour: 19, mealType: "dinner", food: "Sate Ayam", portionG: 160, color: { r: 150, g: 90, b: 50 } },
  ],
  [
    { hour: 7, mealType: "breakfast", food: "Roti Tawar", portionG: 90, color: { r: 220, g: 190, b: 150 } },
    { hour: 12, mealType: "lunch", food: "Ayam Goreng", portionG: 180, color: { r: 190, g: 140, b: 60 } },
    { hour: 19, mealType: "dinner", food: "Mie Goreng", portionG: 200, color: { r: 210, g: 170, b: 60 } },
  ],
  [
    { hour: 7, mealType: "breakfast", food: "Pisang", portionG: 100, color: { r: 230, g: 210, b: 80 } },
    { hour: 12, mealType: "lunch", food: "Tempe Goreng", portionG: 150, color: { r: 170, g: 130, b: 70 } },
    { hour: 19, mealType: "dinner", food: "Sayur Bayam", portionG: 130, color: { r: 90, g: 150, b: 70 } },
    { hour: 21, mealType: "snack", food: "Apel", portionG: 120, color: { r: 190, g: 50, b: 50 } },
  ],
  [
    { hour: 7, mealType: "breakfast", food: "Telur Dadar", portionG: 110, color: { r: 235, g: 195, b: 90 } },
    { hour: 12, mealType: "lunch", food: "Nasi Putih", portionG: 200, color: { r: 240, g: 240, b: 235 } },
    { hour: 19, mealType: "dinner", food: "Tahu Goreng", portionG: 170, color: { r: 220, g: 200, b: 120 } },
  ],
  [
    { hour: 7, mealType: "breakfast", food: "Roti Tawar", portionG: 90, color: { r: 220, g: 190, b: 150 } },
    { hour: 12, mealType: "lunch", food: "Sate Ayam", portionG: 180, color: { r: 150, g: 90, b: 50 } },
    { hour: 19, mealType: "dinner", food: "Ayam Goreng", portionG: 190, color: { r: 190, g: 140, b: 60 } },
  ],
  [
    { hour: 8, mealType: "breakfast", food: "Pisang", portionG: 100, color: { r: 230, g: 210, b: 80 } },
    { hour: 13, mealType: "lunch", food: "Mie Goreng", portionG: 210, color: { r: 210, g: 170, b: 60 } },
    { hour: 20, mealType: "dinner", food: "Nasi Goreng", portionG: 200, color: { r: 200, g: 130, b: 60 } },
  ],
  [
    { hour: 8, mealType: "breakfast", food: "Telur Dadar", portionG: 120, color: { r: 235, g: 195, b: 90 } },
    { hour: 13, mealType: "lunch", food: "Ayam Goreng", portionG: 200, color: { r: 190, g: 140, b: 60 } },
  ],
];

function dateNDaysAgo(n: number): Date {
  const d = nowInWib();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function getOrCreateDemoUser(): Promise<string> {
  const { data: existing } = await supabase.from("users").select("id").eq("email", DEMO_EMAIL).maybeSingle();
  if (existing) {
    logger.info("Demo user already exists, wiping its old scan/log history before reseeding");
    const { data: scans } = await supabase.from("scans").select("id").eq("user_id", existing.id);
    const scanIds = (scans ?? []).map((s) => s.id);
    if (scanIds.length > 0) {
      await supabase.from("scan_nutrition").delete().in("scan_id", scanIds);
      await supabase.from("daily_logs").delete().in("scan_id", scanIds);
      await supabase.from("scans").delete().in("id", scanIds);
    }
    await supabase.from("ai_insights").delete().eq("user_id", existing.id);
    return existing.id;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const { data: created, error } = await supabase
    .from("users")
    .insert({ name: "Demo User", email: DEMO_EMAIL, password_hash: passwordHash, daily_calorie_target: DEMO_TARGET })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(`Failed to create demo user: ${error?.message ?? "unknown error"}`);
  }
  return created.id;
}

async function seedDay(userId: string, dayOffset: number, plan: MealPlan[]) {
  const day = dateNDaysAgo(dayOffset);
  const logDate = toDateOnly(day);

  for (const meal of plan) {
    const timestamp = new Date(day);
    timestamp.setUTCHours(meal.hour, Math.floor(Math.random() * 50), 0, 0);

    const photoBuffer = await sharp({
      create: { width: 400, height: 400, channels: 3, background: meal.color },
    })
      .jpeg()
      .toBuffer();
    const imageUrl = await uploadScanPhoto(photoBuffer, "image/jpeg", userId);
    const nutrition = await getNutritionForFood(meal.food, meal.portionG);
    const confidence = 0.86 + Math.random() * 0.12;

    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .insert({
        user_id: userId,
        image_url: imageUrl,
        detected_food_name: meal.food,
        confidence_score: Number(confidence.toFixed(2)),
        portion_estimate_g: meal.portionG,
        status: "confirmed",
        created_at: timestamp.toISOString(),
      })
      .select("id")
      .single();

    if (scanError || !scan) {
      throw new Error(`Failed to seed scan for ${meal.food}: ${scanError?.message}`);
    }

    await supabase.from("scan_nutrition").insert({
      scan_id: scan.id,
      calories: nutrition.calories,
      protein_g: nutrition.proteinG,
      carbs_g: nutrition.carbsG,
      fat_g: nutrition.fatG,
      fiber_g: nutrition.fiberG,
      sugar_g: nutrition.sugarG,
    });

    await supabase.from("daily_logs").insert({
      user_id: userId,
      scan_id: scan.id,
      log_date: logDate,
      meal_type: meal.mealType,
      created_at: timestamp.toISOString(),
    });
  }

  logger.info(`Seeded ${plan.length} meals for ${logDate}`);
}

async function main() {
  const userId = await getOrCreateDemoUser();
  logger.info("Seeding demo data", { userId, email: DEMO_EMAIL });

  for (let dayOffset = DAY_PLANS.length - 1; dayOffset >= 0; dayOffset -= 1) {
    await seedDay(userId, dayOffset, DAY_PLANS[DAY_PLANS.length - 1 - dayOffset]);
  }

  logger.info("Demo data seeded", { email: DEMO_EMAIL, password: DEMO_PASSWORD });
  console.log(`\nLogin dengan:\n  email: ${DEMO_EMAIL}\n  password: ${DEMO_PASSWORD}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error("Seed failed", { err: String(err) });
    process.exit(1);
  });
