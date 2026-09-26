"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navItems";

/** Desktop-only top nav; BottomNav covers the same routes on mobile. */
export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 hidden border-b border-border bg-surface/80 backdrop-blur-md md:block">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-8 py-4">
        <Link href="/app" className="text-sm font-semibold tracking-tight text-foreground">
          NutriScan <span className="text-accent">AI</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-elevated hover:text-foreground"
                }`}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
