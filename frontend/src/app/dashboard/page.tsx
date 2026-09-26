"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BottomNav } from "@/components/ui/BottomNav";
import { CalorieRing } from "@/components/nutrition/CalorieRing";
import { CalorieBarChart } from "@/components/nutrition/CalorieBarChart";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/api";
import { presentError } from "@/lib/errorMessages";
import type { DashboardSummaryResponse } from "@/lib/types";

export default function DashboardPage() {
  const { token, ready, isGuest } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (ready && isGuest) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-24 pt-8 text-center">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">Buat akun untuk lihat grafik kalori mingguan kamu.</p>
        <Link href="/login">
          <Button>Buat Akun / Masuk</Button>
        </Link>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pb-24 pt-8">
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
        <>
          <Card className="p-6">
            <CalorieRing consumed={summary.today.calories} target={summary.target} />
          </Card>

          <Card className="p-5">
            <p className="mb-4 text-sm font-medium text-muted">Kalori per Hari</p>
            <CalorieBarChart days={summary.days} target={summary.target} />
          </Card>
        </>
      )}

      <BottomNav />
    </main>
  );
}
