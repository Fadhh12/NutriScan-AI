import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),

  supabaseUrl: required("SUPABASE_URL", ""),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY", ""),
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "scan-photos",

  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

  foodRecognitionProvider: process.env.FOOD_RECOGNITION_PROVIDER ?? "mock",
  logMealApiKey: process.env.LOGMEAL_API_KEY ?? "",
  logMealBaseUrl: process.env.LOGMEAL_BASE_URL ?? "https://api.logmeal.com/v2",

  aiInsightProvider: process.env.AI_INSIGHT_PROVIDER ?? "mock",
  aiChatProvider: process.env.AI_CHAT_PROVIDER ?? "mock",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.8-flash",

  maxUploadSizeBytes: Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 8 * 1024 * 1024),
  minImageDimensionPx: Number(process.env.MIN_IMAGE_DIMENSION_PX ?? 300),
  lowConfidenceThreshold: Number(process.env.LOW_CONFIDENCE_THRESHOLD ?? 0.6),
  scanTimeoutMs: Number(process.env.SCAN_TIMEOUT_MS ?? 10_000),
  photoRetentionDays: Number(process.env.PHOTO_RETENTION_DAYS ?? 30),
};
