"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ClockCounterClockwise, ChartBar, UserCircle } from "@phosphor-icons/react";

const ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/history", label: "Riwayat", icon: ClockCounterClockwise },
  { href: "/dashboard", label: "Dashboard", icon: ChartBar },
  { href: "/profile", label: "Profil", icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-md items-center justify-between border-t border-border bg-surface px-6 py-2">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-2 py-1.5 text-xs font-medium ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <Icon size={22} weight={active ? "fill" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
