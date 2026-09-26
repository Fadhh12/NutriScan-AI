"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, ForkKnife } from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";
import { CalorieRing } from "@/components/nutrition/CalorieRing";
import { useAuth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/api";

export default function HomePage() {
  const { token, user, ready, isGuest } = useAuth();
  const [consumedToday, setConsumedToday] = useState(0);
  const [target, setTarget] = useState(2000);

  useEffect(() => {
    if (!ready || !token) return;
    getDashboardSummary(token)
      .then((res) => {
        setConsumedToday(res.today.calories);
        setTarget(res.target);
      })
      .catch(() => {});
  }, [ready, token]);

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pb-24 pt-8 md:px-8 md:pb-12">
      <header className="animate-fade-up">
        <p className="text-sm text-muted">Halo{user ? `, ${user.name.split(" ")[0]}` : ""}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Mau makan apa hari ini?</h1>
      </header>

      <Card className="animate-fade-up p-6 [animation-delay:80ms]">
        <p className="mb-4 text-sm font-medium text-muted">Ringkasan Kalori Hari Ini</p>
        <CalorieRing consumed={consumedToday} target={target} />
      </Card>

      <Link
        href="/scan"
        className="group flex animate-fade-up items-center justify-between rounded-card border border-border bg-accent px-6 py-5 text-accent-foreground transition [animation-delay:160ms] hover:brightness-105 active:scale-[0.98]"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">Mulai</p>
          <p className="text-lg font-semibold">Scan Makanan</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
          <Camera size={24} weight="bold" />
        </span>
      </Link>

      {ready && isGuest ? (
        <Card className="flex animate-fade-up items-center gap-3 p-4 text-sm text-muted [animation-delay:240ms]">
          <ForkKnife size={18} className="shrink-0 text-accent" />
          <p>
            Mode guest — riwayat tidak tersimpan.{" "}
            <Link href="/login" className="font-medium text-accent underline">
              Buat akun
            </Link>{" "}
            untuk simpan riwayat & lihat dashboard.
          </p>
        </Card>
      ) : (
        <Card className="flex animate-fade-up items-center gap-3 p-4 text-sm text-muted [animation-delay:240ms]">
          <ForkKnife size={18} className="shrink-0 text-accent" />
          <p>
            {consumedToday > 0
              ? "Terus lanjutkan tracking kalori harianmu."
              : "Belum ada makanan yang di-log hari ini. Scan foto makananmu untuk mulai tracking."}
          </p>
        </Card>
      )}
    </main>
  );
}
