"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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

  if (ready && isGuest) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-24 pt-8 text-center">
        <h1 className="text-xl font-semibold">Profil</h1>
        <p className="text-sm text-muted">Kamu belum masuk. Buat akun untuk atur target kalori & simpan riwayat.</p>
        <Link href="/login">
          <Button>Buat Akun / Masuk</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pb-24 pt-8 md:px-8 md:pb-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{user?.name}</h1>
        <p className="mt-1 text-sm text-muted">{user?.email}</p>
      </header>

      <Card className="p-5">
        <label className="text-xs font-medium text-muted" htmlFor="target">
          Target Kalori Harian (kkal)
        </label>
        <input
          id="target"
          type="number"
          min={800}
          max={6000}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="mt-2 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <Button fullWidth className="mt-4" onClick={handleSave} disabled={isSaving}>
          Simpan Target
        </Button>
        {message && <p className="mt-2 text-sm text-muted">{message}</p>}
      </Card>

      <Button fullWidth variant="secondary" onClick={handleLogout}>
        Keluar
      </Button>
    </main>
  );
}
