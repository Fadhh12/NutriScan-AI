import Link from "next/link";
import { Camera, ForkKnife } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { CalorieRing } from "@/components/nutrition/CalorieRing";

const DAILY_CALORIE_TARGET = 2000;

export default function HomePage() {
  const consumedToday = 0;

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pb-10 pt-8">
      <header>
        <p className="text-sm text-muted">Halo,</p>
        <h1 className="text-2xl font-semibold tracking-tight">Mau makan apa hari ini?</h1>
      </header>

      <Card className="p-6">
        <p className="mb-4 text-sm font-medium text-muted">Ringkasan Kalori Hari Ini</p>
        <CalorieRing consumed={consumedToday} target={DAILY_CALORIE_TARGET} />
      </Card>

      <Link
        href="/scan"
        className="group flex items-center justify-between rounded-card border border-border bg-accent px-6 py-5 text-accent-foreground transition active:scale-[0.98]"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">Mulai</p>
          <p className="text-lg font-semibold">Scan Makanan</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
          <Camera size={24} weight="bold" />
        </span>
      </Link>

      <Card className="flex items-center gap-3 p-4 text-sm text-muted">
        <ForkKnife size={18} className="shrink-0 text-accent" />
        <p>Belum ada makanan yang di-log hari ini. Scan foto makananmu untuk mulai tracking.</p>
      </Card>
    </main>
  );
}
