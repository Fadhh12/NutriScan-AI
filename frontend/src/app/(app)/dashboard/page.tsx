"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkle, Clock } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CalorieRing } from "@/components/nutrition/CalorieRing";
import { CalorieBarChart } from "@/components/nutrition/CalorieBarChart";
import { MacroBreakdown } from "@/components/nutrition/MacroBreakdown";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { getDashboardInsight, getDashboardSummary, getLogs } from "@/lib/api";
import { presentError } from "@/lib/errorMessages";
import type { DashboardSummaryResponse, LogEntry, MealType } from "@/lib/types";

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Sarapan",
  lunch: "Makan Siang",
  dinner: "Makan Malam",
  snack: "Camilan",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const { token, ready, isGuest } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(true);
  const [todayLogs, setTodayLogs] = useState<LogEntry[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token) return;
    function load() {
      setError(null);
      getDashboardSummary(token!)
        .then(setSummary)
        .catch((err) => setError(presentError(err).message))
        .finally(() => setIsLoading(false));
    }
    load();
  }, [ready, token]);

  useEffect(() => {
    if (!ready || !token) return;
    getLogs(todayISO(), token)
      .then((res) => setTodayLogs(res.logs))
      .catch(() => setTodayLogs([]))
      .finally(() => setIsLogsLoading(false));
  }, [ready, token]);

  // Separate request, own loading state -- insight generation (Gemini/mock)
  // shouldn't block the ring + chart from rendering while it's in flight.
  useEffect(() => {
    if (!ready || !token) return;
    function load() {
      getDashboardInsight(token!)
        .then((res) => setInsight(res.content))
        .catch(() => setInsight(null))
        .finally(() => setIsInsightLoading(false));
    }
    load();
  }, [ready, token]);

  if (ready && isGuest) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-24 pt-8 text-center">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">Buat akun untuk lihat grafik kalori mingguan kamu.</p>
        <Link href="/login">
          <Button>Buat Akun / Masuk</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pb-24 pt-8 md:px-8 md:pb-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Ringkasan kalori 7 hari terakhir.</p>
      </header>

      {isLoading && (
        <div className="flex flex-col gap-6" aria-live="polite" aria-label="Memuat dashboard">
          <Card className="p-6">
            <div className="flex items-center gap-5">
              <Skeleton className="h-[132px] w-[132px] rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <Skeleton className="mb-4 h-4 w-32" />
            <Skeleton className="h-40 w-full" />
          </Card>
        </div>
      )}

      {!isLoading && error && <Card className="p-5 text-sm text-danger">{error}</Card>}

      {!isLoading && summary && (
        <Card className="border-accent-soft bg-accent-soft/40 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Sparkle size={16} weight="fill" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-accent">Insight AI</p>
              {isInsightLoading ? (
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              ) : (
                <p className="mt-1 text-sm text-foreground">
                  {insight ?? "Insight belum bisa dimuat, coba lagi nanti."}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {!isLoading && summary && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col gap-5 p-6">
            <CalorieRing consumed={summary.today.calories} target={summary.target} />
            <div className="border-t border-border pt-4">
              <MacroBreakdown
                proteinG={summary.today.proteinG}
                carbsG={summary.today.carbsG}
                fatG={summary.today.fatG}
                fiberG={summary.today.fiberG}
              />
            </div>
          </Card>

          <Card className="p-5">
            <p className="mb-4 text-sm font-medium text-muted">Kalori per Hari</p>
            <CalorieBarChart days={summary.days} target={summary.target} />
          </Card>
        </div>
      )}

      {!isLoading && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-muted">Makanan Hari Ini</p>
            <Link href="/history" className="text-xs font-semibold text-accent hover:underline">
              Lihat semua &rarr;
            </Link>
          </div>

          {isLogsLoading && (
            <div className="flex flex-col gap-3" aria-live="polite" aria-label="Memuat makanan hari ini">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-14 w-14 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLogsLoading && todayLogs.length === 0 && (
            <p className="text-sm text-muted">Belum ada makanan yang di-log hari ini.</p>
          )}

          {!isLogsLoading && todayLogs.length > 0 && (
            <div className="flex flex-col gap-3">
              {todayLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-3 rounded-control bg-surface-elevated p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-control bg-surface">
                      {log.scan?.image_url && (
                        <Image
                          src={log.scan.image_url}
                          alt={log.scan.detected_food_name ?? "Makanan"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {log.scan?.detected_food_name ?? "Makanan"}
                        </p>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Clock size={12} /> {formatTime(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-accent">
                        {(log.nutrition?.calories ?? 0).toFixed(0)} kkal · {MEAL_LABEL[log.meal_type]}
                      </p>
                    </div>
                  </div>

                  {log.nutrition && (
                    <div className="flex items-center gap-2">
                      <span className="rounded-control border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground">
                        <span className="font-semibold text-accent">{log.nutrition.protein_g.toFixed(0)}g</span> Protein
                      </span>
                      <span className="rounded-control border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground">
                        <span className="font-semibold text-secondary">{log.nutrition.carbs_g.toFixed(0)}g</span> Karbo
                      </span>
                      <span className="rounded-control border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground">
                        <span className="font-semibold text-tertiary">{log.nutrition.fat_g.toFixed(0)}g</span> Lemak
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </main>
  );
}
