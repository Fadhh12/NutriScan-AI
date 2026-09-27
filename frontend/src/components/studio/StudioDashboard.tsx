"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { confirmScan, submitScan } from "@/lib/api";
import { presentError } from "@/lib/errorMessages";
import type { ScanResponse } from "@/lib/types";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const SECTION_IDS = ["scanner-suite", "calorie-analytics", "custom-planner", "dashboard-analytics", "activity-burn"];

const NAV_LINKS = [
  { label: "AI Scanner", href: "#scanner-suite" },
  { label: "Nutrition Intake", href: "#scanner-suite" },
  { label: "Calorie Tracker", href: "#calorie-analytics" },
  { label: "Custom Plan", href: "#custom-planner" },
  { label: "Dashboard & Analytics", href: "#dashboard-analytics" },
  { label: "Activity Tracker", href: "#activity-burn" },
];

const ANCHOR_TABS = [
  { href: "#scanner-suite", icon: "center_focus_strong", iconColor: "text-rose-600", label: "Vision Studio" },
  { href: "#calorie-analytics", icon: "donut_large", iconColor: "text-emerald-600", label: "Intake Telemetry" },
  { href: "#custom-planner", icon: "tune", iconColor: "text-blue-600", label: "Custom Plan" },
  { href: "#dashboard-analytics", icon: "bar_chart", iconColor: "text-rose-500", label: "Weekly Metrics" },
  { href: "#activity-burn", icon: "fitness_center", iconColor: "text-emerald-600", label: "Energy Burn" },
];

const MODE_TABS = [
  { key: "scan", icon: "photo_camera", label: "Scan food" },
  { key: "barcode", icon: "barcode_scanner", label: "Barcode reader" },
  { key: "table", icon: "table_restaurant", label: "Food table recognition" },
  { key: "upload", icon: "upload_file", label: "Upload meal photo" },
] as const;

type ModeKey = (typeof MODE_TABS)[number]["key"];

const MICRO_CHIPS = [
  { kcal: 74, name: "Avocado", dot: "bg-emerald-500" },
  { kcal: 48, name: "Tofu", dot: "bg-blue-500" },
  { kcal: 36, name: "Carrot", dot: "bg-rose-500" },
  { kcal: 52, name: "Haricot vert", dot: "bg-teal-500" },
  { kcal: 22, name: "Radish", dot: "bg-amber-500" },
  { kcal: 24, name: "Vegetables", dot: "bg-slate-400" },
];

const INGREDIENTS = [
  { value: 74, label: "Avocado" },
  { value: 36, label: "Carrot" },
  { value: 24, label: "Vegetables" },
  { value: 22, label: "Radish" },
  { value: 48, label: "Tofu" },
  { value: 52, label: "Haricot vert" },
];

const WEEK_MACROS = [
  { day: "S", total: 2450, p: 92, c: 128, f: 56, hp: "h-10", hc: "h-16", hf: "h-8" },
  { day: "M", total: 1235, p: 121, c: 104, f: 56, hp: "h-8", hc: "h-12", hf: "h-6" },
  { day: "T", total: 2176, p: 92, c: 117, f: 48, hp: "h-9", hc: "h-14", hf: "h-7" },
  { day: "W", total: 2176, p: 92, c: 117, f: 48, hp: "h-9", hc: "h-14", hf: "h-7", today: true },
  { day: "T", total: 2470, p: 96, c: 128, f: 56, hp: "h-10", hc: "h-16", hf: "h-8" },
  { day: "F", total: 1924, p: 88, c: 102, f: 54, hp: "h-7", hc: "h-12", hf: "h-7" },
  { day: "S", total: 2165, p: 92, c: 117, f: 58, hp: "h-9", hc: "h-14", hf: "h-8" },
];

const STEPS_WEEK = [
  { day: "S", h: "70%" },
  { day: "M", h: "40%" },
  { day: "T", h: "55%" },
  { day: "W", h: "85%", today: true },
  { day: "T", h: "20%" },
  { day: "F", h: "80%" },
  { day: "S", h: "65%" },
];

export function StudioDashboard() {
  const { token } = useAuth();
  const [qty, setQty] = useState(1);
  const baseCalories = 256;

  const [sliderCal, setSliderCal] = useState(1893);
  const [sliderProtein, setSliderProtein] = useState(120);
  const [sliderCarbs, setSliderCarbs] = useState(380);
  const [sliderFat, setSliderFat] = useState(85);

  const [activeSection, setActiveSection] = useState(SECTION_IDS[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const [mode, setMode] = useState<ModeKey>("scan");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedMsg, setConfirmedMsg] = useState<string | null>(null);

  function resetUpload() {
    setPreviewUrl(null);
    setScanResult(null);
    setScanError(null);
    setConfirmedMsg(null);
  }

  function selectMode(next: ModeKey) {
    setMode(next);
    if (next !== "upload") resetUpload();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resetUpload();
    setPreviewUrl(URL.createObjectURL(file));
    setIsScanning(true);
    try {
      const res = await submitScan(file, token);
      setScanResult(res);
      setQty(1);
    } catch (err) {
      setScanError(presentError(err).message);
    } finally {
      setIsScanning(false);
    }
  }

  async function handleConfirmLog() {
    if (!scanResult) return;
    setIsConfirming(true);
    try {
      await confirmScan(scanResult.scan.id, { confirmed: true }, token);
      setConfirmedMsg("Tersimpan ke log hari ini.");
    } catch (err) {
      setScanError(presentError(err).message);
    } finally {
      setIsConfirming(false);
    }
  }

  const detected = scanResult
    ? {
        name: scanResult.scan.detected_food_name ?? "Makanan",
        calories: Math.round(scanResult.nutrition.calories * qty),
        protein: scanResult.nutrition.protein_g * qty,
        carbs: scanResult.nutrition.carbs_g * qty,
        fat: scanResult.nutrition.fat_g * qty,
        portion: scanResult.scan.portion_estimate_g,
        confidence: scanResult.scan.confidence_score,
      }
    : {
        name: "Vegetable salad",
        calories: qty * baseCalories,
        protein: 53 * qty,
        carbs: 156 * qty,
        fat: 64 * qty,
        portion: null as number | null,
        confidence: null as number | null,
      };
  const macroTotal = detected.protein + detected.carbs + detected.fat || 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body-md text-[#0F172A] antialiased selection:bg-rose-100 selection:text-rose-900">
      {/* Header */}
      <header className="fixed top-0 left-0 z-50 w-full border-b border-slate-200/80 bg-white/90 shadow-[0_1px_6px_rgba(15,23,42,0.04)] backdrop-blur-xl">
        <div className="flex h-20 w-full items-center justify-between gap-gutter px-margin">
          <div className="flex items-center gap-space-lg">
            <a className="group flex items-center gap-space-sm" href="#">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 transition-all group-hover:bg-rose-100/60">
                <Icon name="view_in_ar" className="text-[24px] text-rose-600" />
              </div>
              <div className="flex flex-col">
                <span className="flex items-center gap-space-xs font-headline-sm text-headline-sm tracking-tight text-slate-900">
                  NutriScan<span className="text-rose-600">AI</span>
                </span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-slate-500">
                  Metabolic Vision
                </span>
              </div>
            </a>
            <nav className="hidden items-center gap-space-xs rounded-xl border border-slate-200/60 bg-slate-100/80 p-1 xl:flex">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === `#${activeSection}`;
                return (
                  <a
                    key={link.label}
                    aria-current={isActive ? "page" : undefined}
                    href={link.href}
                    className={
                      isActive
                        ? "rounded-lg bg-white px-space-md py-space-sm text-sm font-semibold text-slate-900 shadow-sm transition-all duration-300"
                        : "rounded-lg px-space-md py-space-sm text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-white/60 hover:text-slate-900"
                    }
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="hidden items-center gap-space-md rounded-xl border border-slate-200/70 bg-slate-100/80 px-3.5 py-1.5 md:flex">
              <div className="flex flex-col items-end">
                <span className="font-label-sm text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Target Cal
                </span>
                <span className="text-sm font-bold text-emerald-700">1,840 / 2,400</span>
              </div>
              <div className="h-6 w-px bg-slate-300" />
              <div className="flex flex-col">
                <span className="font-label-sm text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Deficit
                </span>
                <span className="text-sm font-bold text-rose-600">-560 kcal</span>
              </div>
            </div>
            <Link
              href={token ? "/dashboard" : "/login"}
              className="hidden items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 hover:shadow-md sm:inline-flex"
            >
              {token ? "Buka Dashboard" : "Get Started Free"}
            </Link>
            <Link
              href={token ? "/profile" : "/login"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition-transform hover:scale-105"
            >
              <Icon name="person" className="text-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-140px)] w-full bg-[#F8FAFC] pt-20">
        <div className="flex w-full flex-col">
          {/* Subheader HUD */}
          <div className="flex w-full flex-wrap items-center justify-between gap-space-md border-b border-slate-200/80 bg-white px-margin py-3.5">
            <div className="flex items-center gap-space-md">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 font-label-md text-label-md font-semibold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Neural Engine v4.8 Active
              </span>
              <span className="hidden font-body-sm text-body-sm text-slate-500 md:inline">
                Instant Food Recognition (99.4% accuracy) · Spatial Caloric Projection
              </span>
            </div>
            <div className="scrollbar-none flex items-center gap-space-xs overflow-x-auto py-0.5">
              {ANCHOR_TABS.map((tab) => {
                const isActive = tab.href === `#${activeSection}`;
                return (
                  <a
                    key={tab.label}
                    href={tab.href}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
                      isActive
                        ? "border-slate-900/10 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200/60 bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    <Icon name={tab.icon} className={`text-[16px] ${isActive ? "text-white" : tab.iconColor}`} />
                    {tab.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-space-xl px-margin py-space-xl">
            {/* ================= SECTION 1: VISION STUDIO ================= */}
            <section className="flex flex-col gap-space-lg" id="scanner-suite">
              <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
                <div>
                  <div className="mb-space-xs flex items-center gap-space-sm">
                    <span className="rounded-full border border-rose-200/70 bg-rose-50 px-2.5 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-wider text-rose-700">
                      Module 01 // Computer Vision
                    </span>
                    <span className="font-label-sm text-label-sm text-slate-500">
                      High-Resolution Food Instance Segmentation
                    </span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">
                    AI Camera &amp; Nutritional Vision Studio
                  </h2>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  {MODE_TABS.map((tab) => {
                    const isActive = mode === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => selectMode(tab.key)}
                        className={`flex items-center gap-space-xs rounded-lg px-space-md py-space-sm text-sm transition-all duration-300 ${
                          isActive
                            ? "bg-slate-900 font-semibold text-white shadow-sm"
                            : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <Icon name={tab.icon} className={`text-[18px] ${isActive ? "text-rose-400" : ""}`} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
                {/* Left: viewfinder */}
                <div className="group relative flex min-h-[540px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 shadow-md lg:col-span-7">
                  {mode === "scan" && (
                    <div key="scan" className="animate-fade-up contents">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Detected Meal Plate"
                        className="absolute inset-0 h-full w-full select-none object-cover transition-transform duration-700 group-hover:scale-105"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxp_zfUqMJZP95ZFkv0VXPsAqMytGFfK1NW-MXRWrx7w7PCA_eunwJwTIADZWSGglfr3esPMB6wspXBNSF502aRPAtGQA0-q9CaEsJtMWwwBpk_M58ismCYsMb8SKXpdo0634tyriDbWXLoYtw0NTn31RZ8xnVSNdcT5UARIUJgnnPvU4TvTu4hrgntYDg3LkqIsBRm3xxZUTUNhBbOzYZrTdPtJYlLMjEJ5ThITVal_l0y87h1Ys8"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

                      <div className="relative z-10 flex items-center justify-between p-space-lg">
                        <div className="flex items-center gap-space-sm rounded-full border border-slate-200/60 bg-white/95 px-space-md py-space-xs shadow-md backdrop-blur-md">
                          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-rose-600" />
                          <span className="font-label-sm text-[11px] font-bold uppercase tracking-widest text-slate-800">
                            Target Lock: Meal Identified
                          </span>
                        </div>
                        <div className="flex items-center gap-space-xs">
                          <span className="rounded-lg border border-slate-200/60 bg-white/95 px-space-sm py-space-xs font-label-sm text-xs font-semibold text-slate-700 backdrop-blur-md">
                            FOV 84°
                          </span>
                          <span className="rounded-lg border border-emerald-200/60 bg-emerald-50/95 px-space-sm py-space-xs font-label-sm text-xs font-bold text-emerald-700 backdrop-blur-md">
                            Conf: 99.4%
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 flex flex-col justify-center gap-space-xl p-space-lg">
                        <div className="relative ml-8 self-start transition-all hover:scale-105 sm:ml-16">
                          <div className="flex items-center gap-space-sm rounded-xl border border-slate-200/80 bg-white px-space-md py-space-xs text-slate-900 shadow-lg">
                            <span className="font-title-md text-title-md text-rose-500">🔥</span>
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-headline-sm leading-none text-slate-900">
                                157 <span className="font-body-sm text-body-sm text-slate-500">kcal</span>
                              </span>
                              <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                chicken breast
                              </span>
                            </div>
                            <span className="ml-space-xs rounded bg-emerald-50 px-1.5 py-0.5 font-label-sm text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                              98%
                            </span>
                          </div>
                          <div className="absolute -bottom-3 left-6 h-2.5 w-2.5 rounded-full bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.8)]" />
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-space-lg pr-4 sm:pr-12">
                          <div className="relative transition-all hover:scale-105">
                            <div className="flex items-center gap-space-sm rounded-xl border border-slate-200/80 bg-white px-space-md py-space-xs text-slate-900 shadow-lg">
                              <span className="font-title-md text-title-md text-rose-500">🔥</span>
                              <div className="flex flex-col">
                                <span className="font-headline-sm text-headline-sm leading-none text-slate-900">
                                  86 <span className="font-body-sm text-body-sm text-slate-500">kcal</span>
                                </span>
                                <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  tomato
                                </span>
                              </div>
                            </div>
                            <div className="absolute -top-3 right-6 h-2.5 w-2.5 rounded-full bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.8)]" />
                          </div>
                          <div className="relative transition-all hover:scale-105">
                            <div className="flex items-center gap-space-sm rounded-xl border border-slate-200/80 bg-white px-space-md py-space-xs text-slate-900 shadow-lg">
                              <span className="font-title-md text-title-md text-rose-500">🔥</span>
                              <div className="flex flex-col">
                                <span className="font-headline-sm text-headline-sm leading-none text-slate-900">
                                  34 <span className="font-body-sm text-body-sm text-slate-500">kcal</span>
                                </span>
                                <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  lettuce
                                </span>
                              </div>
                            </div>
                            <div className="absolute -bottom-3 left-6 h-2.5 w-2.5 rounded-full bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.8)]" />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-space-xs pt-space-md">
                          {MICRO_CHIPS.map((chip) => (
                            <span
                              key={chip.name}
                              className="flex items-center gap-1 rounded-lg border border-slate-200/60 bg-white/95 px-space-sm py-1 font-label-sm text-xs font-medium text-slate-800 shadow-sm backdrop-blur-md"
                            >
                              <span className={`h-2 w-2 rounded-full ${chip.dot}`} /> {chip.kcal} kcal {chip.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center justify-between border-t border-slate-200/80 bg-white/95 p-space-md backdrop-blur-md">
                        <div className="flex items-center gap-space-sm">
                          <Icon name="check_circle" className="text-[22px] text-emerald-600" />
                          <span className="font-body-md text-body-md font-medium text-slate-800">
                            6 ingredients identified automatically
                          </span>
                        </div>
                        <button className="flex items-center gap-space-xs rounded-full bg-rose-600 px-space-lg py-space-sm text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-700">
                          <Icon name="add_a_photo" className="text-[18px]" />
                          Rescan Plate
                        </button>
                      </div>
                    </div>
                  )}

                  {(mode === "barcode" || mode === "table") && (
                    <div key={mode} className="animate-fade-up flex flex-1 flex-col items-center justify-center gap-space-md p-space-xl text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                        <Icon name={mode === "barcode" ? "barcode_scanner" : "table_restaurant"} className="text-[32px] text-rose-400" />
                      </span>
                      <div>
                        <p className="font-title-lg text-title-lg font-semibold text-white">
                          {mode === "barcode" ? "Barcode reader" : "Food table recognition"}
                        </p>
                        <p className="mt-1 max-w-xs font-body-sm text-body-sm text-slate-400">
                          Modul ini lagi dibangun — belum tersambung ke mesin deteksi. Coba &quot;Scan food&quot; atau &quot;Upload meal photo&quot; buat hasil beneran.
                        </p>
                      </div>
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Segera hadir
                      </span>
                    </div>
                  )}

                  {mode === "upload" && (
                    <div key="upload" className="animate-fade-up flex flex-1 flex-col">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      {!previewUrl && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-1 flex-col items-center justify-center gap-space-md p-space-xl text-center transition-colors hover:bg-slate-800/60"
                        >
                          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-slate-600 bg-slate-800">
                            <Icon name="upload_file" className="text-[32px] text-rose-400" />
                          </span>
                          <div>
                            <p className="font-title-lg text-title-lg font-semibold text-white">Upload foto makanan</p>
                            <p className="mt-1 font-body-sm text-body-sm text-slate-400">JPG/PNG · dianalisis oleh model deteksi asli</p>
                          </div>
                        </button>
                      )}

                      {previewUrl && (
                        <div className="relative flex-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt="Foto diupload" className="absolute inset-0 h-full w-full object-cover" src={previewUrl} />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/30" />

                          {isScanning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-space-md">
                              <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-rose-400" />
                              <p className="font-label-sm text-xs font-bold uppercase tracking-widest text-white">Menganalisis foto…</p>
                            </div>
                          )}

                          {!isScanning && scanError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-space-md p-space-lg text-center">
                              <Icon name="error" className="text-[32px] text-rose-400" />
                              <p className="max-w-xs font-body-sm text-body-sm text-white">{scanError}</p>
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-full bg-rose-600 px-space-lg py-space-sm text-xs font-semibold text-white transition-all hover:bg-rose-700"
                              >
                                Coba lagi
                              </button>
                            </div>
                          )}

                          {!isScanning && !scanError && scanResult && (
                            <div className="animate-fade-up relative z-10 flex h-full flex-col justify-between p-space-lg">
                              <div className="flex items-center gap-space-sm self-start rounded-full border border-slate-200/60 bg-white/95 px-space-md py-space-xs shadow-md backdrop-blur-md">
                                <Icon name="check_circle" className="text-[18px] text-emerald-600" />
                                <span className="font-label-sm text-[11px] font-bold uppercase tracking-widest text-slate-800">
                                  Terdeteksi: {detected.name}
                                </span>
                              </div>
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-space-xs self-end rounded-full bg-rose-600 px-space-lg py-space-sm text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-700"
                              >
                                <Icon name="add_a_photo" className="text-[18px]" />
                                Upload foto lain
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: breakdown panel */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-xl text-slate-900 shadow-sm lg:col-span-5">
                  <div className="flex flex-col gap-space-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Detected Item
                        </span>
                        <h3 className="mt-0.5 font-headline-md text-headline-md font-bold tracking-tight text-slate-900 transition-all">
                          {detected.name}
                        </h3>
                      </div>
                      <div className="flex items-center rounded-full border border-slate-200/80 bg-slate-100 p-1">
                        <button
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="px-space-md font-title-md text-title-md font-bold text-slate-900">{qty}</span>
                        <button
                          onClick={() => setQty((q) => q + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-headline-sm text-headline-sm text-rose-500">🔥</span>
                        <span className="font-title-md text-title-md font-semibold text-slate-800">Calories</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-metric-display text-metric-display font-bold tracking-tight text-slate-900 transition-all">
                          {detected.calories}
                        </span>
                        <span className="font-body-sm text-body-sm font-medium text-slate-500">kcal</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-space-md">
                      <MacroBar label="Protein" grams={`${detected.protein.toFixed(0)}g`} pct={(detected.protein / macroTotal) * 100} color="bg-rose-500" />
                      <MacroBar label="Carbs" grams={`${detected.carbs.toFixed(0)}g`} pct={(detected.carbs / macroTotal) * 100} color="bg-emerald-500" />
                      <MacroBar label="Fat" grams={`${detected.fat.toFixed(0)}g`} pct={(detected.fat / macroTotal) * 100} color="bg-blue-500" />
                    </div>

                    {!scanResult && (
                      <div className="flex flex-col gap-space-sm pt-space-xs">
                        <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Ingredients (kcal)
                        </span>
                        <div className="grid grid-cols-3 gap-2.5">
                          {INGREDIENTS.map((ing) => (
                            <div
                              key={ing.label}
                              className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-3 text-center"
                            >
                              <span className="font-headline-sm text-headline-sm font-bold text-slate-900">
                                {ing.value}
                              </span>
                              <span className="font-label-sm text-[11px] font-medium capitalize text-slate-500">
                                {ing.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {scanResult && (
                      <div className="animate-fade-up flex flex-col gap-space-sm pt-space-xs">
                        <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Detail Scan
                        </span>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                            <span className="font-headline-sm text-headline-sm font-bold text-slate-900">
                              {detected.portion ? `${detected.portion.toFixed(0)}g` : "—"}
                            </span>
                            <p className="font-label-sm text-[11px] font-medium text-slate-500">Estimasi porsi</p>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                            <span className="font-headline-sm text-headline-sm font-bold text-slate-900">
                              {detected.confidence !== null ? `${Math.round(detected.confidence * 100)}%` : "—"}
                            </span>
                            <p className="font-label-sm text-[11px] font-medium text-slate-500">Keyakinan</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-space-sm pt-space-lg">
                    <div className="flex items-center gap-space-md">
                      <button
                        onClick={scanResult ? handleConfirmLog : undefined}
                        disabled={!scanResult || isConfirming || !!confirmedMsg}
                        title={!scanResult ? "Data demo — upload foto asli buat log beneran" : undefined}
                        className="flex w-full items-center justify-center gap-space-xs rounded-xl bg-slate-900 py-3 px-space-md text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-900"
                      >
                        <Icon name={confirmedMsg ? "check_circle" : "check"} className="text-[20px] text-emerald-400" />
                        {isConfirming ? "Menyimpan…" : confirmedMsg ? "Tersimpan" : "Confirm & Log Meal"}
                      </button>
                      <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition-all hover:bg-slate-200">
                        <Icon name="tune" className="text-[22px]" />
                      </button>
                    </div>
                    {confirmedMsg && (
                      <p className="animate-fade-up flex items-center gap-1 font-label-sm text-xs font-semibold text-emerald-600">
                        <Icon name="check_circle" className="text-[14px]" />
                        {confirmedMsg}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ================= SECTION 2: CALORIE TRACKER ================= */}
            <section className="flex flex-col gap-space-lg" id="calorie-analytics">
              <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
                <div>
                  <div className="mb-space-xs flex items-center gap-space-sm">
                    <span className="rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Module 02 // Metabolic Budget
                    </span>
                    <span className="font-label-sm text-label-sm text-slate-500">Dynamic Calorie Deficit Engine</span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">
                    Today&apos;s Calories &amp; Daily Intake
                  </h2>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                    Wednesday, Aug 27
                  </span>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900">
                    <Icon name="settings" className="text-[18px]" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-xl shadow-sm lg:col-span-5">
                  <div className="flex items-center justify-between">
                    <span className="font-title-md text-title-md font-bold text-slate-900">Today&apos;s calories</span>
                    <Icon name="more_horiz" className="cursor-pointer text-[20px] text-slate-400 hover:text-slate-600" />
                  </div>

                  <div className="my-space-lg flex flex-col items-center justify-center gap-space-xl sm:flex-row">
                    <div className="relative flex h-44 w-44 items-center justify-center">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                        <circle className="fill-none stroke-slate-100" cx="60" cy="60" r="50" strokeWidth="10" />
                        <circle
                          className="fill-none stroke-rose-500"
                          cx="60"
                          cy="60"
                          r="50"
                          strokeDasharray="314.159"
                          strokeDashoffset="80"
                          strokeLinecap="round"
                          strokeWidth="10"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-metric-display text-metric-display font-extrabold leading-none tracking-tight text-slate-900">
                          486
                        </span>
                        <span className="mt-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Cal left
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-space-xs rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
                      <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Daily goal
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-headline-md text-headline-md font-bold text-slate-900">1893</span>
                        <span className="font-body-sm text-body-sm text-slate-500">kcal</span>
                      </div>
                      <div className="flex items-center gap-1 font-label-sm text-xs font-semibold text-emerald-600">
                        <Icon name="trending_up" className="text-[14px]" />
                        <span>On track (+12%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-space-sm pt-space-md">
                    <MacroStat label="Protein" pct={54} value="65" of="120g" color="bg-rose-500" textColor="text-rose-600" />
                    <MacroStat label="Carbs" pct={67} value="256" of="380g" color="bg-emerald-500" textColor="text-emerald-600" />
                    <MacroStat label="Fat" pct={50} value="43" of="85g" color="bg-blue-500" textColor="text-blue-600" />
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-xl shadow-sm lg:col-span-7">
                  <div className="mb-space-md flex items-center justify-between">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-slate-900">Recently Logged Meals</h3>
                      <p className="font-body-sm text-body-sm text-slate-500">Real-time synchronized caloric telemetry</p>
                    </div>
                    <button className="flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200/80">
                      <Icon name="add" className="text-[16px]" />
                      Log Food
                    </button>
                  </div>

                  <div className="flex flex-col gap-space-md">
                    <MealRow
                      name="Vegetable Salad"
                      time="09:25 PM"
                      calories={256}
                      protein="22g"
                      carbs="156g"
                      fat="24g"
                      image="https://lh3.googleusercontent.com/aida-public/AB6AXuAicJBDw3EcgKj4x61EhbZT3_AVgDd0UocIBKp4BebAcj-0kBGoVoJzOLKQn36PRCQldgHUL9TnJEmCC3dinMXdD1bqVfAM8Ojzzru7pZ9zwZupdhq6f-A2uxNkXH4EgQ-BKqaCrksF37Cyg01x9qjT7_pC7cq3SCHqsxa-0zM4RSHl6me_4eSZj3agPUzTEExs9qXUD-i0Sdyse9a3jTD7UioUREG-5qIUSgQLU60ABDBz-aqYgwQ6"
                    />
                    <MealRow
                      name="Shrimp platter"
                      time="01:15 PM"
                      calories={136}
                      protein="24g"
                      carbs="89g"
                      fat="20g"
                      image="https://lh3.googleusercontent.com/aida-public/AB6AXuBPEu8pXCbEvsKFw_kzjZ2LpwjXh_N7-Z6A0Bw28OaN516YO0YaUZ5ZogMNn_jEnq9SLuko46VbI1RaDX73SI2xEsCWApvOlNzqioVJlWWUABvrAh7SsXA0WV5ABEzmNosf3NJ3Y8mwa1HxyntNURdz9bgBfHuLd9uKnjAkXRVwqV2Dz44ZeUhH3UcidrnFLPl9zEhHu0DNAbamMO5MT2ylC4oz3hSY6KxTfpk4MscV7K-A1Ade_XP4"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-space-md font-body-sm text-body-sm text-slate-500">
                    <span>2 logged entries today · Synchronized with Apple Health</span>
                    <a className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline" href="#">
                      View all 14 weekly entries &rarr;
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= SECTION 3: CUSTOM PLAN ================= */}
            <section className="flex flex-col gap-space-lg" id="custom-planner">
              <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
                <div>
                  <div className="mb-space-xs flex items-center gap-space-sm">
                    <span className="rounded-full border border-blue-200/70 bg-blue-50 px-2.5 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      Module 03 // Adaptive Coaching
                    </span>
                    <span className="font-label-sm text-label-sm text-slate-500">
                      Personalized plans based on your lifestyle
                    </span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">
                    Custom Plan Recommendation
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-xl shadow-sm lg:col-span-8">
                  <div className="flex flex-col gap-space-lg">
                    <div className="flex flex-col justify-between gap-space-md border-b border-slate-100 pb-space-md sm:flex-row sm:items-center">
                      <div>
                        <span className="rounded-full border border-blue-200/70 bg-blue-50 px-2.5 py-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-blue-700">
                          Metabolic Target Set
                        </span>
                        <h3 className="mt-1.5 font-headline-md text-headline-md font-bold tracking-tight text-slate-900">
                          Congratulations, your custom plan is ready!
                        </h3>
                        <p className="mt-0.5 font-body-md text-body-md text-slate-500">
                          Based on your metabolic rate, lifestyle activity, and biometric scans.
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-start sm:items-end">
                        <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          You should lose:
                        </span>
                        <span className="mt-1 rounded-xl border border-slate-200/80 bg-slate-100 px-3.5 py-1.5 font-title-lg text-title-lg font-extrabold text-slate-900">
                          10kg by November 5
                        </span>
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

                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-xl shadow-sm lg:col-span-4">
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
                      <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Deficit Recommendation
                      </span>
                      <p className="font-body-md text-body-md leading-relaxed text-slate-700">
                        A daily deficit of <strong className="text-slate-900">500-600 kcal</strong> creates optimal
                        conditions to hit your <strong className="text-slate-900">10kg reduction target by Nov 5</strong>{" "}
                        without compromising resting metabolic rate.
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-space-md rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-label-sm text-[10px] font-bold uppercase text-slate-500">Optimal Ratio</span>
                        <span className="font-title-md text-title-md font-bold text-slate-900">25P / 55C / 20F</span>
                        <span className="font-body-sm text-body-sm text-slate-500">Endurance &amp; Active Recovery</span>
                      </div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-b-blue-500 border-l-emerald-500 border-r-emerald-500 border-t-rose-500 bg-white font-label-sm text-xs font-bold text-slate-900">
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
            </section>

            {/* ================= SECTION 4: DASHBOARD & ANALYTICS ================= */}
            <section className="flex flex-col gap-space-lg" id="dashboard-analytics">
              <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
                <div>
                  <div className="mb-space-xs flex items-center gap-space-sm">
                    <span className="rounded-full border border-rose-200/70 bg-rose-50 px-2.5 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-wider text-rose-700">
                      Module 04 // Macro Analytics
                    </span>
                    <span className="font-label-sm text-label-sm text-slate-500">Personalize goals on your dashboard</span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">
                    Dashboard &amp; Weekly Aggregates
                  </h2>
                </div>
                <div className="flex items-center gap-space-md">
                  <div className="flex flex-col items-end rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Total Calories
                    </span>
                    <span className="font-title-lg text-title-lg font-bold text-slate-900">
                      15,400 <span className="font-body-sm text-body-sm font-normal text-slate-500">kcal</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-end rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Daily Avg
                    </span>
                    <span className="font-title-lg text-title-lg font-bold text-emerald-700">
                      2,200 <span className="font-body-sm text-body-sm font-normal text-slate-500">kcal</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-xl shadow-sm lg:col-span-5">
                  <div className="mb-space-md flex items-center justify-between">
                    <div>
                      <span className="font-title-md text-title-md font-bold text-slate-900">Weight &amp; Deficit Trajectory</span>
                      <p className="font-body-sm text-body-sm text-slate-500">Aug 23 – Aug 27 (Descending)</p>
                    </div>
                    <Icon name="trending_down" className="text-[24px] text-emerald-600" />
                  </div>

                  <div className="relative my-space-md flex h-48 w-full items-end rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 160">
                      <defs>
                        <linearGradient id="grad-area" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line className="text-slate-200" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="40" y2="40" />
                      <line className="text-slate-200" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="80" y2="80" />
                      <line className="text-slate-200" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="120" y2="120" />
                      <path d="M 0 60 Q 90 65 180 85 T 400 125 L 400 160 L 0 160 Z" fill="url(#grad-area)" />
                      <path d="M 0 60 Q 90 65 180 85 T 400 125" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="3" />
                      <circle cx="0" cy="60" fill="#2563eb" r="4" />
                      <circle cx="100" cy="67" fill="#2563eb" r="4" />
                      <circle cx="200" cy="92" fill="#2563eb" r="4" />
                      <circle cx="300" cy="110" fill="#2563eb" r="4" />
                      <circle cx="400" cy="125" fill="#10b981" r="5" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between pt-space-xs font-label-sm text-xs text-slate-500">
                    <span>08/23 (76.2kg)</span>
                    <span>08/24</span>
                    <span>08/25</span>
                    <span>08/26</span>
                    <span className="font-bold text-emerald-700">08/27 (74.8kg)</span>
                  </div>
                  <div className="mt-space-md flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="font-body-sm text-body-sm font-medium text-slate-600">Net weight variance</span>
                    <span className="font-title-md text-title-md font-bold text-emerald-700">-1.4 kg this cycle</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-xl shadow-sm lg:col-span-7">
                  <div className="mb-space-md flex items-center justify-between">
                    <div>
                      <span className="font-title-lg text-title-lg font-extrabold text-slate-900">Weekly Daily Macro Distribution</span>
                      <p className="font-body-sm text-body-sm text-slate-500">Segmented breakdown: Calories, Protein, Carbs, Fat</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-space-sm">
                      <Legend color="bg-slate-900" label="Calories" />
                      <Legend color="bg-rose-500" label="Protein" />
                      <Legend color="bg-emerald-500" label="Carbs" />
                      <Legend color="bg-blue-500" label="Fat" />
                    </div>
                  </div>

                  <div className="grid h-56 grid-cols-7 items-end gap-space-sm pb-space-sm pt-space-lg sm:gap-space-md">
                    {WEEK_MACROS.map((d, i) => (
                      <div key={i} className="flex h-full flex-col items-center justify-end gap-1.5">
                        <span className={`font-label-sm text-xs font-bold ${d.today ? "text-rose-600" : "text-slate-800"}`}>
                          {d.total}
                        </span>
                        <div
                          className={`flex w-full max-w-[42px] flex-col gap-1 overflow-hidden rounded-t-lg ${
                            d.today ? "ring-2 ring-rose-400/40" : ""
                          }`}
                        >
                          <div className={`${d.hp} flex items-center justify-center rounded-sm bg-rose-500 font-label-sm text-[10px] font-bold text-white`}>
                            {d.p} P
                          </div>
                          <div className={`${d.hc} flex items-center justify-center rounded-sm bg-emerald-500 font-label-sm text-[10px] font-bold text-white`}>
                            {d.c} C
                          </div>
                          <div className={`${d.hf} flex items-center justify-center rounded-sm bg-blue-500 font-label-sm text-[10px] font-bold text-white`}>
                            {d.f} F
                          </div>
                        </div>
                        <span className={`mt-1 font-title-md text-sm font-bold ${d.today ? "text-rose-600" : "text-slate-600"}`}>
                          {d.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ================= SECTION 5: ACTIVITY TRACKER ================= */}
            <section className="flex flex-col gap-space-lg" id="activity-burn">
              <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
                <div>
                  <div className="mb-space-xs flex items-center gap-space-sm">
                    <span className="rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Module 05 // Kinetic Expenditure
                    </span>
                    <span className="font-label-sm text-label-sm text-slate-500">Track calories burned with daily activity</span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">
                    Daily Activity &amp; Caloric Expenditure
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-xl shadow-sm lg:col-span-5">
                  <div className="flex flex-col gap-space-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Active Burn Matrix
                        </span>
                        <h3 className="mt-0.5 font-headline-sm text-headline-sm font-bold text-slate-900">Today&apos;s calories</h3>
                      </div>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/60 bg-slate-100 text-slate-600 transition-all hover:bg-slate-200">
                        <Icon name="tune" className="text-[18px]" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-space-md">
                      <ActivityStat icon="directions_walk" label="Steps" value="+84" bg="bg-rose-50/70" border="border-rose-100" color="text-rose-600" />
                      <ActivityStat icon="fitness_center" label="Weightlifting" value="+156" bg="bg-blue-50/70" border="border-blue-100" color="text-blue-600" />
                      <ActivityStat icon="directions_run" label="Run" value="+35" bg="bg-emerald-50/70" border="border-emerald-100" color="text-emerald-600" />
                      <ActivityStat icon="sports_gymnastics" label="Others" value="+67" bg="bg-amber-50/70" border="border-amber-100" color="text-amber-600" />
                    </div>

                    <div className="flex flex-col gap-space-md rounded-xl border border-slate-100 bg-slate-50 p-space-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-xs">
                          <Icon name="footprint" className="text-[20px] text-slate-800" />
                          <span className="font-headline-sm text-headline-sm font-extrabold text-slate-900">2467</span>
                          <span className="font-body-sm text-body-sm font-medium text-slate-500">steps today</span>
                        </div>
                        <span className="font-label-sm text-xs font-bold text-emerald-700">Goal 10k</span>
                      </div>
                      <div className="grid h-20 grid-cols-7 items-end gap-2 pt-2">
                        {STEPS_WEEK.map((s, i) => (
                          <div key={i} className="flex h-full flex-col items-center justify-end gap-1">
                            <div
                              className={`w-full rounded-t-sm ${s.today ? "bg-slate-900" : "bg-slate-300"}`}
                              style={{ height: s.h }}
                            />
                            <span className={`font-label-sm text-xs ${s.today ? "font-bold text-slate-900" : "text-slate-500"}`}>
                              {s.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-space-md font-body-sm text-body-sm text-slate-500">
                    <span className="font-medium">Total Kinetic Output</span>
                    <span className="font-title-md text-title-md font-extrabold text-slate-900">+342 kcal</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-xl shadow-sm lg:col-span-7">
                  <div className="mb-space-md flex items-center justify-between">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-slate-900">Recently logged</h3>
                      <p className="font-body-sm text-body-sm text-slate-500">Continuous heart rate &amp; caloric burn synchronization</p>
                    </div>
                    <button className="flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200/80">
                      <Icon name="add_circle" className="text-[16px]" />
                      Log Activity
                    </button>
                  </div>

                  <div className="flex flex-col gap-space-md">
                    <ActivityRow icon="fitness_center" iconColor="text-emerald-600" name="Weightlifting" time="09:25 PM" calories={672} duration="60mins" intensity="high" intensityColor="text-rose-600" />
                    <ActivityRow icon="directions_run" iconColor="text-teal-600" name="Running" time="06:30 AM" calories={573} duration="30mins" intensity="medium" intensityColor="text-emerald-700" />
                  </div>

                  <div className="mt-space-md flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Syncing live with Apple Watch Ultra &amp; Garmin Connect</span>
                    </div>
                    <span className="font-label-md text-xs font-bold text-emerald-700">1,245 kcal Total Burn</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function MacroBar({ label, grams, pct, color }: { label: string; grams: string; pct: number; color: string }) {
  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex items-center justify-between font-label-md text-label-md">
        <span className="flex items-center gap-space-xs font-semibold text-slate-800">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
        </span>
        <span className="font-bold text-slate-900">{grams}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-200/50 bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MacroStat({
  label,
  pct,
  value,
  of,
  color,
  textColor,
}: {
  label: string;
  pct: number;
  value: string;
  of: string;
  color: string;
  textColor: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between font-label-sm text-xs text-slate-500">
        <span>{label}</span>
        <span className={`font-bold ${textColor}`}>{pct}%</span>
      </div>
      <span className="font-title-md text-title-md font-bold text-slate-900">
        {value} <span className="font-body-sm text-body-sm text-slate-500">/ {of}</span>
      </span>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MealRow({
  name,
  time,
  calories,
  protein,
  carbs,
  fat,
  image,
}: {
  name: string;
  time: string;
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  image: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-space-md rounded-xl border border-slate-100 bg-slate-50 p-space-md transition-all hover:bg-slate-100/60 sm:flex-row sm:items-center">
      <div className="flex items-center gap-space-md">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200/60 bg-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={name} className="h-full w-full object-cover" src={image} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs">
            <span className="font-title-lg text-title-lg font-bold text-slate-900">{name}</span>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-label-sm text-[10px] font-semibold text-slate-500">
              {time}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-space-xs font-title-md text-title-md font-semibold text-rose-600">
            <span>🔥</span>
            <span>{calories} calories</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-space-xs">
        <span className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 font-label-sm text-xs font-medium text-slate-700">
          <span className="font-bold text-rose-600">{protein}</span> Protein
        </span>
        <span className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 font-label-sm text-xs font-medium text-slate-700">
          <span className="font-bold text-emerald-600">{carbs}</span> Carbs
        </span>
        <span className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 font-label-sm text-xs font-medium text-slate-700">
          <span className="font-bold text-blue-600">{fat}</span> Fat
        </span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 font-label-sm text-xs font-semibold text-slate-700">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
    </span>
  );
}

function ActivityStat({
  icon,
  label,
  value,
  bg,
  border,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  bg: string;
  border: string;
  color: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border ${border} ${bg} p-space-md`}>
      <div className="flex items-center gap-space-xs">
        <Icon name={icon} className={`text-[20px] ${color}`} />
        <span className="text-sm font-semibold text-slate-800">{label}</span>
      </div>
      <span className={`text-base font-extrabold ${color}`}>{value}</span>
    </div>
  );
}

function ActivityRow({
  icon,
  iconColor,
  name,
  time,
  calories,
  duration,
  intensity,
  intensityColor,
}: {
  icon: string;
  iconColor: string;
  name: string;
  time: string;
  calories: number;
  duration: string;
  intensity: string;
  intensityColor: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-space-md rounded-2xl border border-slate-100 bg-slate-50 p-space-md transition-all hover:bg-slate-100/60 sm:flex-row sm:items-center">
      <div className="flex items-center gap-space-md">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <Icon name={icon} className={`text-[32px] ${iconColor}`} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs">
            <span className="font-title-lg text-title-lg font-bold text-slate-900">{name}</span>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-label-sm text-[10px] font-semibold text-slate-500">
              {time}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-space-xs font-title-md text-title-md font-semibold text-rose-600">
            <span>🔥</span>
            <span>{calories} calories</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-1 font-body-sm text-body-sm text-slate-500">
          <Icon name="schedule" className="text-[16px]" />
          <span>{duration}</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-label-sm text-xs font-semibold text-slate-700">
          Intensity: <span className={`font-bold ${intensityColor}`}>{intensity}</span>
        </div>
      </div>
    </div>
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
