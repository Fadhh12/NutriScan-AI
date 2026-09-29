import { describe, expect, it } from "vitest";
import { scaleNutritionPer100g } from "../src/services/nutrition.service";

describe("scaleNutritionPer100g", () => {
  const per100g = {
    calories: 200,
    proteinG: 10,
    carbsG: 20,
    fatG: 5,
    fiberG: 2,
    sugarG: 8,
  };

  it("scales every macro proportionally to the portion size", () => {
    expect(scaleNutritionPer100g(per100g, 100)).toEqual(per100g);
    expect(scaleNutritionPer100g(per100g, 150)).toEqual({
      calories: 300,
      proteinG: 15,
      carbsG: 30,
      fatG: 7.5,
      fiberG: 3,
      sugarG: 12,
    });
  });

  it("returns zero for every macro at a zero portion", () => {
    expect(scaleNutritionPer100g(per100g, 0)).toEqual({
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
      sugarG: 0,
    });
  });

  it("rounds results to one decimal place", () => {
    const result = scaleNutritionPer100g({ ...per100g, calories: 333 }, 33);
    expect(result.calories).toBe(109.9);
  });
});
