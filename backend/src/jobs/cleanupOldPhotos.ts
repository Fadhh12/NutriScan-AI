import { env } from "../config/env";
import { logger } from "../utils/logger";
import { clearScanPhoto, listScansWithExpiredPhotos } from "../services/scan.service";
import { deleteScanPhoto } from "../services/storage.service";

/**
 * SRS 2.3: scan photos aren't kept past PHOTO_RETENTION_DAYS — only the text
 * analysis (detected food, nutrition) persists. Deletes the storage object and
 * clears `scans.image_url`, leaving the scan/log/nutrition rows intact.
 */
export async function cleanupOldPhotos(): Promise<{ processed: number; failed: number }> {
  const expired = await listScansWithExpiredPhotos(env.photoRetentionDays);
  let processed = 0;
  let failed = 0;

  for (const scan of expired) {
    if (!scan.image_url) continue;
    try {
      await deleteScanPhoto(scan.image_url);
      await clearScanPhoto(scan.id);
      processed += 1;
    } catch (err) {
      failed += 1;
      logger.error("Failed to clean up scan photo", { scanId: scan.id, err: String(err) });
    }
  }

  logger.info("Photo retention cleanup finished", { processed, failed, totalFound: expired.length });
  return { processed, failed };
}

cleanupOldPhotos()
  .then(({ processed, failed }) => {
    process.exit(failed > 0 && processed === 0 ? 1 : 0);
  })
  .catch((err) => {
    logger.error("Photo retention cleanup crashed", { err: String(err) });
    process.exit(1);
  });
