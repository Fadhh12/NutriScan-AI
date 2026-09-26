export interface FoodDatasetEntry {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g: number;
}

/**
 * Small local reference dataset used by the mock food-recognition provider
 * and as a fallback nutrition source when `food_reference` cache misses.
 * Values are approximate averages, not lab-verified — good enough for a
 * working MVP demo; swap for USDA FoodData Central / LogMeal response data
 * once the real provider is wired in (see services/foodRecognition.service.ts).
 */
export const foodDataset: FoodDatasetEntry[] = [
  { name: "Nasi Putih", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, fiberPer100g: 0.4, sugarPer100g: 0.1 },
  { name: "Nasi Goreng", caloriesPer100g: 168, proteinPer100g: 4.5, carbsPer100g: 24, fatPer100g: 6.5, fiberPer100g: 1.1, sugarPer100g: 1.8 },
  { name: "Ayam Goreng", caloriesPer100g: 246, proteinPer100g: 21, carbsPer100g: 8, fatPer100g: 15, fiberPer100g: 0.2, sugarPer100g: 0.1 },
  { name: "Telur Dadar", caloriesPer100g: 154, proteinPer100g: 10.8, carbsPer100g: 1.6, fatPer100g: 11.5, fiberPer100g: 0, sugarPer100g: 0.8 },
  { name: "Tahu Goreng", caloriesPer100g: 145, proteinPer100g: 10.9, carbsPer100g: 5.4, fatPer100g: 9.4, fiberPer100g: 1.2, sugarPer100g: 0.6 },
  { name: "Tempe Goreng", caloriesPer100g: 195, proteinPer100g: 14.5, carbsPer100g: 9.4, fatPer100g: 11.5, fiberPer100g: 2.5, sugarPer100g: 0.5 },
  { name: "Sate Ayam", caloriesPer100g: 225, proteinPer100g: 18, carbsPer100g: 6.5, fatPer100g: 14, fiberPer100g: 0.3, sugarPer100g: 3.2 },
  { name: "Mie Goreng", caloriesPer100g: 175, proteinPer100g: 4.2, carbsPer100g: 25, fatPer100g: 6.8, fiberPer100g: 1.5, sugarPer100g: 2.1 },
  { name: "Sayur Bayam", caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, fiberPer100g: 2.2, sugarPer100g: 0.4 },
  { name: "Apel", caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, fiberPer100g: 2.4, sugarPer100g: 10.4 },
  { name: "Pisang", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, fiberPer100g: 2.6, sugarPer100g: 12.2 },
  { name: "Roti Tawar", caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2, fiberPer100g: 2.7, sugarPer100g: 5 },
];
