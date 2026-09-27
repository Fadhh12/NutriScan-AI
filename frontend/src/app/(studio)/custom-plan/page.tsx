"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, ModuleBadge } from "@/components/studio/StudioShell";
import { useAuth } from "@/lib/auth";
import { getDashboardSummary, getPlanRecommendation, updateTarget } from "@/lib/api";
import { presentError } from "@/lib/errorMessages";
import type { DashboardSummaryResponse, PlanRecommendationResponse } from "@/lib/types";

export default function CustomPlanPage() {
  const { token, ready, isGuest } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [plan, setPlan] = useState<PlanRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sliderCal, setSliderCal] = useState<number | null>(null);
  const [sliderProtein, setSliderProtein] = useState<number | null>(null);
  const [sliderCarbs, setSliderCarbs] = useState<number | null>(null);
  const [sliderFat, setSliderFat] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    function load() {
      setError(null);
      Promise.all([getDashboardSummary(token!), getPlanRecommendation(token!)])
        .then(([summaryRes, planRes]) => {
          setSummary(summaryRes);
          setPlan(planRes);
          setSliderCal(planRes.recommendedCalories);
          setSliderProtein(planRes.proteinG);
          setSliderCarbs(planRes.carbsG);
          setSliderFat(planRes.fatG);
        })
        .catch((err) => setError(presentError(err).message))
        .finally(() => setIsLoading(false));
    }
    load();
  }, [ready, token]);

  function handleRevert() {
    if (!plan) return;
    setSliderCal(plan.recommendedCalories);
    setSliderProtein(plan.proteinG);
    setSliderCarbs(plan.carbsG);
    setSliderFat(plan.fatG);
  }

  async function handleApply() {
    if (!token || sliderCal === null) return;
    setIsSaving(true);
    setSavedMessage(null);
    setError(null);
    try {
      await updateTarget(sliderCal, token);
      setSavedMessage(`Target kalori harian di-update ke ${sliderCal} kkal.`);
    } catch (err) {
      setError(presentError(err).message);
    } finally {
      setIsSaving(false);
    }
  }

  if (ready && isGuest) {
    return (
      <div className="flex flex-col items-center justify-center gap-space-md rounded-2xl border border-slate-200/80 bg-white p-space-xl text-center shadow-sm">
        <p className="font-body-md text-body-md text-slate-600">Masuk dulu biar rekomendasi plan-nya dihitung dari data kalori kamu yang asli.</p>
        <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800">
          Masuk
        </Link>
      </div>
    );
  }

  const total = (sliderProtein ?? 0) * 4 + (sliderCarbs ?? 0) * 4 + (sliderFat ?? 0) * 9;
  const proteinPct = total > 0 ? Math.round(((sliderProtein ?? 0) * 4 * 100) / total) : 0;
  const carbsPct = total > 0 ? Math.round(((sliderCarbs ?? 0) * 4 * 100) / total) : 0;
  const fatPct = total > 0 ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

  const currentTarget = summary?.target ?? null;
  const avgCalories =
    summary && summary.days.some((d) => d.logCount > 0)
      ? summary.days.filter((d) => d.logCount > 0).reduce((sum, d) => sum + d.calories, 0) /
        summary.days.filter((d) => d.logCount > 0).length
      : null;

  return (
    <>
      <div>
        <ModuleBadge moduleLabel="Module 03 // Adaptive Coaching" description="Personalized plans based on your lifestyle" color="blue" />
        <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">Custom Plan Recommendation</h1>
      </div>

      {isLoading && <div className="rounded-2xl border border-slate-200/80 bg-white p-space-xl text-center font-body-sm text-body-sm text-slate-500 shadow-sm">Menghitung rekomendasi plan kamu…</div>}

      {!isLoading && error && !plan && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-space-md font-body-sm text-body-sm text-rose-600">{error}</div>}

      {!isLoading && plan && sliderCal !== null && (
        <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-8">
            <div className="flex flex-col gap-space-lg">
              <div className="flex flex-col justify-between gap-space-md border-b border-slate-100 pb-space-md sm:flex-row sm:items-center">
                <div>
                  <span className="rounded-full border border-blue-200/70 bg-blue-50 px-2.5 py-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-blue-700">AI Recommendation</span>
                  <h3 className="mt-1.5 font-headline-md text-headline-md font-bold tracking-tight text-slate-900">Rekomendasi plan-mu sudah siap!</h3>
                  <p className="mt-0.5 font-body-md text-body-md text-slate-500">Dihitung dari target dan riwayat log kalori 7 hari terakhirmu.</p>
                </div>
                {currentTarget !== null && (
                  <div className="flex shrink-0 flex-col items-start sm:items-end">
                    <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">Target saat ini:</span>
                    <span className="mt-1 rounded-xl border border-slate-200/80 bg-slate-100 px-3.5 py-1.5 font-title-lg text-title-lg font-extrabold text-slate-900">{currentTarget} kkal</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-title-md font-bold text-slate-900">Daily recommendation</span>
                  <button
                    onClick={handleRevert}
                    className="flex items-center gap-1 rounded-lg border border-slate-200/60 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200"
                  >
                    <Icon name="restart_alt" className="text-[14px]" />
                    Revert
                  </button>
                </div>

                <div className="flex flex-col gap-space-lg rounded-xl border border-slate-100 bg-slate-50 p-space-md">
                  <PlanSlider
                    label={
                      <span className="flex items-center gap-space-xs font-title-md text-title-md font-bold text-slate-900">
                        <span className="text-rose-500">🔥</span> Calories
                      </span>
                    }
                    value={sliderCal}
                    display={String(sliderCal)}
                    min={1200}
                    max={3200}
                    onChange={setSliderCal}
                    accent="accent-slate-900"
                  />
                  <PlanSlider
                    label={
                      <span className="flex items-center gap-space-xs font-title-md text-title-md font-bold text-slate-900">
                        <span className="h-3 w-3 rounded-full bg-rose-500" /> Protein
                      </span>
                    }
                    value={sliderProtein ?? 0}
                    display={`${sliderProtein ?? 0}g`}
                    min={30}
                    max={250}
                    onChange={setSliderProtein}
                    accent="accent-rose-500"
                  />
                  <PlanSlider
                    label={
                      <span className="flex items-center gap-space-xs font-title-md text-title-md font-bold text-slate-900">
                        <span className="h-3 w-3 rounded-full bg-emerald-500" /> Carbs
                      </span>
                    }
                    value={sliderCarbs ?? 0}
                    display={`${sliderCarbs ?? 0}g`}
                    min={50}
                    max={500}
                    onChange={setSliderCarbs}
                    accent="accent-emerald-500"
                  />
                  <PlanSlider
                    label={
                      <span className="flex items-center gap-space-xs font-title-md text-title-md font-bold text-slate-900">
                        <span className="h-3 w-3 rounded-full bg-blue-500" /> Fat
                      </span>
                    }
                    value={sliderFat ?? 0}
                    display={`${sliderFat ?? 0}g`}
                    min={15}
                    max={150}
                    onChange={setSliderFat}
                    accent="accent-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-space-lg">
              {error && <p className="mb-space-sm font-body-sm text-body-sm text-rose-500">{error}</p>}
              {savedMessage && <p className="mb-space-sm font-body-sm text-body-sm text-emerald-600">{savedMessage}</p>}
              <button
                onClick={handleApply}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-space-xs rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Menyimpan…" : "Terapkan sebagai target harianku"}
                <Icon name="arrow_forward" className="text-[18px]" />
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-4">
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200/70 bg-blue-50">
                  <Icon name="psychology" className="text-[24px] text-blue-600" />
                </div>
                <div>
                  <h4 className="font-title-lg text-title-lg font-bold text-slate-900">AI Dietitian Synthesis</h4>
                  <span className="font-label-sm text-label-sm text-slate-500">Berdasarkan data logging kamu</span>
                </div>
              </div>
              <div className="flex flex-col gap-space-sm rounded-xl border border-slate-100 bg-slate-50 p-4">
                <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-emerald-700">Rekomendasi</span>
                <p className="font-body-md text-body-md leading-relaxed text-slate-700">{plan.rationale}</p>
              </div>
              {avgCalories !== null && (
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="font-body-sm text-body-sm font-medium text-slate-600">Rata-rata 7 hari terakhir</span>
                  <span className="font-title-md text-title-md font-bold text-slate-900">{avgCalories.toFixed(0)} kkal</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-space-md rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-[10px] font-bold uppercase text-slate-500">Rasio Makro</span>
                  <span className="font-title-md text-title-md font-bold text-slate-900">{proteinPct}P / {carbsPct}C / {fatPct}F</span>
                </div>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-b-blue-500 border-l-emerald-500 border-r-emerald-500 border-t-rose-500 bg-white font-label-sm text-xs font-bold text-slate-900">
                  {proteinPct + carbsPct + fatPct}%
                </div>
              </div>
            </div>
            <div className="mt-space-md flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="font-body-sm text-body-sm font-medium text-slate-500">Recalibrate</span>
              <span className="font-label-md text-xs font-bold text-blue-600">Buka halaman ini lagi kapan saja</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PlanSlider({
  label,
  value,
  display,
  min,
  max,
  onChange,
  accent,
}: {
  label: React.ReactNode;
  value: number;
  display: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex items-center justify-between">
        {label}
        <span className="font-headline-sm text-headline-sm font-extrabold text-slate-900">{display}</span>
      </div>
      <input
        className={`h-2 w-full cursor-pointer rounded-lg bg-slate-200 ${accent}`}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
