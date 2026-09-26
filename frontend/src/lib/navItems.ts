import { House, ClockCounterClockwise, ChartBar, UserCircle } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/app", label: "Home", icon: House },
  { href: "/history", label: "Riwayat", icon: ClockCounterClockwise },
  { href: "/dashboard", label: "Dashboard", icon: ChartBar },
  { href: "/profile", label: "Profil", icon: UserCircle },
];
