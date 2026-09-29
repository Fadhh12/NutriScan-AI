import { describe, expect, it } from "vitest";
import { inferMealType } from "../src/utils/localTime";

function wibHour(hour: number): Date {
  // inferMealType reads getUTCHours(), so build a Date whose UTC hour is the WIB hour under test.
  return new Date(Date.UTC(2026, 0, 1, hour, 0, 0));
}

describe("inferMealType", () => {
  it("returns breakfast before 10:00", () => {
    expect(inferMealType(wibHour(0))).toBe("breakfast");
    expect(inferMealType(wibHour(9))).toBe("breakfast");
  });

  it("returns lunch from 10:00 up to 15:00", () => {
    expect(inferMealType(wibHour(10))).toBe("lunch");
    expect(inferMealType(wibHour(14))).toBe("lunch");
  });

  it("returns dinner from 15:00 up to 21:00", () => {
    expect(inferMealType(wibHour(15))).toBe("dinner");
    expect(inferMealType(wibHour(20))).toBe("dinner");
  });

  it("returns snack from 21:00 onward", () => {
    expect(inferMealType(wibHour(21))).toBe("snack");
    expect(inferMealType(wibHour(23))).toBe("snack");
  });
});
