"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon, ModuleBadge } from "@/components/studio/StudioShell";
import { useAuth } from "@/lib/auth";
import { getDashboardSummary, getLogs } from "@/lib/api";
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

function formatDateLabel(): string {
  return new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const CIRCUMFERENCE = 2 * Math.PI * 50;

export default function CalorieTrackerPage() {
  const { token, ready, isGuest } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    function load() {
      setError(null);
      Promise.all([getDashboardSummary(token!), getLogs(todayISO(), token!)])
        .then(([summaryRes, logsRes]) => {
          setSummary(summaryRes);
          setLogs(logsRes.logs);
        })
        .catch((err) => setError(presentError(err).message))
        .finally(() => setIsLoading(false));
    }
    load();
  }, [ready, token]);

  if (ready && isGuest) {
    return (
      <div className="flex flex-col items-center justify-center gap-space-md rounded-2xl border border-slate-200/80 bg-white p-space-xl text-center shadow-sm">
        <p className="font-body-md text-body-md text-slate-600">Masuk dulu buat lihat kalori & makanan yang sudah kamu log hari ini.</p>
        <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800">
          Masuk
        </Link>
      </div>
    );
  }

  const target = summary?.target ?? 0;
  const consumed = summary?.today.calories ?? 0;
  const calLeft = Math.round(target - consumed);
  const progress = target > 0 ? Math.min(1, consumed / target) : 0;
  const offset = CIRCUMFERENCE * (1 - progress);
  const diffPct = target > 0 ? Math.round(((consumed - target) / target) * 100) : 0;

  // No per-macro goal is stored, so the split below is derived from the
  // same default ratio the AI plan recommendation uses (30P/45C/25F),
  // just to give the rings something to compare today's grams against.
  const targetProteinG = Math.round((target * 0.3) / 4);
  const targetCarbsG = Math.round((target * 0.45) / 4);
  const targetFatG = Math.round((target * 0.25) / 9);

  return (
    <>
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div>
          <ModuleBadge moduleLabel="Module 02 // Metabolic Budget" description="Dynamic Calorie Deficit Engine" color="emerald" />
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">
            Today&apos;s Calories &amp; Daily Intake
          </h1>
        </div>
        <div className="flex items-center gap-space-xs">
          <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium capitalize text-slate-700 shadow-sm">{formatDateLabel()}</span>
          <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900">
            <Icon name="settings" className="text-[18px]" />
          </Link>
        </div>
      </div>

      {isLoading && <div className="rounded-2xl border border-slate-200/80 bg-white p-space-xl text-center font-body-sm text-body-sm text-slate-500 shadow-sm">Memuat data hari ini…</div>}
      {!isLoading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-space-md font-body-sm text-body-sm text-rose-600">{error}</div>}

      {!isLoading && summary && (
        <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="font-title-md text-title-md font-bold text-slate-900">Today&apos;s calories</span>
            </div>

            <div className="my-space-lg flex flex-col items-center justify-center gap-space-xl sm:flex-row">
              <div className="relative flex h-44 w-44 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle className="fill-none stroke-slate-100" cx="60" cy="60" r="50" strokeWidth="10" />
                  <circle
                    className="fill-none stroke-rose-500 transition-all duration-500"
                    cx="60"
                    cy="60"
                    r="50"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    strokeWidth="10"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-metric-display text-metric-display font-extrabold leading-none tracking-tight text-slate-900">
                    {Math.abs(calLeft)}
                  </span>
                  <span className="mt-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {calLeft >= 0 ? "Cal left" : "Cal over"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
                <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">Daily goal</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-md text-headline-md font-bold text-slate-900">{target}</span>
                  <span className="font-body-sm text-body-sm text-slate-500">kcal</span>
                </div>
                <div className={`flex items-center gap-1 font-label-sm text-xs font-semibold ${diffPct > 10 ? "text-amber-600" : "text-emerald-600"}`}>
                  <Icon name={diffPct > 10 ? "trending_up" : "trending_flat"} className="text-[14px]" />
                  <span>{diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`} dari target</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-space-sm pt-space-md">
              <MacroStat label="Protein" value={summary.today.proteinG} of={targetProteinG} color="bg-rose-500" textColor="text-rose-600" />
              <MacroStat label="Carbs" value={summary.today.carbsG} of={targetCarbsG} color="bg-emerald-500" textColor="text-emerald-600" />
              <MacroStat label="Fat" value={summary.today.fatG} of={targetFatG} color="bg-blue-500" textColor="text-blue-600" />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-7">
            <div className="mb-space-md flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-slate-900">Recently Logged Meals</h3>
                <p className="font-body-sm text-body-sm text-slate-500">Makanan yang sudah kamu log hari ini</p>
              </div>
              <Link href="/scanner" className="flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200/80">
                <Icon name="add" className="text-[16px]" />
                Log Food
              </Link>
            </div>

            {logs.length === 0 ? (
              <p className="font-body-sm text-body-sm text-slate-500">Belum ada makanan yang di-log hari ini. Scan foto makananmu buat mulai.</p>
            ) : (
              <div className="flex flex-col gap-space-md">
                {logs.slice(0, 4).map((log) => (
                  <MealRow key={log.id} log={log} />
                ))}
              </div>
            )}

            <div className="flex flex-col gap-1 pt-space-md font-body-sm text-body-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>{logs.length} entri di-log hari ini</span>
              <Link className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline" href="/history">
                Lihat semua riwayat &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MacroStat({
  label,
  value,
  of,
  color,
  textColor,
}: {
  label: string;
  value: number;
  of: number;
  color: string;
  textColor: string;
}) {
  const pct = of > 0 ? Math.min(100, Math.round((value / of) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between font-label-sm text-xs text-slate-500">
        <span>{label}</span>
        <span className={`font-bold ${textColor}`}>{pct}%</span>
      </div>
      <span className="font-title-md text-title-md font-bold text-slate-900">
        {value.toFixed(0)} <span className="font-body-sm text-body-sm text-slate-500">/ {of}g</span>
      </span>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MealRow({ log }: { log: LogEntry }) {
  const name = log.scan?.detected_food_name ?? "Makanan";
  return (
    <div className="flex flex-col justify-between gap-space-md rounded-xl border border-slate-100 bg-slate-50 p-space-md transition-all hover:bg-slate-100/60 sm:flex-row sm:items-center">
      <div className="flex items-center gap-space-md">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200/60 bg-slate-200">
          {log.scan?.image_url && <Image alt={name} fill className="object-cover" src={log.scan.image_url} unoptimized />}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs">
            <span className="font-title-lg text-title-lg font-bold text-slate-900">{name}</span>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-label-sm text-[10px] font-semibold text-slate-500">
              {formatTime(log.created_at)} · {MEAL_LABEL[log.meal_type]}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-space-xs font-title-md text-title-md font-semibold text-rose-600">
            <span>🔥</span>
            <span>{(log.nutrition?.calories ?? 0).toFixed(0)} calories</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-space-xs">
        <span className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 font-label-sm text-xs font-medium text-slate-700">
          <span className="font-bold text-rose-600">{(log.nutrition?.protein_g ?? 0).toFixed(0)}g</span> Protein
        </span>
        <span className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 font-label-sm text-xs font-medium text-slate-700">
          <span className="font-bold text-emerald-600">{(log.nutrition?.carbs_g ?? 0).toFixed(0)}g</span> Carbs
        </span>
        <span className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 font-label-sm text-xs font-medium text-slate-700">
          <span className="font-bold text-blue-600">{(log.nutrition?.fat_g ?? 0).toFixed(0)}g</span> Fat
        </span>
      </div>
    </div>
  );
}
