"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, ModuleBadge } from "@/components/studio/StudioShell";
import { useAuth, clearSession, setSession } from "@/lib/auth";
import { updateTarget } from "@/lib/api";
import { presentError } from "@/lib/errorMessages";

export default function ProfilePage() {
  const router = useRouter();
  const { token, user, ready, isGuest } = useAuth();
  const [target, setTarget] = useState(2000);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function sync() {
      if (user?.daily_calorie_target) {
        setTarget(user.daily_calorie_target);
      }
    }
    sync();
  }, [user]);

  async function handleSave() {
    if (!token) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await updateTarget(target, token);
      setSession(token, updated);
      setMessage("Target tersimpan.");
    } catch (err) {
      setMessage(presentError(err).message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  return (
    <>
      <div>
        <Link href="/calorie-tracker" className="mb-space-sm inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
          <Icon name="arrow_back" className="text-[16px]" />
          Kembali ke Calorie Tracker
        </Link>
        <ModuleBadge moduleLabel="Module 05 // Account" description="Kelola target harian & sesi login kamu" color="blue" />
        <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">Profil</h1>
      </div>

      {ready && isGuest && (
        <div className="flex flex-col items-center justify-center gap-space-md rounded-2xl border border-slate-200/80 bg-white p-space-xl text-center shadow-sm">
          <p className="font-body-md text-body-md text-slate-600">Kamu belum masuk. Buat akun buat atur target kalori & simpan riwayat.</p>
          <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800">
            Buat Akun / Masuk
          </Link>
        </div>
      )}

      {ready && !isGuest && (
        <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
          <div className="flex flex-col gap-space-md rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-7">
            <div className="flex items-center gap-space-sm border-b border-slate-100 pb-space-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                <Icon name="person" className="text-[22px]" />
              </div>
              <div>
                <h3 className="font-title-lg text-title-lg font-bold text-slate-900">{user?.name}</h3>
                <p className="font-body-sm text-body-sm text-slate-500">{user?.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm">
              <label className="font-label-sm text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="target">
                Target Kalori Harian (kkal)
              </label>
              <input
                id="target"
                type="number"
                min={800}
                max={6000}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="mt-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Menyimpan…" : "Simpan Target"}
              </button>
              {message && <p className="font-body-sm text-body-sm text-emerald-600">{message}</p>}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-space-md rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-5">
            <div>
              <h4 className="font-title-lg text-title-lg font-bold text-slate-900">Sesi</h4>
              <p className="mt-1 font-body-sm text-body-sm text-slate-500">Keluar buat mengakhiri sesi login di perangkat ini.</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-space-xs rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-100"
            >
              <Icon name="logout" className="text-[18px]" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
