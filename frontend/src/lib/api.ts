import type {
  AuthResponse,
  ConfirmScanResponse,
  DashboardSummaryResponse,
  LogsResponse,
  PublicUser,
  ScanResponse,
} from "./types";

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

function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  dailyCalorieTarget?: number;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseResponse<AuthResponse>(res);
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseResponse<AuthResponse>(res);
}

export async function submitScan(file: File, token?: string | null): Promise<ScanResponse> {
  const form = new FormData();
  form.append("photo", file);

  const res = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
    headers: authHeaders(token),
    body: form,
  });
  return parseResponse<ScanResponse>(res);
}

export async function confirmScan(
  scanId: string,
  body: { confirmed?: boolean; rejected?: boolean; foodName?: string; portionEstimateG?: number },
  token?: string | null,
): Promise<ConfirmScanResponse> {
  const res = await fetch(`${API_BASE_URL}/scan/${scanId}/confirm`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  return parseResponse<ConfirmScanResponse>(res);
}

export async function getLogs(date: string, token: string): Promise<LogsResponse> {
  const res = await fetch(`${API_BASE_URL}/logs?date=${date}`, {
    headers: authHeaders(token),
  });
  return parseResponse<LogsResponse>(res);
}

export async function deleteLogEntry(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/logs/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  await parseResponse<{ deleted: boolean }>(res);
}

export async function getDashboardSummary(token: string): Promise<DashboardSummaryResponse> {
  const res = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    headers: authHeaders(token),
  });
  return parseResponse<DashboardSummaryResponse>(res);
}

export async function updateTarget(dailyCalorieTarget: number, token: string): Promise<PublicUser> {
  const res = await fetch(`${API_BASE_URL}/users/me/target`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ dailyCalorieTarget }),
  });
  return parseResponse<PublicUser>(res);
}
