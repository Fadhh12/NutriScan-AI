import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { foodDataset } from "../data/foodDataset";
import { logger } from "../utils/logger";
import type { FoodReference } from "../models/types";
import type { NutritionPer100g } from "./foodRecognition.service";

export interface NutritionBreakdown {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
}

function scale(per100g: number, portionG: number): number {
  return Number(((per100g * portionG) / 100).toFixed(1));
}

/** Scales a per-100g estimate (e.g. straight from the vision model) to the estimated portion. */
export function scaleNutritionPer100g(per100g: NutritionPer100g, portionG: number): NutritionBreakdown {
  return {
    calories: scale(per100g.calories, portionG),
    proteinG: scale(per100g.proteinG, portionG),
    carbsG: scale(per100g.carbsG, portionG),
    fatG: scale(per100g.fatG, portionG),
    fiberG: scale(per100g.fiberG, portionG),
    sugarG: scale(per100g.sugarG, portionG),
  };
}

async function findCachedReference(foodName: string): Promise<FoodReference | null> {
  const { data, error } = await supabase
    .from("food_reference")
    .select()
    .ilike("food_name", foodName)
    .maybeSingle();

  if (error) {
    logger.warn("food_reference lookup failed, falling back to local dataset", { error: error.message });
    return null;
  }
  return data as FoodReference | null;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Last-resort lookup for a food name that isn't in the local dataset or the
 * `food_reference` cache — asks Gemini for a plausible per-100g estimate
 * instead of falling back to a flat generic guess. Used when a user corrects
 * a scan to a custom name, or logs something manually that isn't in the
 * curated dataset. The result gets cached below, so the app effectively
 * "learns" new foods over time instead of asking the same question twice.
 */
async function estimateNutritionWithGemini(foodName: string): Promise<NutritionPer100g | null> {
  if (!env.geminiApiKey) return null;

  const prompt = [
    "Kamu ahli gizi. Berikan estimasi kandungan gizi rata-rata per 100 gram untuk makanan/minuman berikut, seakurat mungkin berdasarkan pengetahuan umum tentang makanan tersebut (termasuk masakan daerah/lokal manapun):",
    `"${foodName}"`,
    "Balas HANYA dengan JSON valid, tanpa markdown, tanpa teks lain, skema persis:",
    '{"caloriesPer100g": number, "proteinPer100g": number, "carbsPer100g": number, "fatPer100g": number, "fiberPer100g": number, "sugarPer100g": number}',
    "Selalu berikan angka masuk akal terbaik meskipun nama makanannya tidak umum — jangan pernah menolak atau mengembalikan nol semua.",
  ].join("\n\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.2,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.warn("Gemini nutrition estimate request failed", { status: res.status, foodName, body });
      return null;
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!text) {
      logger.warn("Gemini nutrition estimate returned empty text", { foodName });
      return null;
    }

    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (typeof parsed.caloriesPer100g !== "number" || !Number.isFinite(parsed.caloriesPer100g)) {
      logger.warn("Gemini nutrition estimate missing caloriesPer100g, discarding", { foodName, parsed });
      return null;
    }

    logger.info("Gemini nutrition estimate succeeded", { foodName, parsed });
    return {
      calories: parsed.caloriesPer100g,
      proteinG: num(parsed.proteinPer100g, 0),
      carbsG: num(parsed.carbsPer100g, 0),
      fatG: num(parsed.fatPer100g, 0),
      fiberG: num(parsed.fiberPer100g, 0),
      sugarG: num(parsed.sugarPer100g, 0),
    };
  } catch (err) {
    logger.warn("Gemini nutrition estimate failed, will use generic fallback", { foodName, err: String(err) });
    return null;
  }
}

async function cacheReference(entry: {
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  source: string;
}): Promise<void> {
  const { error } = await supabase.from("food_reference").insert(entry);
  if (error) {
    logger.warn("Failed to cache food_reference entry", { error: error.message, food: entry.food_name });
  }
}

/**
 * Resolves macro nutrition for a detected food name, scaled to the estimated
 * portion. Looks in the `food_reference` cache first (SDD 3.2), falls back
 * to the local dataset, and caches unseen entries for next time.
 */
export async function getNutritionForFood(
  foodName: string,
  portionEstimateG: number,
): Promise<NutritionBreakdown> {
  const cached = await findCachedReference(foodName);
  if (cached) {
    return {
      calories: scale(cached.calories_per_100g, portionEstimateG),
      proteinG: scale(cached.protein_per_100g, portionEstimateG),
      carbsG: scale(cached.carbs_per_100g, portionEstimateG),
      fatG: scale(cached.fat_per_100g, portionEstimateG),
      fiberG: 0,
      sugarG: 0,
    };
  }

  const local = foodDataset.find((f) => f.name.toLowerCase() === foodName.toLowerCase());
  if (local) {
    void cacheReference({
      food_name: local.name,
      calories_per_100g: local.caloriesPer100g,
      protein_per_100g: local.proteinPer100g,
      carbs_per_100g: local.carbsPer100g,
      fat_per_100g: local.fatPer100g,
      source: "mock-dataset",
    });
    return {
      calories: scale(local.caloriesPer100g, portionEstimateG),
      proteinG: scale(local.proteinPer100g, portionEstimateG),
      carbsG: scale(local.carbsPer100g, portionEstimateG),
      fatG: scale(local.fatPer100g, portionEstimateG),
      fiberG: scale(local.fiberPer100g, portionEstimateG),
      sugarG: scale(local.sugarPer100g, portionEstimateG),
    };
  }

  const estimated = await estimateNutritionWithGemini(foodName);
  if (estimated) {
    void cacheReference({
      food_name: foodName,
      calories_per_100g: estimated.calories,
      protein_per_100g: estimated.proteinG,
      carbs_per_100g: estimated.carbsG,
      fat_per_100g: estimated.fatG,
      source: "gemini-estimate",
    });
    return scaleNutritionPer100g(estimated, portionEstimateG);
  }

  logger.warn("No nutrition data found for food, using generic estimate", { foodName });
  return {
    calories: scale(150, portionEstimateG),
    proteinG: scale(5, portionEstimateG),
    carbsG: scale(20, portionEstimateG),
    fatG: scale(5, portionEstimateG),
    fiberG: scale(1, portionEstimateG),
    sugarG: scale(2, portionEstimateG),
  };
}
