"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, ModuleBadge } from "@/components/studio/StudioShell";
import { useAuth } from "@/lib/auth";
import { getDashboardSummary, sendChatMessage } from "@/lib/api";
import { presentError } from "@/lib/errorMessages";
import type { DashboardSummaryResponse, DaySummary } from "@/lib/types";

const REPORT_PROMPT =
  "Buatkan laporan analisa mingguan lengkap dari data kalori & makroku: tren kalori, keseimbangan protein/karbo/lemak, dan 2-3 rekomendasi actionable.";

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function dayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return DAY_LABELS[d.getUTCDay()];
}

export default function AnalyticsPage() {
  const { token, ready, isGuest } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [report, setReport] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

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

  async function generateReport() {
    if (!token) return;
    setIsReportLoading(true);
    setReportError(null);
    try {
      const res = await sendChatMessage([{ role: "user", content: REPORT_PROMPT }], token);
      setReport(res.reply);
    } catch (err) {
      setReportError(presentError(err).message);
    } finally {
      setIsReportLoading(false);
    }
  }

  if (ready && isGuest) {
    return (
      <div className="flex flex-col items-center justify-center gap-space-md rounded-2xl border border-slate-200/80 bg-white p-space-xl text-center shadow-sm">
        <p className="font-body-md text-body-md text-slate-600">Masuk dulu buat lihat analitik mingguan dari data kalori kamu yang asli.</p>
        <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800">
          Masuk
        </Link>
      </div>
    );
  }

  const days: DaySummary[] = summary?.days ?? [];
  const loggedDays = days.filter((d) => d.logCount > 0);
  const totalCalories = days.reduce((sum, d) => sum + d.calories, 0);
  const dailyAvg = loggedDays.length > 0 ? totalCalories / loggedDays.length : 0;

  const maxMacroCal = Math.max(1, ...days.map((d) => d.proteinG * 4 + d.carbsG * 4 + d.fatG * 9));
  const today = days[days.length - 1];

  const maxCalories = Math.max(summary?.target ?? 0, 1, ...days.map((d) => d.calories));
  const points = days.map((d, i) => {
    const x = (i / Math.max(1, days.length - 1)) * 400;
    const y = 160 - (d.calories / maxCalories) * 150;
    return { x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const targetY = summary ? 160 - (summary.target / maxCalories) * 150 : null;

  return (
    <>
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div>
          <ModuleBadge moduleLabel="Module 04 // Macro Analytics" description="Personalize goals on your dashboard" color="rose" />
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">Dashboard &amp; Weekly Aggregates</h1>
        </div>
        <div className="flex items-center gap-space-md">
          <div className="flex flex-col items-end rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Calories</span>
            <span className="font-title-lg text-title-lg font-bold text-slate-900">
              {totalCalories.toFixed(0)} <span className="font-body-sm text-body-sm font-normal text-slate-500">kkal</span>
            </span>
          </div>
          <div className="flex flex-col items-end rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Avg</span>
            <span className="font-title-lg text-title-lg font-bold text-emerald-700">
              {dailyAvg.toFixed(0)} <span className="font-body-sm text-body-sm font-normal text-slate-500">kkal</span>
            </span>
          </div>
        </div>
      </div>

      {isLoading && <div className="rounded-2xl border border-slate-200/80 bg-white p-space-xl text-center font-body-sm text-body-sm text-slate-500 shadow-sm">Memuat data mingguan…</div>}
      {!isLoading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-space-md font-body-sm text-body-sm text-rose-600">{error}</div>}

      {!isLoading && summary && (
        <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-5">
            <div className="mb-space-md flex items-center justify-between">
              <div>
                <span className="font-title-md text-title-md font-bold text-slate-900">Calorie vs Target Trend</span>
                <p className="font-body-sm text-body-sm text-slate-500">
                  {days[0]?.date} – {days[days.length - 1]?.date}
                </p>
              </div>
              <Icon name={today && today.calories > (summary.target ?? 0) ? "trending_up" : "trending_down"} className="text-[24px] text-emerald-600" />
            </div>

            <div className="relative my-space-md flex h-48 w-full items-end rounded-xl border border-slate-100 bg-slate-50/50 p-2">
              <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 160">
                <line className="text-slate-200" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="40" y2="40" />
                <line className="text-slate-200" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="80" y2="80" />
                <line className="text-slate-200" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="120" y2="120" />
                {targetY !== null && (
                  <line stroke="#f43f5e" strokeDasharray="6 4" strokeWidth="1.5" x1="0" x2="400" y1={targetY} y2={targetY} />
                )}
                <path d={linePath} fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="3" />
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} fill={i === points.length - 1 ? "#10b981" : "#2563eb"} r={i === points.length - 1 ? 5 : 4} />
                ))}
              </svg>
            </div>

            <div className="flex items-center justify-between pt-space-xs font-label-sm text-xs text-slate-500">
              {days.map((d, i) => (
                <span key={d.date} className={i === days.length - 1 ? "font-bold text-emerald-700" : ""}>
                  {dayLabel(d.date)}
                </span>
              ))}
            </div>
            <div className="mt-space-md flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="font-body-sm text-body-sm font-medium text-slate-600">Garis putus-putus merah = target harian</span>
              <span className="font-title-md text-title-md font-bold text-slate-900">{summary.target} kkal</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-7">
            <div className="mb-space-md flex flex-col gap-space-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-title-lg text-title-lg font-extrabold text-slate-900">Weekly Daily Macro Distribution</span>
                <p className="font-body-sm text-body-sm text-slate-500">Segmented breakdown: Calories, Protein, Carbs, Fat</p>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm">
                <Legend color="bg-rose-500" label="Protein" />
                <Legend color="bg-emerald-500" label="Carbs" />
                <Legend color="bg-blue-500" label="Fat" />
              </div>
            </div>

            <div className="grid h-56 grid-cols-7 items-end gap-1 pb-space-sm pt-space-lg sm:gap-space-sm md:gap-space-md">
              {days.map((d, i) => {
                const isToday = i === days.length - 1;
                const proteinCal = d.proteinG * 4;
                const carbsCal = d.carbsG * 4;
                const fatCal = d.fatG * 9;
                const scale = 160 / maxMacroCal;
                return (
                  <div key={d.date} className="flex h-full flex-col items-center justify-end gap-1.5">
                    <span className={`font-label-sm text-[10px] font-bold sm:text-xs ${isToday ? "text-rose-600" : "text-slate-800"}`}>{d.calories.toFixed(0)}</span>
                    <div className={`flex w-full max-w-[42px] flex-col-reverse overflow-hidden rounded-t-lg ${isToday ? "ring-2 ring-rose-400/40" : ""}`}>
                      <div style={{ height: `${Math.max(2, proteinCal * scale)}px` }} className="flex items-center justify-center bg-rose-500 font-label-sm text-[9px] font-bold text-white sm:text-[10px]">
                        {d.proteinG.toFixed(0)}
                      </div>
                      <div style={{ height: `${Math.max(2, carbsCal * scale)}px` }} className="flex items-center justify-center bg-emerald-500 font-label-sm text-[9px] font-bold text-white sm:text-[10px]">
                        {d.carbsG.toFixed(0)}
                      </div>
                      <div style={{ height: `${Math.max(2, fatCal * scale)}px` }} className="flex items-center justify-center bg-blue-500 font-label-sm text-[9px] font-bold text-white sm:text-[10px]">
                        {d.fatG.toFixed(0)}
                      </div>
                    </div>
                    <span className={`mt-1 font-title-md text-xs font-bold sm:text-sm ${isToday ? "text-rose-600" : "text-slate-600"}`}>{dayLabel(d.date)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-space-md rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-12">
            <div className="flex flex-col justify-between gap-space-sm sm:flex-row sm:items-center">
              <div className="flex items-center gap-space-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200/70 bg-rose-50">
                  <Icon name="description" className="text-[22px] text-rose-600" />
                </div>
                <div>
                  <h4 className="font-title-lg text-title-lg font-bold text-slate-900">Laporan Analisa AI</h4>
                  <span className="font-label-sm text-label-sm text-slate-500">Dibuat AI Coach dari data minggu ini</span>
                </div>
              </div>
              <button
                type="button"
                onClick={generateReport}
                disabled={isReportLoading}
                className="flex shrink-0 items-center gap-1.5 self-start rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
              >
                {isReportLoading ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Icon name="auto_awesome" className="text-[16px]" />
                )}
                {report ? "Buat ulang laporan" : "Buat laporan"}
              </button>
            </div>

            {reportError && <p className="font-body-sm text-body-sm text-rose-500">{reportError}</p>}

            {!report && !isReportLoading && !reportError && (
              <p className="font-body-sm text-body-sm text-slate-500">Klik &quot;Buat laporan&quot; buat minta AI Coach menganalisa tren kalori & makromu minggu ini.</p>
            )}

            {report && <p className="whitespace-pre-wrap font-body-md text-body-md leading-relaxed text-slate-700">{report}</p>}
          </div>
        </div>
      )}
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 font-label-sm text-xs font-semibold text-slate-700">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
    </span>
  );
}
