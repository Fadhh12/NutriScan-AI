import type { MealType } from "../models/types";

/**
 * App targets Indonesian users (WIB, UTC+7, no DST). The server may run in UTC
 * (default for most hosts/containers), so "today" and "current hour" must be
 * computed in WIB explicitly — never via the server process's local timezone.
 *
 * Pattern: shift the epoch by the fixed offset, then only ever read it back
 * with the UTC getters (getUTCDate/getUTCHours/toISOString). Using the plain
 * (non-UTC) getters here would silently re-apply the server's own timezone
 * on top and double-shift the result.
 */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function nowInWib(): Date {
  return new Date(Date.now() + WIB_OFFSET_MS);
}

export function todayLocalDate(): string {
  return nowInWib().toISOString().slice(0, 10);
}

/** Default meal type by time of day, used when the client doesn't send one explicitly. */
export function inferMealType(reference: Date = nowInWib()): MealType {
  const hour = reference.getUTCHours();
  if (hour < 10) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}
