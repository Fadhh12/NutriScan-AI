/**
 * Repeatable smoke test for the full scan → confirm → log → dashboard flow
 * against a running backend + Supabase-compatible DB. Not a substitute for
 * unit tests — just a fast confidence check that the wiring between
 * services (auth, scan, storage, logs, dashboard) still works end to end.
 *
 * Usage: npm run test:e2e   (backend must be running on API_BASE_URL)
 */
import sharp from "sharp";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000/api";

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string) {
  if (condition) {
    passed += 1;
    console.log(`  ok — ${message}`);
  } else {
    failed += 1;
    console.error(`  FAIL — ${message}`);
  }
}

async function request(path: string, init?: RequestInit): Promise<{ status: number; body: any }> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function main() {
  console.log(`Smoke testing ${API_BASE_URL}\n`);

  console.log("1. health check");
  const health = await request("/health");
  assert(health.status === 200 && health.body?.data?.status === "ok", "GET /health -> 200 ok");

  console.log("2. register");
  const email = `smoke-${Date.now()}@example.com`;
  const register = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Smoke Test", email, password: "password123", dailyCalorieTarget: 2100 }),
  });
  assert(register.status === 201 && register.body?.data?.token, "POST /auth/register -> 201 + token");
  const token = register.body?.data?.token as string;

  console.log("3. submit scan");
  const photo = await sharp({ create: { width: 320, height: 320, channels: 3, background: { r: 180, g: 120, b: 60 } } })
    .jpeg()
    .toBuffer();
  const form = new FormData();
  form.append("photo", new Blob([photo], { type: "image/jpeg" }), "smoke.jpg");
  const scanRes = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const scanBody: any = await scanRes.json();
  assert(scanRes.status === 201 && scanBody?.data?.scan?.id, "POST /scan -> 201 + scan id");
  const scanId = scanBody?.data?.scan?.id as string;
  const imageUrl = scanBody?.data?.scan?.image_url as string;

  console.log("4. photo is actually fetchable from storage");
  const photoRes = await fetch(imageUrl);
  assert(photoRes.status === 200, "uploaded photo URL -> 200");

  console.log("5. confirm scan");
  const confirm = await request(`/scan/${scanId}/confirm`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ confirmed: true }),
  });
  assert(confirm.status === 200 && confirm.body?.data?.scan?.status === "confirmed", "PATCH /scan/:id/confirm -> confirmed");

  console.log("6. log shows up in today's history");
  const logs = await request("/logs", { headers: { Authorization: `Bearer ${token}` } });
  const logEntry = logs.body?.data?.logs?.find((l: { scan_id: string }) => l.scan_id === scanId);
  assert(logs.status === 200 && logEntry, "GET /logs -> includes the confirmed scan");

  console.log("7. dashboard reflects today's calories");
  const dashboard = await request("/dashboard/summary", { headers: { Authorization: `Bearer ${token}` } });
  assert(dashboard.status === 200 && dashboard.body?.data?.today?.calories > 0, "GET /dashboard/summary -> today.calories > 0");
  assert(dashboard.body?.data?.target === 2100, "GET /dashboard/summary -> target matches registered value");

  console.log("8. update calorie target");
  const updateTarget = await request("/users/me/target", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ dailyCalorieTarget: 2500 }),
  });
  assert(updateTarget.status === 200 && updateTarget.body?.data?.daily_calorie_target === 2500, "PATCH /users/me/target -> updated");

  console.log("9. delete the log entry");
  const del = await request(`/logs/${logEntry.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  assert(del.status === 200, "DELETE /logs/:id -> 200");

  console.log("10. AI insight generates and then caches");
  const insight1 = await request("/dashboard/insight", { headers: { Authorization: `Bearer ${token}` } });
  assert(insight1.status === 200 && typeof insight1.body?.data?.content === "string", "GET /dashboard/insight -> 200 + content");
  assert(insight1.body?.data?.cached === false, "first call generates fresh (cached: false)");
  const insight2 = await request("/dashboard/insight", { headers: { Authorization: `Bearer ${token}` } });
  assert(
    insight2.body?.data?.cached === true && insight2.body?.data?.content === insight1.body?.data?.content,
    "second call same day returns the cached row unchanged",
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
