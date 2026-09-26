import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { fail } from "../utils/response";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return fail(res, err.message, err.status, err.code);
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Image exceeds the 8MB size limit" : err.message;
    return fail(res, message, 422, err.code);
  }

  logger.error("Unhandled error", { path: req.path, err: String(err) });
  return fail(res, "Internal server error", 500);
}

export function notFoundHandler(req: Request, res: Response) {
  return fail(res, `Route not found: ${req.method} ${req.path}`, 404);
}
