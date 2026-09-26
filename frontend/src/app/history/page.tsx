"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BottomNav } from "@/components/ui/BottomNav";
import { useAuth } from "@/lib/auth";
import { deleteLogEntry, getLogs } from "@/lib/api";
import type { LogEntry, MealType } from "@/lib/types";

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Sarapan",
  lunch: "Makan Siang",
  dinner: "Makan Malam",
  snack: "Camilan",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HistoryPage() {
  const { token, ready, isGuest } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token) return;
    function load() {
      setIsLoading(true);
      getLogs(date, token!)
        .then((res) => setLogs(res.logs))
        .catch(() => setLogs([]))
        .finally(() => setIsLoading(false));
    }
    load();
  }, [ready, token, date]);

  async function handleDelete(id: string) {
    if (!token) return;
    await deleteLogEntry(id, token);
    setLogs((prev) => prev.filter((log) => log.id !== id));
  }

  if (ready && isGuest) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-24 pt-8 text-center">
        <h1 className="text-xl font-semibold">Riwayat</h1>
        <p className="text-sm text-muted">Buat akun untuk simpan riwayat scan kamu.</p>
        <Link href="/login">
          <Button>Buat Akun / Masuk</Button>
        </Link>
        <BottomNav />
      </main>
    );
  }

  const totalCalories = logs.reduce((sum, log) => sum + (log.nutrition?.calories ?? 0), 0);

  return (
    <main className="flex flex-1 flex-col gap-5 px-5 pb-24 pt-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Riwayat</h1>
        <p className="mt-1 text-sm text-muted">Total {totalCalories.toFixed(0)} kkal pada tanggal ini.</p>
      </header>

      <input
        type="date"
        value={date}
        max={todayISO()}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {isLoading && <p className="text-sm text-muted">Memuat...</p>}

      {!isLoading && logs.length === 0 && (
        <Card className="p-5 text-sm text-muted">Belum ada makanan yang di-log tanggal ini.</Card>
      )}

      <div className="flex flex-col gap-3">
        {logs.map((log) => (
          <Card key={log.id} className="flex items-center gap-3 p-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-control bg-surface-elevated">
              {log.scan?.image_url && (
                <Image
                  src={log.scan.image_url}
                  alt={log.scan.detected_food_name ?? "Makanan"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{log.scan?.detected_food_name ?? "Makanan"}</p>
              <p className="text-xs text-muted">
                {MEAL_LABEL[log.meal_type]} · {(log.nutrition?.calories ?? 0).toFixed(0)} kkal
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(log.id)}
              className="text-muted transition hover:text-danger"
              aria-label="Hapus log"
            >
              <Trash size={18} />
            </button>
          </Card>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
