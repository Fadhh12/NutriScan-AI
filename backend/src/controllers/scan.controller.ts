import sharp from "sharp";
import type { Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";
import { recognizeWithTimeout } from "../services/foodRecognition.service";
import { getNutritionForFood } from "../services/nutrition.service";
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

  const recognition = await recognizeWithTimeout(req.file.buffer);
  if (!recognition.isFood || recognition.candidates.length === 0) {
    throw new AppError("Tidak terdeteksi makanan, coba foto ulang", 422, "NOT_FOOD");
  }

  const [primary, ...alternatives] = recognition.candidates;
  const nutrition = await getNutritionForFood(primary.name, primary.portionEstimateG);

  const scan = await createScan({
    userId,
    imageUrl,
    detectedFoodName: primary.name,
    confidenceScore: primary.confidence,
    portionEstimateG: primary.portionEstimateG,
  });
  const savedNutrition = await createScanNutrition(scan.id, nutrition);

  const isLowConfidence = primary.confidence < env.lowConfidenceThreshold;
  let candidates:
    | Array<{ name: string; confidence: number; portionEstimateG: number; nutrition: Awaited<ReturnType<typeof getNutritionForFood>> }>
    | undefined;

  if (isLowConfidence) {
    candidates = await Promise.all(
      [{ ...primary }, ...alternatives].map(async (c) => ({
        name: c.name,
        confidence: c.confidence,
        portionEstimateG: c.portionEstimateG,
        nutrition: await getNutritionForFood(c.name, c.portionEstimateG),
      })),
    );
  }

  return ok(
    res,
    {
      scan,
      nutrition: savedNutrition,
      lowConfidence: isLowConfidence,
      candidates,
    },
    201,
  );
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
