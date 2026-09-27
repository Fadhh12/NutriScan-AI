"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export const STUDIO_NAV_LINKS = [
  { label: "AI Scanner", href: "/scanner" },
  { label: "Calorie Tracker", href: "/calorie-tracker" },
  { label: "Custom Plan", href: "/custom-plan" },
  { label: "Dashboard & Analytics", href: "/analytics" },
  { label: "Activity Tracker", href: "/activity" },
];

export function ModuleBadge({
  moduleLabel,
  description,
  color = "rose",
}: {
  moduleLabel: string;
  description: string;
  color?: "rose" | "emerald" | "blue";
}) {
  const colorClasses = {
    rose: "border-rose-200/70 bg-rose-50 text-rose-700",
    emerald: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200/70 bg-blue-50 text-blue-700",
  }[color];
  return (
    <div className="mb-space-xs flex flex-wrap items-center gap-space-sm">
      <span className={`rounded-full border px-2.5 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-wider ${colorClasses}`}>
        {moduleLabel}
      </span>
      <span className="font-label-sm text-label-sm text-slate-500">{description}</span>
    </div>
  );
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { token } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body-md text-[#0F172A] antialiased selection:bg-rose-100 selection:text-rose-900">
      <header className="fixed top-0 left-0 z-50 w-full border-b border-slate-200/80 bg-white/90 shadow-[0_1px_6px_rgba(15,23,42,0.04)] backdrop-blur-xl">
        <div className="flex h-16 w-full items-center justify-between gap-gutter px-4 sm:px-margin md:h-20">
          <div className="flex items-center gap-space-lg">
            <Link className="group flex items-center gap-space-sm" href="/">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 transition-all group-hover:bg-rose-100/60 md:h-10 md:w-10">
                <Icon name="view_in_ar" className="text-[20px] text-rose-600 md:text-[24px]" />
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="flex items-center gap-space-xs font-headline-sm text-headline-sm tracking-tight text-slate-900">
                  NutriScan<span className="text-rose-600">AI</span>
                </span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-slate-500">
                  Metabolic Vision
                </span>
              </div>
            </Link>
            <nav className="hidden items-center gap-space-xs rounded-xl border border-slate-200/60 bg-slate-100/80 p-1 xl:flex">
              {STUDIO_NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
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
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-space-sm md:gap-space-md">
            <div className="hidden items-center gap-space-md rounded-xl border border-slate-200/70 bg-slate-100/80 px-3.5 py-1.5 lg:flex">
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
              className="hidden items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-700 hover:shadow-md sm:inline-flex md:px-5 md:py-2.5 md:text-sm"
            >
              {token ? "Buka Dashboard" : "Get Started Free"}
            </Link>
            <Link
              href={token ? "/profile" : "/login"}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition-transform hover:scale-105 sm:flex"
            >
              <Icon name="person" className="text-[18px]" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 xl:hidden"
              aria-label="Menu"
              aria-expanded={mobileNavOpen}
            >
              <Icon name={mobileNavOpen ? "close" : "menu"} className="text-[20px]" />
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <nav className="animate-fade-up flex flex-col gap-1 border-t border-slate-200/80 bg-white p-3 xl:hidden">
            {STUDIO_NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    isActive ? "bg-slate-900 font-semibold text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href={token ? "/profile" : "/login"}
              onClick={() => setMobileNavOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:hidden"
            >
              {token ? "Profil" : "Masuk"}
            </Link>
          </nav>
        )}
      </header>

      <main className="min-h-[calc(100vh-140px)] w-full bg-[#F8FAFC] pt-16 md:pt-20">
        <div className="flex w-full flex-col">
          <div className="flex w-full flex-wrap items-center gap-space-sm border-b border-slate-200/80 bg-white px-4 py-3 sm:px-margin sm:py-3.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 font-label-md text-label-md font-semibold text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Neural Engine v4.8 Active
            </span>
            <span className="hidden font-body-sm text-body-sm text-slate-500 md:inline">
              Instant Food Recognition (99.4% accuracy) · Spatial Caloric Projection
            </span>
          </div>

          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-space-xl px-4 py-space-lg sm:px-margin sm:py-space-xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
