"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CalorieRing } from "@/components/nutrition/CalorieRing";
import { CalorieBarChart } from "@/components/nutrition/CalorieBarChart";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { getDashboardInsight, getDashboardSummary } from "@/lib/api";
import { presentError } from "@/lib/errorMessages";
import type { DashboardSummaryResponse } from "@/lib/types";

export default function DashboardPage() {
  const { token, ready, isGuest } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(true);

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
          <Card className="p-6">
            <CalorieRing consumed={summary.today.calories} target={summary.target} />
          </Card>

          <Card className="p-5">
            <p className="mb-4 text-sm font-medium text-muted">Kalori per Hari</p>
            <CalorieBarChart days={summary.days} target={summary.target} />
          </Card>
        </div>
      )}
    </main>
  );
}
