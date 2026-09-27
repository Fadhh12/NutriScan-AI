import type { Request, Response } from "express";
import { foodDataset } from "../data/foodDataset";
import { ok } from "../utils/response";

/** Local reference dataset for the "food table recognition" manual picker — same data nutrition.service falls back to. */
export async function listFoods(req: Request, res: Response) {
  const query = (req.query.q as string | undefined)?.trim().toLowerCase();
  const foods = query ? foodDataset.filter((f) => f.name.toLowerCase().includes(query)) : foodDataset;
  return ok(res, { foods });
}
