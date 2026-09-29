import { env } from "../config/env";
import { foodDataset } from "../data/foodDataset";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

export interface NutritionPer100g {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
}

export interface FoodCandidate {
  name: string;
  confidence: number;
  portionEstimateG: number;
  /** Only set by providers that estimate composition directly from the photo (e.g. Gemini) —
   * lets the caller skip the local-dataset name lookup and use the model's own estimate. */
  nutrition100g?: NutritionPer100g;
}

export interface RecognitionResult {
  isFood: boolean;
  candidates: FoodCandidate[];
}

export interface FoodRecognitionProvider {
  recognize(imageBuffer: Buffer, mimeType?: string): Promise<RecognitionResult>;
}

function hashBuffer(buffer: Buffer): number {
  let hash = 0;
  for (const byte of buffer) {
    hash = (hash * 31 + byte) >>> 0;
  }
  return hash;
}

/**
 * Deterministic mock provider: derives a pseudo-random but reproducible
 * result from the image bytes, so the same photo always yields the same
 * demo result. Lets the whole scan -> confirm -> log flow work end-to-end
 * without a configured vision API, and doubles as the fallback when the
 * real provider errors out or times out (see recognizeWithTimeout below).
 */
class MockFoodRecognitionProvider implements FoodRecognitionProvider {
  async recognize(imageBuffer: Buffer): Promise<RecognitionResult> {
    const hash = hashBuffer(imageBuffer);
    const primaryIndex = hash % foodDataset.length;
    const primary = foodDataset[primaryIndex];

    // Confidence oscillates between ~0.4 and ~0.97 depending on image bytes,
    // so both the "confirm directly" and "low confidence -> alternatives"
    // branches are reachable for demo/testing purposes.
    const confidence = 0.4 + ((hash % 58) / 100);
    const portionEstimateG = 120 + (hash % 200);

    const alternativeIndexes = [
      (primaryIndex + 1) % foodDataset.length,
      (primaryIndex + 2) % foodDataset.length,
    ];

    const candidates: FoodCandidate[] = [
      { name: primary.name, confidence: Number(confidence.toFixed(2)), portionEstimateG },
      ...alternativeIndexes.map((idx, i) => ({
        name: foodDataset[idx].name,
        confidence: Number((confidence - 0.15 - i * 0.1).toFixed(2)),
        portionEstimateG,
      })),
    ];

    return { isFood: true, candidates };
  }
}

/**
 * Scaffold for the real LogMeal v2 API integration (docs.logmeal.com).
 * Not exercised yet — no API key configured. Wire up when `LOGMEAL_API_KEY`
 * is available; verify exact request/response shape against the account's
 * API version before relying on it in production.
 */
class LogMealFoodRecognitionProvider implements FoodRecognitionProvider {
  async recognize(imageBuffer: Buffer): Promise<RecognitionResult> {
    if (!env.logMealApiKey) {
      throw new AppError(
        "LogMeal API key not configured (LOGMEAL_API_KEY)",
        500,
        "PROVIDER_NOT_CONFIGURED",
      );
    }

    const form = new FormData();
    form.append("image", new Blob([imageBuffer]), "photo.jpg");

    const segmentationRes = await fetch(`${env.logMealBaseUrl}/image/segmentation/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.logMealApiKey}` },
      body: form,
    });

    if (!segmentationRes.ok) {
      throw new AppError(`LogMeal segmentation failed: ${segmentationRes.status}`, 502);
    }

    const segmentation = (await segmentationRes.json()) as {
      imageId: number;
      segmentation_results?: Array<{ class: string; prob: number }>;
    };

    const results = segmentation.segmentation_results ?? [];
    if (results.length === 0) {
      return { isFood: false, candidates: [] };
    }

    const candidates: FoodCandidate[] = results.slice(0, 3).map((r) => ({
      name: r.class,
      confidence: r.prob,
      portionEstimateG: 150,
    }));

    return { isFood: true, candidates };
  }
}

interface GeminiFoodItem {
  name?: unknown;
  confidence?: unknown;
  portionEstimateG?: unknown;
  caloriesPer100g?: unknown;
  proteinPer100g?: unknown;
  carbsPer100g?: unknown;
  fatPer100g?: unknown;
  fiberPer100g?: unknown;
  sugarPer100g?: unknown;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const GEMINI_MAX_ATTEMPTS = 3;

/**
 * Gemini occasionally returns 503 "high demand" for a request or two and then
 * recovers — retrying those (and other transient 5xx/429) instead of giving
 * up immediately avoids silently falling back to the mock provider (which
 * would show the user a confident but unrelated food guess) for what's
 * usually a few-hundred-ms blip.
 */
async function fetchGeminiWithRetry(url: string, body: string): Promise<Response> {
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (res.ok) return res;

    const status = res.status;
    const responseBody = await res.text().catch(() => "");

    if (!RETRYABLE_STATUSES.has(status) || attempt === GEMINI_MAX_ATTEMPTS) {
      logger.error("Gemini food recognition request failed", { status, body: responseBody, attempt });
      throw new AppError(`Gemini vision request failed: ${status}`, 502, "PROVIDER_ERROR");
    }

    logger.warn("Gemini food recognition request failed, retrying", { status, attempt });
    await sleep(attempt * 500);
  }

  throw new AppError("Gemini vision request failed", 502, "PROVIDER_ERROR");
}

/**
 * Real vision-based food recognition using the Gemini multimodal API
 * (aistudio.google.com free tier, same GEMINI_API_KEY used by the AI
 * insight feature). Sends the uploaded photo directly to the model and
 * asks it to both identify the food AND estimate its macro composition,
 * so recognition doesn't depend on the name matching an entry in the
 * local dataset (see NutritionPer100g on FoodCandidate).
 */
class GeminiFoodRecognitionProvider implements FoodRecognitionProvider {
  async recognize(imageBuffer: Buffer, mimeType = "image/jpeg"): Promise<RecognitionResult> {
    if (!env.geminiApiKey) {
      throw new AppError("Gemini API key not configured (GEMINI_API_KEY)", 500, "PROVIDER_NOT_CONFIGURED");
    }

    const knownNames = foodDataset.slice(0, 60).map((f) => f.name).join(", ");
    const prompt = [
      "Kamu adalah sistem computer vision untuk aplikasi tracking kalori makanan Indonesia, setara ahli gizi yang menganalisis foto piring makanan.",
      "Lihat foto ini dengan teliti. Piring/nampan sering berisi BEBERAPA komponen makanan berbeda sekaligus (misalnya: nasi + ayam + telur + kentang + sayur di satu piring). Identifikasi SETIAP komponen yang terlihat SECARA TERPISAH, satu per satu — jangan cuma sebutkan satu item yang paling dominan/besar dan mengabaikan sisanya. Contoh: kalau ada nasi, ayam goreng, dan lalapan di piring yang sama, itu HARUS jadi 3 item terpisah di array, bukan 1 item gabungan.",
      "Untuk tiap komponen, estimasikan porsinya sendiri-sendiri (dalam gram, hanya bagian komponen itu, bukan seluruh piring) dan kandungan gizinya per 100 gram komponen tersebut.",
      `Kalau nama sebuah komponen mirip salah satu dari daftar referensi ini, pakai persis nama itu (ejaan harus sama): ${knownNames}, dst. Kalau tidak ada yang cocok, kasih nama makanan yang jelas dan spesifik (boleh Bahasa Indonesia atau Inggris), misal "Kentang Panggang" bukan cuma "Kentang".`,
      "Kalau foto memang cuma berisi satu jenis makanan/minuman (misal segelas jus atau sepotong buah), balas dengan array berisi 1 item saja — jangan mengarang komponen tambahan yang tidak ada di foto.",
      "Balas HANYA dengan JSON valid, tanpa markdown, tanpa teks lain, dengan skema persis:",
      '{"isFood": boolean, "items": [{"name": string, "confidence": number (0-1, seberapa yakin identifikasi komponen ini benar), "portionEstimateG": number, "caloriesPer100g": number, "proteinPer100g": number, "carbsPer100g": number, "fatPer100g": number, "fiberPer100g": number, "sugarPer100g": number}]}',
      "Maksimal 6 komponen berbeda, urutkan dari yang paling besar porsinya. Kalau foto bukan makanan/minuman sama sekali, balas {\"isFood\": false, \"items\": []}.",
    ].join("\n\n");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

    const res = await fetchGeminiWithRetry(
      url,
      JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: imageBuffer.toString("base64") } },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1400,
          temperature: 0.2,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    );

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new AppError("Gemini returned an empty response", 502, "PROVIDER_ERROR");
    }

    let parsed: { isFood?: unknown; items?: GeminiFoodItem[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      logger.error("Gemini food recognition returned non-JSON response", { text });
      throw new AppError("Gemini returned an unparseable response", 502, "PROVIDER_ERROR");
    }

    if (!parsed.isFood || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return { isFood: false, candidates: [] };
    }

    const candidates: FoodCandidate[] = parsed.items.slice(0, 6).map((item) => ({
      name: typeof item.name === "string" && item.name.trim() ? item.name.trim() : "Makanan tidak dikenal",
      confidence: Math.min(1, Math.max(0, num(item.confidence, 0.5))),
      portionEstimateG: Math.max(1, num(item.portionEstimateG, 150)),
      nutrition100g: {
        calories: Math.max(0, num(item.caloriesPer100g, 150)),
        proteinG: Math.max(0, num(item.proteinPer100g, 5)),
        carbsG: Math.max(0, num(item.carbsPer100g, 20)),
        fatG: Math.max(0, num(item.fatPer100g, 5)),
        fiberG: Math.max(0, num(item.fiberPer100g, 1)),
        sugarG: Math.max(0, num(item.sugarPer100g, 2)),
      },
    }));

    return { isFood: true, candidates };
  }
}

const providers: Record<string, FoodRecognitionProvider> = {
  mock: new MockFoodRecognitionProvider(),
  logmeal: new LogMealFoodRecognitionProvider(),
  gemini: new GeminiFoodRecognitionProvider(),
};

export function getFoodRecognitionProvider(): FoodRecognitionProvider {
  const provider = providers[env.foodRecognitionProvider];
  if (!provider) {
    logger.warn(`Unknown FOOD_RECOGNITION_PROVIDER "${env.foodRecognitionProvider}", falling back to mock`);
    return providers.mock;
  }
  return provider;
}

async function recognizeWithProvider(
  provider: FoodRecognitionProvider,
  imageBuffer: Buffer,
  mimeType: string | undefined,
): Promise<RecognitionResult> {
  return Promise.race([
    provider.recognize(imageBuffer, mimeType),
    new Promise<RecognitionResult>((_resolve, reject) => {
      setTimeout(() => reject(new AppError("Recognition service timed out", 504, "PROVIDER_TIMEOUT")), env.scanTimeoutMs);
    }),
  ]);
}

/**
 * Runs the configured provider. Only falls back to the mock provider when
 * it isn't configured at all (PROVIDER_NOT_CONFIGURED, e.g. no API key set
 * yet) — that's a setup gap, not a real answer, so a demo placeholder is
 * fine. A real request failure (timeout, 5xx after retries) is rethrown
 * instead of silently swapped for a mock guess: showing the user an
 * unrelated "detected" food with a fake confidence score is worse than
 * asking them to retry the scan.
 */
export async function recognizeWithTimeout(imageBuffer: Buffer, mimeType?: string): Promise<RecognitionResult> {
  const provider = getFoodRecognitionProvider();

  try {
    return await recognizeWithProvider(provider, imageBuffer, mimeType);
  } catch (err) {
    const isNotConfigured = err instanceof AppError && err.code === "PROVIDER_NOT_CONFIGURED";
    if (provider === providers.mock || !isNotConfigured) throw err;
    logger.warn("Food recognition provider not configured, falling back to mock", {
      provider: env.foodRecognitionProvider,
      err: String(err),
    });
    return recognizeWithProvider(providers.mock, imageBuffer, mimeType);
  }
}
