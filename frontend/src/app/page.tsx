import Link from "next/link";
import {
  Camera,
  ClockCounterClockwise,
  ChartBar,
  Sparkle,
  ArrowRight,
  ForkKnife,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";

const STEPS = [
  { title: "Foto", description: "Ambil foto atau upload dari galeri." },
  { title: "Deteksi", description: "Sistem kenali jenis makanan & estimasi porsi." },
  { title: "Konfirmasi", description: "Cocok? Simpan. Kalau kurang tepat, pilih alternatif." },
  { title: "Log otomatis", description: "Masuk riwayat harian, dashboard update sendiri." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            NutriScan <span className="text-accent">AI</span>
          </span>
          <div className="hidden items-center gap-1 md:flex">
            <a
              href="#fitur"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-elevated hover:text-foreground"
            >
              Fitur
            </a>
            <a
              href="#cara-kerja"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-elevated hover:text-foreground"
            >
              Cara kerja
            </a>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-elevated hover:text-foreground"
            >
              Masuk
            </Link>
            <Link
              href="/scan"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:brightness-105 active:scale-[0.98]"
            >
              Coba Scan Gratis
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-soft opacity-60 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-accent-soft opacity-40 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:items-center md:gap-16 md:px-8 md:py-24">
            <div>
              <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                <Sparkle size={12} weight="fill" />
                Kalori & gizi, dibaca dari foto
              </span>
              <h1 className="mt-4 animate-fade-up text-4xl font-semibold tracking-tight text-foreground [animation-delay:40ms] md:text-5xl">
                Foto makananmu. Kalorinya kelihatan sendiri.
              </h1>
              <p className="mt-5 max-w-md animate-fade-up text-base text-muted [animation-delay:100ms] md:text-lg">
                NutriScan AI membaca foto makanan atau minumanmu dan langsung menghitung
                estimasi kalori serta gizinya — tanpa cari manual di internet, tanpa input
                satu-satu.
              </p>
              <div className="mt-8 flex flex-wrap animate-fade-up items-center gap-3 [animation-delay:200ms]">
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-105 active:scale-[0.98]"
                >
                  Coba Scan Gratis
                  <ArrowRight size={16} weight="bold" />
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface-elevated"
                >
                  Buat akun
                </Link>
              </div>
              <div className="mt-6 flex animate-fade-up flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted [animation-delay:260ms]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-accent" />
                  Gratis dicoba
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-accent" />
                  Gak perlu akun buat mulai
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-accent" />4 langkah ke hasil
                </span>
              </div>
            </div>

            {/* Decorative product preview — mirrors the real ResultStep card */}
            <div className="relative mx-auto w-full max-w-sm animate-fade-up [animation-delay:150ms] md:mx-0 md:justify-self-end">
              <div className="rotate-2 rounded-card border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_rgba(28,25,23,0.12)]">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Terdeteksi</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Sate Ayam</h2>
                <p className="mt-1 text-sm text-muted">Estimasi porsi 130g · Keyakinan 94%</p>
                <div className="mt-5 border-t border-border pt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Kalori</p>
                  <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-foreground">
                    292 <span className="text-base font-normal text-muted">kkal</span>
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 -rotate-3 rounded-card border border-border bg-surface px-4 py-3 shadow-lg">
                <p className="flex items-center gap-1.5 text-xs font-medium text-accent">
                  <Sparkle size={14} weight="fill" />
                  Insight AI: proteinmu udah cukup hari ini
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features — asymmetric, not equal 3-column */}
        <section id="fitur" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16 md:px-8 md:py-24">
          <h2 className="max-w-md text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Semua yang perlu dilihat sebelum makan berikutnya.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-card bg-accent-soft p-8 md:col-span-2 md:row-span-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Camera size={22} weight="bold" />
              </span>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Scan, bukan tebak-tebakan</h3>
              <p className="mt-2 max-w-md text-sm text-muted">
                Ambil foto lewat kamera atau upload dari galeri. Kalau sistem kurang yakin,
                kamu dikasih 2–3 alternatif buat pilih sendiri — bukan langsung nebak dan
                salah.
              </p>
            </div>

            <div className="rounded-card border border-border p-6 transition hover:border-accent/40 hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                <ClockCounterClockwise size={20} weight="bold" />
              </span>
              <h3 className="mt-3 font-semibold text-foreground">Riwayat harian</h3>
              <p className="mt-1 text-sm text-muted">
                Semua yang kamu makan tercatat otomatis, bisa difilter per tanggal.
              </p>
            </div>

            <div className="rounded-card border border-border p-6 transition hover:border-accent/40 hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                <ChartBar size={20} weight="bold" />
              </span>
              <h3 className="mt-3 font-semibold text-foreground">Dashboard mingguan</h3>
              <p className="mt-1 text-sm text-muted">
                Grafik kalori 7 hari vs target, jadi keliatan tren-nya, bukan cuma angka
                harian.
              </p>
            </div>
          </div>
        </section>

        {/* AI insight callout */}
        <section className="mx-auto w-full max-w-6xl px-5 py-4 md:px-8">
          <div className="grid gap-8 rounded-card border border-accent-soft bg-accent-soft/40 p-8 shadow-sm md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Sparkle size={20} weight="fill" />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">Insight harian dari AI, bukan cuma grafik</h3>
                  <p className="mt-1 max-w-lg text-sm text-muted">
                    Dashboard-mu dibaca ulang tiap hari — kalau protein kurang tiga hari
                    berturut-turut atau kalori kamu sering lewat target sore hari, kamu
                    dikasih tahu, bukan cuma dikasih angka.
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="mt-5 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 active:scale-[0.98]"
              >
                Coba Dashboard
              </Link>
            </div>

            {/* Mini chart mockup mirrors the real CalorieBarChart */}
            <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
              <p className="text-xs font-medium text-muted">Kalori per Hari</p>
              <div className="mt-4 flex h-20 items-end justify-between gap-2">
                {[45, 65, 40, 80, 55, 70, 90].map((h, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-t ${i === 6 ? "bg-warning" : "bg-accent"}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-accent">
                <Sparkle size={12} weight="fill" />
                &quot;Protein rata-rata cuma 38g/hari — coba tambah telur atau tahu.&quot;
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="cara-kerja" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16 md:px-8 md:py-24">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Dari foto sampai ke log, empat langkah.
          </h2>

          <ol className="mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative">
                <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-sm font-semibold text-background md:mb-4">
                    {index + 1}
                  </span>
                  <div className="md:mt-0">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted md:pl-0">{step.description}</p>
                {index < STEPS.length - 1 && (
                  <span
                    className="absolute left-4 top-9 hidden h-px w-full bg-border md:block"
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* CTA band */}
        <section className="relative overflow-hidden border-t border-border bg-surface-elevated">
          <div
            className="pointer-events-none absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-accent-soft opacity-50 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Makan siang berikutnya, foto dulu sebelum sendok pertama.
              </h2>
              <p className="mt-2 text-sm text-muted">
                Gratis dicoba, gak perlu kartu kredit, gak perlu akun buat mulai.
              </p>
            </div>
            <Link
              href="/scan"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-105 active:scale-[0.98]"
            >
              Coba Scan Gratis
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 text-sm text-muted md:flex-row md:items-center md:px-8">
          <div className="flex items-center gap-2">
            <ForkKnife size={16} />
            <span>NutriScan AI — project portofolio, bukan aplikasi medis.</span>
          </div>
          <a
            href="https://github.com/Fadhh12/NutriScan-AI"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground hover:text-accent"
          >
            Lihat di GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
