import { env } from "../config/env";
import { logger } from "../utils/logger";
import type { DaySummary } from "./log.service";
import type { ActivitySummary } from "./activity.service";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatContext {
  userName: string;
  target: number;
  today: DaySummary;
  week: DaySummary[];
  todayActivities: ActivitySummary;
  todayMeals: Array<{ name: string; calories: number; mealType: string }>;
}

export interface AiChatProvider {
  reply(messages: ChatMessage[], context: ChatContext): Promise<string>;
}

function buildContextSummary(context: ChatContext): string {
  const weekLines = context.week.length
    ? context.week
        .map((d) => `${d.date}: ${d.calories.toFixed(0)} kkal (protein ${d.proteinG.toFixed(0)}g, karbo ${d.carbsG.toFixed(0)}g, lemak ${d.fatG.toFixed(0)}g)`)
        .join("\n")
    : "(belum ada riwayat log dalam 7 hari terakhir)";

  const mealLines = context.todayMeals.length
    ? context.todayMeals.map((m) => `- ${m.name} (${m.mealType}): ${m.calories.toFixed(0)} kkal`).join("\n")
    : "(belum ada makanan yang dicatat hari ini)";

  const activityLine =
    context.todayActivities.totalCaloriesBurned > 0
      ? `${context.todayActivities.totalDurationMinutes} menit, ${context.todayActivities.totalCaloriesBurned} kkal terbakar`
      : "belum ada aktivitas tercatat hari ini";

  return [
    `Nama user: ${context.userName}`,
    `Target kalori harian: ${context.target} kkal`,
    `Kalori masuk hari ini: ${context.today.calories.toFixed(0)} kkal (Protein ${context.today.proteinG.toFixed(0)}g, Karbo ${context.today.carbsG.toFixed(0)}g, Lemak ${context.today.fatG.toFixed(0)}g)`,
    `Aktivitas hari ini: ${activityLine}`,
    `Makanan yang sudah dicatat hari ini:\n${mealLines}`,
    `Riwayat kalori 7 hari terakhir:\n${weekLines}`,
  ].join("\n\n");
}

/**
 * Deterministic fallback: no real conversation, just reflects the numbers
 * back so the feature still works end-to-end without a Gemini key, and
 * doubles as the safety net if the real provider errors out mid-chat.
 */
class MockChatProvider implements AiChatProvider {
  async reply(messages: ChatMessage[], context: ChatContext): Promise<string> {
    const remaining = context.target - context.today.calories;
    return [
      "(Mode demo — AI_CHAT_PROVIDER belum diaktifkan ke Gemini di server ini.)",
      `Hari ini kamu sudah makan ${context.today.calories.toFixed(0)} kkal dari target ${context.target} kkal`,
      remaining >= 0 ? `, sisa sekitar ${remaining.toFixed(0)} kkal lagi.` : `, sudah lewat target sekitar ${Math.abs(remaining).toFixed(0)} kkal.`,
    ].join("");
  }
}

const SYSTEM_PROMPT_HEADER = [
  "Kamu adalah AI Coach Gizi untuk aplikasi NutriScan AI — asisten personal yang membantu user memahami pola makan dan aktivitasnya sendiri.",
  "Jawab dalam Bahasa Indonesia yang santai tapi kompeten, seperti ahli gizi yang ramah dan to the point. Hindari heading markdown berlebihan; bullet sederhana boleh kalau memang membantu keterbacaan.",
  "SELALU dasarkan jawaban pada data user di bawah ini — jangan pernah mengarang angka yang tidak ada di data itu.",
  "Kalau user minta 'laporan', 'analisa', atau 'report', susun ringkasan terstruktur: tren kalori & makro minggu ini, keseimbangan protein/karbo/lemak, ringkasan aktivitas, lalu 2-3 rekomendasi actionable yang spesifik ke datanya.",
  "Kalau user minta rekomendasi menu/makanan, sesuaikan dengan sisa kalori dan kekurangan makro hari ini (misal kalau protein kurang, sarankan sumber protein).",
  "Kalau data user masih kosong (belum ada log hari ini / minggu ini), bilang terus terang dan arahkan buat mulai scan atau log makanan dulu — jangan berpura-pura ada data.",
  "Kalau ditanya di luar topik gizi/aktivitas/aplikasi ini, jawab singkat lalu arahkan balik ke topik nutrisi.",
].join(" ");

/**
 * Real conversational provider via the Gemini API (same GEMINI_API_KEY used
 * elsewhere). Uses systemInstruction for persona + injected user data, and
 * maps the chat history into Gemini's user/model turn format.
 */
class GeminiChatProvider implements AiChatProvider {
  async reply(messages: ChatMessage[], context: ChatContext): Promise<string> {
    if (!env.geminiApiKey) {
      throw new Error("Gemini API key not configured (GEMINI_API_KEY)");
    }

    const systemInstruction = `${SYSTEM_PROMPT_HEADER}\n\nData user saat ini:\n${buildContextSummary(context)}`;
    // Cap history sent to the model so a long-running conversation doesn't
    // balloon token usage — recent turns carry the relevant context anyway.
    const recentMessages = messages.slice(-12);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: recentMessages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 900, temperature: 0.6, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("Gemini chat request failed", { status: res.status, body });
      throw new Error(`Gemini chat request failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new Error("Gemini returned an empty chat response");
    }
    return text;
  }
}

const providers: Record<string, AiChatProvider> = {
  mock: new MockChatProvider(),
  gemini: new GeminiChatProvider(),
};

function getProvider(): AiChatProvider {
  const provider = providers[env.aiChatProvider];
  if (!provider) {
    logger.warn(`Unknown AI_CHAT_PROVIDER "${env.aiChatProvider}", falling back to mock`);
    return providers.mock;
  }
  return provider;
}

export async function getChatReply(messages: ChatMessage[], context: ChatContext): Promise<string> {
  const provider = getProvider();
  try {
    return await provider.reply(messages, context);
  } catch (err) {
    if (provider === providers.mock) throw err;
    logger.warn("AI chat provider failed, falling back to mock", { provider: env.aiChatProvider, err: String(err) });
    return providers.mock.reply(messages, context);
  }
}
