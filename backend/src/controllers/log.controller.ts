import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";
import { todayLocalDate } from "../utils/localTime";
import { deleteLog, listLogsForDate } from "../services/log.service";

function parseDateQuery(raw: unknown): string {
  if (raw === undefined) return todayLocalDate();
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new AppError("Query param 'date' harus format YYYY-MM-DD", 422, "INVALID_DATE");
  }
  return raw;
}

export async function getLogs(req: Request, res: Response) {
  const date = parseDateQuery(req.query.date);
  const logs = await listLogsForDate(req.auth!.sub, date);
  return ok(res, { date, logs });
}

export async function removeLog(req: Request, res: Response) {
  await deleteLog(req.auth!.sub, req.params.id);
  return ok(res, { deleted: true });
}
