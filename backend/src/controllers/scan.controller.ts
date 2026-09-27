import sharp from "sharp";
import type { Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";
import { recognizeWithTimeout, type FoodCandidate } from "../services/foodRecognition.service";
import { getNutritionForFood, scaleNutritionPer100g } from "../services/nutrition.service";
import { uploadScanPhoto } from "../services/storage.service";
import {
  assertScanAccessible,
  createScan,
  createScanNutrition,
  getScanWithNutrition,
  replaceScanNutrition,
  updateScanStatus,
} from "../services/scan.service";
import { createDailyLog } from "../services/log.service";
import { inferMealType } from "../utils/localTime";
import type { MealType } from "../models/types";
import type { NutritionBreakdown } from "../services/nutrition.service";

function sumNutrition(items: NutritionBreakdown[]): NutritionBreakdown {
  return items.reduce(
    (acc, n) => ({
      calories: acc.calories + n.calories,
      proteinG: acc.proteinG + n.proteinG,
      carbsG: acc.carbsG + n.carbsG,
      fatG: acc.fatG + n.fatG,
      fiberG: acc.fiberG + n.fiberG,
      sugarG: acc.sugarG + n.sugarG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0 },
  );
}

async function assertValidImageDimensions(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  const { width, height } = metadata;
  if (!width || !height || width < env.minImageDimensionPx || height < env.minImageDimensionPx) {
    throw new AppError(
      `Image resolution too low, minimum ${env.minImageDimensionPx}x${env.minImageDimensionPx}px`,
      422,
      "IMAGE_RESOLUTION_TOO_LOW",
    );
  }
}

export async function scanPhoto(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError("Photo file is required (field 'photo')", 422, "PHOTO_REQUIRED");
  }

  await assertValidImageDimensions(req.file.buffer);

  const userId = req.auth?.sub ?? null;
  const imageUrl = await uploadScanPhoto(req.file.buffer, req.file.mimetype, userId);

  const recognition = await recognizeWithTimeout(req.file.buffer, req.file.mimetype);
  if (!recognition.isFood || recognition.candidates.length === 0) {
    throw new AppError("Tidak terdeteksi makanan, coba foto ulang", 422, "NOT_FOOD");
  }

  // Gemini estimates composition for every distinct component it sees on the
  // plate (nutrition100g set on all of them) — sum them into one meal total
  // instead of only keeping the single most dominant item. Providers that
  // only guess a name (mock/logmeal) keep the old single-item + "did you
  // mean" alternatives flow, since their candidates are ranked guesses for
  // ONE food, not simultaneous separate foods.
  const isMultiItemPlate = recognition.candidates.every((c) => c.nutrition100g);

  let detectedFoodName: string;
  let confidenceScore: number;
  let portionEstimateG: number;
  let nutrition: NutritionBreakdown;
  let isLowConfidence: boolean;
  let items: Array<{ name: string; confidence: number; portionEstimateG: number; nutrition: NutritionBreakdown }> | undefined;
  let candidates:
    | Array<{ name: string; confidence: number; portionEstimateG: number; nutrition: NutritionBreakdown }>
    | undefined;

  if (isMultiItemPlate) {
    items = recognition.candidates.map((c) => ({
      name: c.name,
      confidence: c.confidence,
      portionEstimateG: c.portionEstimateG,
      nutrition: scaleNutritionPer100g(c.nutrition100g!, c.portionEstimateG),
    }));
    detectedFoodName = items.map((i) => i.name).join(", ");
    portionEstimateG = items.reduce((sum, i) => sum + i.portionEstimateG, 0);
    confidenceScore = Number((items.reduce((sum, i) => sum + i.confidence, 0) / items.length).toFixed(2));
    nutrition = sumNutrition(items.map((i) => i.nutrition));
    isLowConfidence = confidenceScore < env.lowConfidenceThreshold;
  } else {
    const [primary, ...alternatives] = recognition.candidates;
    detectedFoodName = primary.name;
    confidenceScore = primary.confidence;
    portionEstimateG = primary.portionEstimateG;
    nutrition = await getNutritionForFood(primary.name, primary.portionEstimateG);
    isLowConfidence = primary.confidence < env.lowConfidenceThreshold;

    if (isLowConfidence) {
      candidates = await Promise.all(
        [primary, ...alternatives].map(async (c: FoodCandidate) => ({
          name: c.name,
          confidence: c.confidence,
          portionEstimateG: c.portionEstimateG,
          nutrition: await getNutritionForFood(c.name, c.portionEstimateG),
        })),
      );
    }
  }

  const scan = await createScan({
    userId,
    imageUrl,
    detectedFoodName,
    confidenceScore,
    portionEstimateG,
  });
  const savedNutrition = await createScanNutrition(scan.id, nutrition);

  return ok(
    res,
    {
      scan,
      nutrition: savedNutrition,
      lowConfidence: isLowConfidence,
      candidates,
      items,
    },
    201,
  );
}

/**
 * Logs a meal that never went through the photo pipeline — barcode lookup
 * (external nutrition already known) or manual pick from the food table
 * (local dataset, looked up by name). Reuses the scans/scan_nutrition/
 * daily_logs tables so history/dashboard show it exactly like a photo scan.
 */
export async function manualEntry(req: Request, res: Response) {
  const { foodName, portionEstimateG, mealType, source, nutrition } = req.body as {
    foodName: string;
    portionEstimateG: number;
    mealType?: MealType;
    source: "barcode" | "table";
    nutrition?: NutritionBreakdown;
  };

  const resolvedNutrition = nutrition ?? (await getNutritionForFood(foodName, portionEstimateG));

  const userId = req.auth?.sub ?? null;
  const scan = await createScan({
    userId,
    imageUrl: null,
    detectedFoodName: foodName,
    confidenceScore: 1,
    portionEstimateG,
    status: "confirmed",
  });
  const savedNutrition = await createScanNutrition(scan.id, resolvedNutrition);

  if (userId) {
    await createDailyLog({ userId, scanId: scan.id, mealType: mealType ?? inferMealType() });
  }

  return ok(res, { scan, nutrition: savedNutrition, source }, 201);
}

export async function getScan(req: Request, res: Response) {
  const { scan, nutrition } = await getScanWithNutrition(req.params.id);
  assertScanAccessible(scan, req.auth?.sub);
  return ok(res, { scan, nutrition });
}

export async function confirmScan(req: Request, res: Response) {
  const { scan } = await getScanWithNutrition(req.params.id);
  assertScanAccessible(scan, req.auth?.sub);

  const { confirmed, rejected, foodName, portionEstimateG, mealType } = req.body as {
    confirmed?: boolean;
    rejected?: boolean;
    foodName?: string;
    portionEstimateG?: number;
    mealType?: MealType;
  };

  if (rejected) {
    const updated = await updateScanStatus(scan.id, { status: "rejected" });
    return ok(res, { scan: updated, nutrition: null });
  }

  const userId = req.auth?.sub;

  if (foodName) {
    const portion = portionEstimateG ?? scan.portion_estimate_g ?? 100;
    const nutrition = await getNutritionForFood(foodName, portion);
    const updated = await updateScanStatus(scan.id, {
      status: "confirmed",
      detected_food_name: foodName,
      confidence_score: 1,
      portion_estimate_g: portion,
    });
    const savedNutrition = await replaceScanNutrition(scan.id, nutrition);
    if (userId) {
      await createDailyLog({ userId, scanId: scan.id, mealType: mealType ?? inferMealType() });
    }
    return ok(res, { scan: updated, nutrition: savedNutrition });
  }

  if (confirmed) {
    const updated = await updateScanStatus(scan.id, { status: "confirmed" });
    const { nutrition } = await getScanWithNutrition(scan.id);
    if (userId) {
      await createDailyLog({ userId, scanId: scan.id, mealType: mealType ?? inferMealType() });
    }
    return ok(res, { scan: updated, nutrition });
  }

  throw new AppError("Provide one of: confirmed, rejected, or foodName", 422, "VALIDATION_ERROR");
}
