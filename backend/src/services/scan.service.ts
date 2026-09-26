import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { NutritionBreakdown } from "./nutrition.service";
import type { Scan, ScanNutrition, ScanStatus } from "../models/types";

export async function createScan(input: {
  userId: string | null;
  imageUrl: string;
  detectedFoodName: string;
  confidenceScore: number;
  portionEstimateG: number;
}): Promise<Scan> {
  const { data, error } = await supabase
    .from("scans")
    .insert({
      user_id: input.userId,
      image_url: input.imageUrl,
      detected_food_name: input.detectedFoodName,
      confidence_score: input.confidenceScore,
      portion_estimate_g: input.portionEstimateG,
      status: "pending" satisfies ScanStatus,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError(`Failed to save scan: ${error?.message ?? "unknown error"}`, 500);
  }
  return data as Scan;
}

export async function createScanNutrition(
  scanId: string,
  nutrition: NutritionBreakdown,
): Promise<ScanNutrition> {
  const { data, error } = await supabase
    .from("scan_nutrition")
    .insert({
      scan_id: scanId,
      calories: nutrition.calories,
      protein_g: nutrition.proteinG,
      carbs_g: nutrition.carbsG,
      fat_g: nutrition.fatG,
      fiber_g: nutrition.fiberG,
      sugar_g: nutrition.sugarG,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError(`Failed to save nutrition: ${error?.message ?? "unknown error"}`, 500);
  }
  return data as ScanNutrition;
}

export async function getScanWithNutrition(
  scanId: string,
): Promise<{ scan: Scan; nutrition: ScanNutrition | null }> {
  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .select()
    .eq("id", scanId)
    .maybeSingle();

  if (scanError) {
    throw new AppError(`Failed to load scan: ${scanError.message}`, 500);
  }
  if (!scan) {
    throw new AppError("Scan not found", 404, "SCAN_NOT_FOUND");
  }

  const { data: nutrition, error: nutritionError } = await supabase
    .from("scan_nutrition")
    .select()
    .eq("scan_id", scanId)
    .maybeSingle();

  if (nutritionError) {
    throw new AppError(`Failed to load nutrition: ${nutritionError.message}`, 500);
  }

  return { scan: scan as Scan, nutrition: (nutrition as ScanNutrition) ?? null };
}

export function assertScanAccessible(scan: Scan, requesterId: string | undefined) {
  if (scan.user_id && scan.user_id !== requesterId) {
    throw new AppError("You do not have access to this scan", 403, "SCAN_FORBIDDEN");
  }
}

export async function updateScanStatus(
  scanId: string,
  patch: Partial<Pick<Scan, "status" | "detected_food_name" | "confidence_score" | "portion_estimate_g">>,
): Promise<Scan> {
  const { data, error } = await supabase
    .from("scans")
    .update(patch)
    .eq("id", scanId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError(`Failed to update scan: ${error?.message ?? "unknown error"}`, 500);
  }
  return data as Scan;
}

/** Scans past the photo retention window that still have a photo to clean up. */
export async function listScansWithExpiredPhotos(olderThanDays: number): Promise<Scan[]> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("scans")
    .select()
    .not("image_url", "is", null)
    .lt("created_at", cutoff);

  if (error) {
    throw new AppError(`Failed to list expired photos: ${error.message}`, 500);
  }
  return (data ?? []) as Scan[];
}

export async function clearScanPhoto(scanId: string): Promise<void> {
  const { error } = await supabase.from("scans").update({ image_url: null }).eq("id", scanId);
  if (error) {
    throw new AppError(`Failed to clear photo url: ${error.message}`, 500);
  }
}

export async function replaceScanNutrition(
  scanId: string,
  nutrition: NutritionBreakdown,
): Promise<ScanNutrition> {
  const { error: deleteError } = await supabase.from("scan_nutrition").delete().eq("scan_id", scanId);
  if (deleteError) {
    throw new AppError(`Failed to reset nutrition: ${deleteError.message}`, 500);
  }
  return createScanNutrition(scanId, nutrition);
}
