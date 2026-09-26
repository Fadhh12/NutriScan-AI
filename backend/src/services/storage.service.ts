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

/** Extracts the object path within the bucket from a public URL produced by `uploadScanPhoto`. */
function extractStoragePath(imageUrl: string): string | null {
  const marker = `/object/public/${env.supabaseStorageBucket}/`;
  const index = imageUrl.indexOf(marker);
  if (index === -1) return null;
  return imageUrl.slice(index + marker.length);
}

/** SRS 2.3: photos aren't kept past the retention window — only the scan record stays. */
export async function deleteScanPhoto(imageUrl: string): Promise<void> {
  const path = extractStoragePath(imageUrl);
  if (!path) return;

  const { error } = await supabase.storage.from(env.supabaseStorageBucket).remove([path]);
  if (error) {
    throw new AppError(`Failed to delete photo: ${error.message}`, 502, "STORAGE_DELETE_FAILED");
  }
}
