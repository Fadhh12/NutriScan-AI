import { createClient } from "@supabase/supabase-js";
import { env } from "./env";
import { logger } from "../utils/logger";

const isConfigured = env.supabaseUrl.length > 0 && env.supabaseServiceRoleKey.length > 0;

if (!isConfigured) {
  logger.warn(
    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — DB-backed endpoints will fail until configured",
  );
}

export const supabase = createClient(
  isConfigured ? env.supabaseUrl : "https://placeholder.supabase.co",
  isConfigured ? env.supabaseServiceRoleKey : "placeholder-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
