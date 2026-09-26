import { env } from "../config/env";
import { foodDataset } from "../data/foodDataset";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

export interface FoodCandidate {
  name: string;
  confidence: number;
  portionEstimateG: number;
}

export interface RecognitionResult {
  isFood: boolean;
  candidates: FoodCandidate[];
}

export interface FoodRecognitionProvider {
  recognize(imageBuffer: Buffer): Promise<RecognitionResult>;
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
 * without a paid/rate-limited 3rd-party API key.
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

const providers: Record<string, FoodRecognitionProvider> = {
  mock: new MockFoodRecognitionProvider(),
  logmeal: new LogMealFoodRecognitionProvider(),
};

export function getFoodRecognitionProvider(): FoodRecognitionProvider {
  const provider = providers[env.foodRecognitionProvider];
  if (!provider) {
    logger.warn(`Unknown FOOD_RECOGNITION_PROVIDER "${env.foodRecognitionProvider}", falling back to mock`);
    return providers.mock;
  }
  return provider;
}

export async function recognizeWithTimeout(imageBuffer: Buffer): Promise<RecognitionResult> {
  const provider = getFoodRecognitionProvider();

  return Promise.race([
    provider.recognize(imageBuffer),
    new Promise<RecognitionResult>((_resolve, reject) => {
      setTimeout(() => reject(new AppError("Recognition service timed out", 504, "PROVIDER_TIMEOUT")), env.scanTimeoutMs);
    }),
  ]);
}
