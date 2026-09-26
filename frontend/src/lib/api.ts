import type { ConfirmScanResponse, ScanResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new ApiError(
      body?.error?.message ?? "Terjadi kesalahan, coba lagi",
      res.status,
      body?.error?.code,
    );
  }
  return body.data as T;
}

export async function submitScan(file: File): Promise<ScanResponse> {
  const form = new FormData();
  form.append("photo", file);

  const res = await fetch(`${API_BASE_URL}/scan`, { method: "POST", body: form });
  return parseResponse<ScanResponse>(res);
}

export async function confirmScan(
  scanId: string,
  body: { confirmed?: boolean; rejected?: boolean; foodName?: string; portionEstimateG?: number },
): Promise<ConfirmScanResponse> {
  const res = await fetch(`${API_BASE_URL}/scan/${scanId}/confirm`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse<ConfirmScanResponse>(res);
}
