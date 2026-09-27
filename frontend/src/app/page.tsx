import Link from "next/link";
import { Icon } from "@/components/studio/StudioShell";
import { STUDIO_NAV_LINKS } from "@/lib/studioNav";

const MODULES = [
  {
    href: "/scanner",
    icon: "center_focus_strong",
    color: "rose" as const,
    title: "AI Camera & Vision Studio",
    description: "Foto, barcode, atau cari manual — semua jalan deteksi makanan ada di sini.",
  },
  {
    href: "/calorie-tracker",
    icon: "donut_large",
    color: "emerald" as const,
    title: "Calorie Tracker",
    description: "Kalori hari ini, target harian, dan riwayat makan yang baru di-log.",
  },
  {
    href: "/custom-plan",
    icon: "tune",
    color: "blue" as const,
    title: "Custom Plan",
    description: "Rekomendasi kalori & makro yang disesuaikan sama gaya hidupmu.",
  },
  {
    href: "/analytics",
    icon: "bar_chart",
    color: "rose" as const,
    title: "Dashboard & Analytics",
    description: "Tren berat badan dan distribusi makro 7 hari terakhir.",
  },
  {
    href: "/activity",
    icon: "fitness_center",
    color: "emerald" as const,
    title: "Activity Tracker",
    description: "Kalori terbakar dari aktivitas harian, tersinkron otomatis.",
  },
];

const COLOR_CLASSES = {
  rose: { badge: "border-rose-100 bg-rose-50 text-rose-600", ring: "hover:border-rose-200" },
  emerald: { badge: "border-emerald-100 bg-emerald-50 text-emerald-600", ring: "hover:border-emerald-200" },
  blue: { badge: "border-blue-100 bg-blue-50 text-blue-600", ring: "hover:border-blue-200" },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body-md text-[#0F172A] antialiased selection:bg-rose-100 selection:text-rose-900">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-gutter px-4 sm:px-8 md:h-20">
          <Link className="group flex items-center gap-space-sm" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 transition-all group-hover:bg-rose-100/60 md:h-10 md:w-10">
              <Icon name="view_in_ar" className="text-[20px] text-rose-600 md:text-[24px]" />
            </div>
            <span className="font-headline-sm text-headline-sm tracking-tight text-slate-900">
              NutriScan<span className="text-rose-600">AI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {STUDIO_NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:px-4">
              Masuk
            </Link>
            <Link
              href="/scanner"
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.98] sm:px-5"
            >
              Coba Scan Gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose-100/60 opacity-60 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-emerald-100/60 opacity-40 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-2 md:items-center md:gap-16 md:py-24">
            <div>
              <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                <Icon name="auto_awesome" className="text-[14px]" />
                Kalori & gizi, dibaca dari foto
              </span>
              <h1 className="mt-4 animate-fade-up font-headline-xl-mobile text-headline-xl-mobile text-slate-900 [animation-delay:40ms] md:font-headline-xl md:text-headline-xl">
                Foto makananmu. Kalorinya kelihatan sendiri.
              </h1>
              <p className="mt-5 max-w-md animate-fade-up font-body-lg text-body-lg text-slate-500 [animation-delay:100ms]">
                NutriScan AI membaca foto, barcode, atau pilihan manual makananmu dan langsung menghitung
                estimasi kalori serta gizinya — tanpa cari manual di internet.
              </p>
              <div className="mt-8 flex flex-wrap animate-fade-up items-center gap-3 [animation-delay:200ms]">
                <Link
                  href="/scanner"
                  className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.98]"
                >
                  Coba Scan Gratis
                  <Icon name="arrow_forward" className="text-[16px]" />
                </Link>
                <Link href="/login" className="rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                  Buat akun
                </Link>
              </div>
              <div className="mt-6 flex animate-fade-up flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 [animation-delay:260ms]">
                <span className="flex items-center gap-1.5">
                  <Icon name="check_circle" className="text-[14px] text-rose-600" />
                  Gratis dicoba
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="check_circle" className="text-[14px] text-rose-600" />
                  Gak perlu akun buat mulai
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="check_circle" className="text-[14px] text-rose-600" />
                  Scan, barcode, atau cari manual
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm animate-fade-up [animation-delay:150ms] md:mx-0 md:justify-self-end">
              <div className="rotate-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_rgba(15,23,42,0.12)]">
                <p className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">Terdeteksi</p>
                <h2 className="mt-1 font-headline-md text-headline-md font-bold tracking-tight text-slate-900">Sate Ayam</h2>
                <p className="mt-1 font-body-sm text-body-sm text-slate-500">Estimasi porsi 130g · Keyakinan 94%</p>
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">Kalori</p>
                  <p className="mt-1 font-metric-display text-metric-display font-bold tracking-tight text-slate-900">
                    292 <span className="font-body-md text-base font-normal text-slate-500">kkal</span>
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 -rotate-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-lg">
                <p className="flex items-center gap-1.5 font-label-sm text-xs font-semibold text-rose-600">
                  <Icon name="auto_awesome" className="text-[14px]" />
                  Insight AI: proteinmu udah cukup hari ini
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Modules */}
        <section id="fitur" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-8 md:py-24">
          <h2 className="max-w-md font-headline-lg-mobile text-headline-lg-mobile text-slate-900 md:font-headline-lg md:text-headline-lg">
            Lima modul, satu aplikasi.
          </h2>
          <p className="mt-2 max-w-lg font-body-md text-body-md text-slate-500">
            Tiap modul punya halamannya sendiri — klik buat masuk langsung ke fiturnya.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((mod) => {
              const c = COLOR_CLASSES[mod.color];
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className={`group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md ${c.ring}`}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${c.badge}`}>
                    <Icon name={mod.icon} className="text-[22px]" />
                  </span>
                  <h3 className="font-title-lg text-title-lg font-bold text-slate-900">{mod.title}</h3>
                  <p className="font-body-sm text-body-sm text-slate-500">{mod.description}</p>
                  <span className="mt-auto flex items-center gap-1 pt-2 text-xs font-semibold text-slate-700 transition group-hover:gap-2 group-hover:text-rose-600">
                    Buka <Icon name="arrow_forward" className="text-[14px]" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* CTA band */}
        <section className="relative overflow-hidden border-t border-slate-200 bg-white">
          <div className="pointer-events-none absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-rose-100/50 opacity-50 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 md:font-headline-lg md:text-headline-lg">
                Makan siang berikutnya, foto dulu sebelum sendok pertama.
              </h2>
              <p className="mt-2 font-body-sm text-body-sm text-slate-500">Gratis dicoba, gak perlu kartu kredit, gak perlu akun buat mulai.</p>
            </div>
            <Link
              href="/scanner"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.98]"
            >
              Coba Scan Gratis
              <Icon name="arrow_forward" className="text-[16px]" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Icon name="restaurant" className="text-[16px]" />
            <span>NutriScan AI — project portofolio, bukan aplikasi medis.</span>
          </div>
          <a href="https://github.com/Fadhh12/NutriScan-AI" target="_blank" rel="noreferrer" className="font-medium text-slate-900 hover:text-rose-600">
            Lihat di GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
