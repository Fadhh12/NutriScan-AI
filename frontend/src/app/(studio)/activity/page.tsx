"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, ModuleBadge } from "@/components/studio/StudioShell";
import { useAuth } from "@/lib/auth";
import { deleteActivity, getActivities, logActivity } from "@/lib/api";
import { presentError } from "@/lib/errorMessages";
import type { Activity, ActivityIntensity, ActivitySummary, ActivityType } from "@/lib/types";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
function todayLocalDate(): string {
  return new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

const ACTIVITY_META: Record<ActivityType, { label: string; icon: string; color: string; bg: string; border: string }> = {
  walking: { label: "Jalan Kaki", icon: "directions_walk", color: "text-rose-600", bg: "bg-rose-50/70", border: "border-rose-100" },
  running: { label: "Lari", icon: "directions_run", color: "text-emerald-600", bg: "bg-emerald-50/70", border: "border-emerald-100" },
  cycling: { label: "Bersepeda", icon: "directions_bike", color: "text-blue-600", bg: "bg-blue-50/70", border: "border-blue-100" },
  weightlifting: { label: "Angkat Beban", icon: "fitness_center", color: "text-violet-600", bg: "bg-violet-50/70", border: "border-violet-100" },
  swimming: { label: "Berenang", icon: "pool", color: "text-cyan-600", bg: "bg-cyan-50/70", border: "border-cyan-100" },
  yoga: { label: "Yoga", icon: "self_improvement", color: "text-amber-600", bg: "bg-amber-50/70", border: "border-amber-100" },
  other: { label: "Lainnya", icon: "sports_gymnastics", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
};

const INTENSITY_META: Record<ActivityIntensity, { label: string; color: string }> = {
  low: { label: "low", color: "text-emerald-700" },
  medium: { label: "medium", color: "text-amber-700" },
  high: { label: "high", color: "text-rose-600" },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

export default function ActivityPage() {
  const { token, isGuest } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<ActivityType>("running");
  const [formIntensity, setFormIntensity] = useState<ActivityIntensity>("medium");
  const [formDuration, setFormDuration] = useState(30);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function refresh() {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    getActivities(todayLocalDate(), token)
      .then((res) => {
        setActivities(res.activities);
        setSummary(res.summary);
      })
      .catch((err) => setLoadError(presentError(err).message))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    function load() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setLoadError(null);
      getActivities(todayLocalDate(), token)
        .then((res) => {
          setActivities(res.activities);
          setSummary(res.summary);
        })
        .catch((err) => setLoadError(presentError(err).message))
        .finally(() => setIsLoading(false));
    }
    load();
  }, [token]);

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setFormError(null);
    try {
      await logActivity({ activityType: formType, intensity: formIntensity, durationMinutes: formDuration }, token);
      setShowForm(false);
      setFormDuration(30);
      refresh();
    } catch (err) {
      setFormError(presentError(err).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    try {
      await deleteActivity(id, token);
      refresh();
    } catch {
      // best-effort; row stays visible if the delete failed, user can retry
    }
  }

  const typeEntries = summary ? (Object.entries(summary.byType) as Array<[ActivityType, { calories: number; durationMinutes: number; count: number }]>) : [];

  return (
    <>
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div>
          <ModuleBadge moduleLabel="Module 05 // Kinetic Expenditure" description="Track calories burned with daily activity" color="emerald" />
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">Daily Activity &amp; Caloric Expenditure</h1>
        </div>
      </div>

      {isGuest && (
        <div className="flex flex-col items-start gap-space-sm rounded-2xl border border-amber-200/70 bg-amber-50 p-space-md sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body-sm text-body-sm text-amber-800">Masuk dulu buat mulai log aktivitas dan lihat riwayat harianmu.</p>
          <Link href="/login" className="shrink-0 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800">
            Masuk
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
        <div className="flex flex-col justify-between gap-space-lg rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-5">
          <div className="flex flex-col gap-space-lg">
            <div>
              <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Burn Matrix</span>
              <h3 className="mt-0.5 font-headline-sm text-headline-sm font-bold text-slate-900">Kalori terbakar hari ini</h3>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-space-sm sm:gap-space-md">
                {[0, 1].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl border border-slate-100 bg-slate-100" />
                ))}
              </div>
            ) : typeEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-space-sm rounded-xl border border-dashed border-slate-200 bg-slate-50 py-space-lg text-center">
                <Icon name="directions_run" className="text-[28px] text-slate-300" />
                <p className="font-body-sm text-body-sm text-slate-500">Belum ada aktivitas yang dicatat hari ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-space-sm sm:gap-space-md">
                {typeEntries.map(([type, stat]) => {
                  const meta = ACTIVITY_META[type];
                  return (
                    <ActivityStat
                      key={type}
                      icon={meta.icon}
                      label={meta.label}
                      value={`+${stat.calories}`}
                      bg={meta.bg}
                      border={meta.border}
                      color={meta.color}
                    />
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-space-md font-body-sm text-body-sm text-slate-500">
            <span className="font-medium">Total Kinetic Output</span>
            <span className="font-title-md text-title-md font-extrabold text-slate-900">+{summary?.totalCaloriesBurned ?? 0} kcal</span>
          </div>
        </div>

        <div className="flex flex-col gap-space-md rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-7">
          <div className="flex flex-col gap-space-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-slate-900">Recently logged</h3>
              <p className="font-body-sm text-body-sm text-slate-500">Riwayat aktivitas yang kamu catat hari ini</p>
            </div>
            <button
              type="button"
              disabled={isGuest}
              onClick={() => setShowForm((v) => !v)}
              title={isGuest ? "Masuk dulu buat log aktivitas" : undefined}
              className="flex shrink-0 items-center justify-center gap-1 rounded-full border border-slate-200/60 bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name={showForm ? "close" : "add_circle"} className="text-[16px]" />
              {showForm ? "Batal" : "Log Activity"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleLogActivity} className="animate-fade-up flex flex-col gap-space-md rounded-2xl border border-slate-100 bg-slate-50 p-space-md">
              <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="font-label-sm text-[11px] font-semibold uppercase tracking-wide text-slate-500">Jenis aktivitas</span>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ActivityType)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    {(Object.keys(ACTIVITY_META) as ActivityType[]).map((type) => (
                      <option key={type} value={type}>
                        {ACTIVITY_META[type].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-label-sm text-[11px] font-semibold uppercase tracking-wide text-slate-500">Durasi (menit)</span>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Math.max(1, Number(e.target.value)))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </label>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-[11px] font-semibold uppercase tracking-wide text-slate-500">Intensitas</span>
                <div className="flex items-center gap-2">
                  {(Object.keys(INTENSITY_META) as ActivityIntensity[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormIntensity(level)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-all ${
                        formIntensity === level ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              {formError && <p className="font-body-sm text-body-sm text-rose-500">{formError}</p>}
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-space-xs rounded-xl bg-slate-900 px-space-md py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Icon name="check" className="text-[18px]" />
                )}
                Simpan Aktivitas
              </button>
            </form>
          )}

          {loadError && <p className="font-body-sm text-body-sm text-rose-500">{loadError}</p>}

          <div className="flex flex-col gap-space-md">
            {isLoading ? (
              [0, 1].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />)
            ) : activities.length === 0 ? (
              !isGuest && (
                <div className="flex flex-col items-center gap-space-sm rounded-2xl border border-dashed border-slate-200 py-space-xl text-center">
                  <Icon name="add_task" className="text-[28px] text-slate-300" />
                  <p className="font-body-sm text-body-sm text-slate-500">Belum ada aktivitas. Klik &ldquo;Log Activity&rdquo; buat mulai catat.</p>
                </div>
              )
            ) : (
              activities.map((activity) => {
                const meta = ACTIVITY_META[activity.activity_type];
                const intensity = INTENSITY_META[activity.intensity];
                return (
                  <ActivityRow
                    key={activity.id}
                    icon={meta.icon}
                    iconColor={meta.color}
                    name={meta.label}
                    time={formatTime(activity.logged_at)}
                    calories={activity.calories_burned}
                    duration={`${activity.duration_minutes}mins`}
                    intensity={intensity.label}
                    intensityColor={intensity.color}
                    onDelete={() => handleDelete(activity.id)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
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
    <div className={`flex items-center justify-between rounded-2xl border ${border} ${bg} p-space-sm sm:p-space-md`}>
      <div className="flex min-w-0 items-center gap-space-xs">
        <Icon name={icon} className={`shrink-0 text-[20px] ${color}`} />
        <span className="truncate text-xs font-semibold text-slate-800 sm:text-sm">{label}</span>
      </div>
      <span className={`shrink-0 text-sm font-extrabold sm:text-base ${color}`}>{value}</span>
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
  onDelete,
}: {
  icon: string;
  iconColor: string;
  name: string;
  time: string;
  calories: number;
  duration: string;
  intensity: string;
  intensityColor: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-space-md rounded-2xl border border-slate-100 bg-slate-50 p-space-md transition-all hover:bg-slate-100/60 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-space-md">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm sm:h-16 sm:w-16">
          <Icon name={icon} className={`text-[28px] sm:text-[32px] ${iconColor}`} />
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="font-title-lg text-title-lg font-bold text-slate-900">{name}</span>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-label-sm text-[10px] font-semibold text-slate-500">{time}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-space-xs font-title-md text-title-md font-semibold text-rose-600">
            <span>🔥</span>
            <span>{calories} calories</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-space-sm sm:gap-space-md">
        <div className="flex items-center gap-1 font-body-sm text-body-sm text-slate-500">
          <Icon name="schedule" className="text-[16px]" />
          <span>{duration}</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-label-sm text-xs font-semibold text-slate-700">
          Intensity: <span className={`font-bold ${intensityColor}`}>{intensity}</span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Hapus aktivitas"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
        >
          <Icon name="delete" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}
