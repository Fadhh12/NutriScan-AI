import { describe, expect, it } from "vitest";
import { confirmScanSchema, registerSchema, updateTargetSchema } from "../src/utils/validation";

describe("registerSchema", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      email: "budi@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      email: "budi@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("confirmScanSchema", () => {
  it("rejects an empty payload (needs confirmed, rejected, or foodName)", () => {
    const result = confirmScanSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts a payload with just confirmed: true", () => {
    const result = confirmScanSchema.safeParse({ confirmed: true });
    expect(result.success).toBe(true);
  });

  it("accepts a correction payload with just a foodName", () => {
    const result = confirmScanSchema.safeParse({ foodName: "Nasi Goreng" });
    expect(result.success).toBe(true);
  });
});

describe("updateTargetSchema", () => {
  it("accepts values within the 800-6000 range", () => {
    expect(updateTargetSchema.safeParse({ dailyCalorieTarget: 2000 }).success).toBe(true);
  });

  it("rejects values below 800", () => {
    expect(updateTargetSchema.safeParse({ dailyCalorieTarget: 500 }).success).toBe(false);
  });

  it("rejects values above 6000", () => {
    expect(updateTargetSchema.safeParse({ dailyCalorieTarget: 7000 }).success).toBe(false);
  });
});
