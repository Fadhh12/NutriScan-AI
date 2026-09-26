import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/auth.service";
import { AppError } from "../utils/AppError";
import type { JwtPayload } from "../models/types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

/** Requires a valid JWT. Use for endpoints that need a real account (History/Dashboard). */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }
  req.auth = verifyToken(token);
  next();
}

/** Attaches req.auth when a valid token is present, but allows guest (no-account) requests through. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    req.auth = verifyToken(token);
  }
  next();
}
