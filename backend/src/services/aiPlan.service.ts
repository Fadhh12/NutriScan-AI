import { env } from "../config/env";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";
import type { DaySummary } from "./log.service";

export interface PlanInput {
  days: DaySummary[];
  currentTarget: number;
}

export interface PlanRecommendation {
  recommendedCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  rationale: string;
}

export interface AiPlanProvider {
  generate(input: PlanInput): Promise<PlanRecommendation>;
}

function round(n: number): number {
  return Math.round(n);
}

function macrosFromCalories(calories: number, proteinRatio: number, carbsRatio: number, fatRatio: number) {
  return {
    proteinG: round((calories * proteinRatio) / 4),
    carbsG: round((calories * carbsRatio) / 4),
    fatG: round((calories * fatRatio) / 9),
  };
}

/**
 * Deterministic fallback: nudges the current target based on a simple signal
 * (consistently over/under target) instead of a real model call, same role
 * as the mock providers in aiInsight/aiChat.service.ts.
 */
class MockPlanProvider implements AiPlanProvider {
  async generate(input: PlanInput): Promise<PlanRecommendation> {
    const loggedDays = input.days.filter((d) => d.logCount > 0);

    if (loggedDays.length === 0) {
      const calories = input.currentTarget;
      return {
        recommendedCalories: calories,
        ...macrosFromCalories(calories, 0.3, 0.4, 0.3),
        rationale: "Belum ada riwayat log minggu ini, jadi rekomendasi ini masih berdasarkan targetmu saat ini. Scan makananmu beberapa hari dulu supaya rekomendasinya bisa disesuaikan.",
      };
    }

    const avgCalories = loggedDays.reduce((sum, d) => sum + d.calories, 0) / loggedDays.length;
    const avgProtein = loggedDays.reduce((sum, d) => sum + d.proteinG, 0) / loggedDays.length;
    const daysOverTarget = loggedDays.filter((d) => d.calories > input.currentTarget * 1.1).length;
    const daysUnderTarget = loggedDays.filter((d) => d.calories < input.currentTarget * 0.8).length;

    let calories = input.currentTarget;
    let rationale: string;

    if (daysOverTarget >= Math.ceil(loggedDays.length / 2)) {
      calories = round(input.currentTarget - 250);
      rationale = `${daysOverTarget} dari ${loggedDays.length} hari kamu lewat target, jadi target diturunkan jadi sekitar ${calories} kkal biar defisitnya konsisten tanpa kaget.`;
    } else if (daysUnderTarget >= Math.ceil(loggedDays.length / 2)) {
      calories = round(input.currentTarget + 150);
      rationale = `Asupanmu sering jauh di bawah target (${daysUnderTarget} dari ${loggedDays.length} hari), jadi target dinaikkan sedikit ke ${calories} kkal biar tetap cukup tenaga.`;
    } else {
      rationale = `Rata-rata kalorimu ${avgCalories.toFixed(0)} kkal sudah cukup dekat sama target ${input.currentTarget} kkal, jadi targetnya dipertahankan.`;
    }

    const proteinRatio = avgProtein < 60 ? 0.3 : 0.25;
    const macros = macrosFromCalories(calories, proteinRatio, 0.45, 1 - proteinRatio - 0.45);

    if (avgProtein < 60) {
      rationale += ` Protein rata-ratamu cuma ${avgProtein.toFixed(0)}g/hari, jadi porsi protein di plan ini dinaikkan.`;
    }

    return { recommendedCalories: calories, ...macros, rationale };
  }
}

function summarizeForPrompt(input: PlanInput): string {
  const lines = input.days.map(
    (d) => `${d.date}: ${d.calories.toFixed(0)} kkal, protein ${d.proteinG.toFixed(0)}g, karbo ${d.carbsG.toFixed(0)}g, lemak ${d.fatG.toFixed(0)}g`,
  );
  return `Target kalori harian saat ini: ${input.currentTarget} kkal.\n${lines.join("\n")}`;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Real recommendation via Gemini — same GEMINI_API_KEY / AI_INSIGHT_PROVIDER
 * switch used by aiInsight.service.ts, just a different prompt+schema.
 */
class GeminiPlanProvider implements AiPlanProvider {
  async generate(input: PlanInput): Promise<PlanRecommendation> {
    if (!env.geminiApiKey) {
      throw new AppError("Gemini API key not configured (GEMINI_API_KEY)", 500, "PROVIDER_NOT_CONFIGURED");
    }

    const prompt = [
      "Kamu ahli gizi untuk aplikasi tracking kalori. Berikut data kalori & makro user 7 hari terakhir:",
      summarizeForPrompt(input),
      "Berdasarkan data ini, rekomendasikan target kalori harian dan pembagian makro (protein/karbo/lemak dalam gram) yang realistis dan sehat untuk minggu depan.",
      "Balas HANYA dengan JSON valid, tanpa markdown, tanpa teks lain, skema persis:",
      '{"recommendedCalories": number, "proteinG": number, "carbsG": number, "fatG": number, "rationale": string}',
      "rationale harus 1-3 kalimat Bahasa Indonesia santai, actionable, menyebut angka konkret dari data user, tanpa emoji tanpa markdown.",
    ].join("\n\n");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.3,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("Gemini plan recommendation request failed", { status: res.status, body });
      throw new AppError(`Gemini request failed: ${res.status}`, 502, "PROVIDER_ERROR");
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!text) {
      throw new AppError("Gemini returned an empty response", 502, "PROVIDER_ERROR");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      logger.error("Gemini plan recommendation returned non-JSON response", { text });
      throw new AppError("Gemini returned an unparseable response", 502, "PROVIDER_ERROR");
    }

    if (typeof parsed.recommendedCalories !== "number" || !Number.isFinite(parsed.recommendedCalories)) {
      throw new AppError("Gemini plan recommendation missing recommendedCalories", 502, "PROVIDER_ERROR");
    }

    return {
      recommendedCalories: round(parsed.recommendedCalories),
      proteinG: round(num(parsed.proteinG, 0)),
      carbsG: round(num(parsed.carbsG, 0)),
      fatG: round(num(parsed.fatG, 0)),
      rationale: typeof parsed.rationale === "string" && parsed.rationale.trim() ? parsed.rationale.trim() : "",
    };
  }
}

const providers: Record<string, AiPlanProvider> = {
  mock: new MockPlanProvider(),
  gemini: new GeminiPlanProvider(),
};

function getProvider(): AiPlanProvider {
  const provider = providers[env.aiInsightProvider];
  if (!provider) {
    logger.warn(`Unknown AI_INSIGHT_PROVIDER "${env.aiInsightProvider}", falling back to mock`);
    return providers.mock;
  }
  return provider;
}

export async function getPlanRecommendation(input: PlanInput): Promise<PlanRecommendation> {
  const provider = getProvider();
  try {
    return await provider.generate(input);
  } catch (err) {
    if (provider === providers.mock) throw err;
    logger.warn("AI plan provider failed, falling back to mock", {
      provider: env.aiInsightProvider,
      err: String(err),
    });
    return providers.mock.generate(input);
  }
}
