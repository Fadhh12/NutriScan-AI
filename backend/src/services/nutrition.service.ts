import { supabase } from "../config/supabase";
import { foodDataset } from "../data/foodDataset";
import { logger } from "../utils/logger";
import type { FoodReference } from "../models/types";

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
