"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { login, register } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { presentError } from "@/lib/errorMessages";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result =
        mode === "login" ? await login({ email, password }) : await register({ name, email, password });
      setSession(result.token, result.user);
      router.push("/calorie-tracker");
    } catch (err) {
      setError(presentError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 pb-10 pt-8">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{mode === "login" ? "Masuk" : "Buat Akun"}</h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "login"
            ? "Masuk untuk simpan riwayat & lihat dashboard."
            : "Buat akun gratis, riwayat scan otomatis tersimpan."}
        </p>
      </header>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted" htmlFor="name">
                Nama
              </label>
              <input
                id="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button fullWidth type="submit" disabled={isSubmitting} className="mt-2">
            {mode === "login" ? "Masuk" : "Daftar"}
          </Button>
        </form>
      </Card>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="text-center text-sm font-medium text-accent"
      >
        {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
      </button>

      <Link href="/calorie-tracker" className="text-center text-sm text-muted underline">
        Lanjut sebagai Guest
      </Link>
    </main>
  );
}
