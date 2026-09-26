import { randomUUID } from "node:crypto";
import { supabase } from "../config/supabase";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadScanPhoto(
  buffer: Buffer,
  mimeType: string,
  ownerId: string | null,
): Promise<string> {
  const extension = EXTENSION_BY_MIME[mimeType] ?? "jpg";
  const path = `${ownerId ?? "guest"}/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(env.supabaseStorageBucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    throw new AppError(`Failed to upload photo: ${error.message}`, 502, "STORAGE_UPLOAD_FAILED");
  }

  const { data } = supabase.storage.from(env.supabaseStorageBucket).getPublicUrl(path);
  return data.publicUrl;
}
