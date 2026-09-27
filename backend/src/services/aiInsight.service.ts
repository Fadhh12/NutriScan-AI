import { env } from "../config/env";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";
import { supabase } from "../config/supabase";
import { todayLocalDate } from "../utils/localTime";
import type { AiInsight } from "../models/types";
import type { DaySummary } from "./log.service";

export interface InsightInput {
  days: DaySummary[];
  target: number;
}

export interface AiInsightProvider {
  generate(input: InsightInput): Promise<string>;
}

function summarizeForPrompt(input: InsightInput): string {
  const lines = input.days.map(
    (d) =>
      `${d.date}: ${d.calories.toFixed(0)} kkal, protein ${d.proteinG.toFixed(0)}g, karbo ${d.carbsG.toFixed(0)}g, lemak ${d.fatG.toFixed(0)}g`,
  );
  return `Target harian: ${input.target} kkal.\n${lines.join("\n")}`;
}

/**
 * Deterministic, template-based insight — no external call. Looks at simple,
 * explainable signals (days over target, average protein) so the feature
 * works end-to-end without a Gemini key, same idea as the mock
 * food-recognition provider in foodRecognition.service.ts.
 */
class MockInsightProvider implements AiInsightProvider {
  async generate(input: InsightInput): Promise<string> {
    const loggedDays = input.days.filter((d) => d.logCount > 0);
    if (loggedDays.length === 0) {
      return "Belum ada data minggu ini. Scan makananmu dulu supaya insight-nya bisa dihitung.";
    }

    const avgCalories = loggedDays.reduce((sum, d) => sum + d.calories, 0) / loggedDays.length;
    const avgProtein = loggedDays.reduce((sum, d) => sum + d.proteinG, 0) / loggedDays.length;
    const daysOverTarget = loggedDays.filter((d) => d.calories > input.target).length;

    const parts: string[] = [
      `Rata-rata kalori harianmu ${avgCalories.toFixed(0)} kkal dari target ${input.target} kkal.`,
    ];

    if (daysOverTarget >= 3) {
      parts.push(
        `${daysOverTarget} dari ${loggedDays.length} hari kamu lewat target — coba kurangi porsi di makan malam.`,
      );
    } else if (avgCalories < input.target * 0.7) {
      parts.push("Kalorimu cenderung jauh di bawah target — pastikan tetap cukup makan.");
    } else {
      parts.push("Kalorimu cukup konsisten sama target minggu ini.");
    }

    if (avgProtein < 50) {
      parts.push(`Protein rata-rata cuma ${avgProtein.toFixed(0)}g/hari — coba tambah telur, ayam, atau tahu-tempe.`);
    }

    return parts.join(" ");
  }
}

/**
 * Gemini (Google AI Studio) provider — free tier via GEMINI_API_KEY from
 * aistudio.google.com. Plain REST call, no SDK dependency for a single
 * generateContent request.
 */
class GeminiInsightProvider implements AiInsightProvider {
  async generate(input: InsightInput): Promise<string> {
    if (!env.geminiApiKey) {
      throw new AppError("Gemini API key not configured (GEMINI_API_KEY)", 500, "PROVIDER_NOT_CONFIGURED");
    }

    const prompt = [
      "Kamu asisten gizi untuk aplikasi tracking kalori. Berikut data kalori & makro 7 hari terakhir user:",
      summarizeForPrompt(input),
      "Tulis 1-2 kalimat insight personal yang actionable dalam Bahasa Indonesia santai, langsung ke poin, tanpa basa-basi, tanpa emoji, tanpa markdown.",
    ].join("\n\n");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // thinkingBudget: 0 disables extended "thinking" tokens -- without it,
        // reasoning models like gemini-3.8-flash can spend the whole
        // maxOutputTokens budget thinking and return a one-word answer.
        generationConfig: { maxOutputTokens: 300, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("Gemini insight request failed", { status: res.status, body });
      throw new AppError(`Gemini request failed: ${res.status}`, 502, "PROVIDER_ERROR");
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    // The response can come back as multiple parts -- join all of them,
    // not just the first, or longer answers get silently truncated.
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) {
      throw new AppError("Gemini returned an empty response", 502, "PROVIDER_ERROR");
    }
    return text;
  }
}

const providers: Record<string, AiInsightProvider> = {
  mock: new MockInsightProvider(),
  gemini: new GeminiInsightProvider(),
};

function getProvider(): AiInsightProvider {
  const provider = providers[env.aiInsightProvider];
  if (!provider) {
    logger.warn(`Unknown AI_INSIGHT_PROVIDER "${env.aiInsightProvider}", falling back to mock`);
    return providers.mock;
  }
  return provider;
}

export interface InsightResult {
  content: string;
  date: string;
  cached: boolean;
}

/** Generates once per user per day; subsequent calls the same day return the cached row. */
export async function getOrCreateInsight(userId: string, input: InsightInput): Promise<InsightResult> {
  const date = todayLocalDate();

  const { data: existing, error: lookupError } = await supabase
    .from("ai_insights")
    .select()
    .eq("user_id", userId)
    .eq("insight_date", date)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(`Failed to check cached insight: ${lookupError.message}`, 500);
  }
  if (existing) {
    return { content: (existing as AiInsight).content, date, cached: true };
  }

  let content: string;
  try {
    content = await getProvider().generate(input);
  } catch (err) {
    // A "nice to have" AI feature failing shouldn't break the whole dashboard.
    // Free-tier LLM APIs return transient 503s under load; fall back to the
    // deterministic mock rather than surfacing an error for this call.
    logger.warn("AI insight provider failed, falling back to mock", {
      provider: env.aiInsightProvider,
      err: String(err),
    });
    content = await providers.mock.generate(input);
  }

  const { data: saved, error: insertError } = await supabase
    .from("ai_insights")
    .upsert({ user_id: userId, insight_date: date, content }, { onConflict: "user_id,insight_date" })
    .select()
    .single();

  if (insertError || !saved) {
    logger.error("Failed to cache AI insight", { userId, err: insertError?.message });
    return { content, date, cached: false };
  }

  return { content: (saved as AiInsight).content, date, cached: false };
}
