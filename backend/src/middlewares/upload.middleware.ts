import multer from "multer";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadScanPhotoMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadSizeBytes },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new AppError("Only JPG, PNG, or WEBP images are allowed", 422, "INVALID_FILE_TYPE"));
      return;
    }
    callback(null, true);
  },
}).single("photo");
