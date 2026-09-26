import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { deleteLog, listLogsForDate } from "../services/log.service";

function todayLocalDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getLogs(req: Request, res: Response) {
  const date = (req.query.date as string | undefined) ?? todayLocalDate();
  const logs = await listLogsForDate(req.auth!.sub, date);
  return ok(res, { date, logs });
}

export async function removeLog(req: Request, res: Response) {
  await deleteLog(req.auth!.sub, req.params.id);
  return ok(res, { deleted: true });
}
