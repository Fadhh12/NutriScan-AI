"use client";

import { useState } from "react";
import { Icon, ModuleBadge } from "@/components/studio/StudioShell";

export default function CustomPlanPage() {
  const [sliderCal, setSliderCal] = useState(1893);
  const [sliderProtein, setSliderProtein] = useState(120);
  const [sliderCarbs, setSliderCarbs] = useState(380);
  const [sliderFat, setSliderFat] = useState(85);

  return (
    <>
      <div>
        <ModuleBadge moduleLabel="Module 03 // Adaptive Coaching" description="Personalized plans based on your lifestyle" color="blue" />
        <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">Custom Plan Recommendation</h1>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-8">
          <div className="flex flex-col gap-space-lg">
            <div className="flex flex-col justify-between gap-space-md border-b border-slate-100 pb-space-md sm:flex-row sm:items-center">
              <div>
                <span className="rounded-full border border-blue-200/70 bg-blue-50 px-2.5 py-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-blue-700">Metabolic Target Set</span>
                <h3 className="mt-1.5 font-headline-md text-headline-md font-bold tracking-tight text-slate-900">Congratulations, your custom plan is ready!</h3>
                <p className="mt-0.5 font-body-md text-body-md text-slate-500">Based on your metabolic rate, lifestyle activity, and biometric scans.</p>
              </div>
              <div className="flex shrink-0 flex-col items-start sm:items-end">
                <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">You should lose:</span>
                <span className="mt-1 rounded-xl border border-slate-200/80 bg-slate-100 px-3.5 py-1.5 font-title-lg text-title-lg font-extrabold text-slate-900">10kg by November 5</span>
              </div>
            </div>

            <div className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md font-bold text-slate-900">Daily recommendation</span>
                <button
                  onClick={() => {
                    setSliderCal(1893);
                    setSliderProtein(120);
                    setSliderCarbs(380);
                    setSliderFat(85);
                  }}
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
                  value={sliderProtein}
                  display={`${sliderProtein}g`}
                  min={50}
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
                  value={sliderCarbs}
                  display={`${sliderCarbs}g`}
                  min={100}
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
                  value={sliderFat}
                  display={`${sliderFat}g`}
                  min={20}
                  max={150}
                  onChange={setSliderFat}
                  accent="accent-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-space-lg">
            <button className="flex w-full items-center justify-center gap-space-xs rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow">
              Let&apos;s get started
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
                <span className="font-label-sm text-label-sm text-slate-500">Calibrated for Lean Mass Retention</span>
              </div>
            </div>
            <div className="flex flex-col gap-space-sm rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-emerald-700">Deficit Recommendation</span>
              <p className="font-body-md text-body-md leading-relaxed text-slate-700">
                A daily deficit of <strong className="text-slate-900">500-600 kcal</strong> creates optimal conditions to hit your{" "}
                <strong className="text-slate-900">10kg reduction target by Nov 5</strong> without compromising resting metabolic rate.
              </p>
            </div>
            <div className="flex items-center justify-between gap-space-md rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-[10px] font-bold uppercase text-slate-500">Optimal Ratio</span>
                <span className="font-title-md text-title-md font-bold text-slate-900">25P / 55C / 20F</span>
                <span className="font-body-sm text-body-sm text-slate-500">Endurance &amp; Active Recovery</span>
              </div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-b-blue-500 border-l-emerald-500 border-r-emerald-500 border-t-rose-500 bg-white font-label-sm text-xs font-bold text-slate-900">
                100%
              </div>
            </div>
          </div>
          <div className="mt-space-md flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <span className="font-body-sm text-body-sm font-medium text-slate-500">Next recalibration</span>
            <span className="font-label-md text-xs font-bold text-rose-600">In 6 days</span>
          </div>
        </div>
      </div>
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
