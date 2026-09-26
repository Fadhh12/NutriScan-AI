import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Scan, ScanNutrition } from "@/lib/types";

interface ConfirmedStepProps {
  scan: Scan;
  nutrition: ScanNutrition | null;
  onScanAgain: () => void;
}

export function ConfirmedStep({ scan, nutrition, onScanAgain }: ConfirmedStepProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5 pb-10 pt-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
        <CheckCircle size={36} weight="fill" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tersimpan!</h1>
        <p className="mt-1 text-sm text-muted">{scan.detected_food_name} sudah masuk ke log kamu.</p>
      </div>

      {nutrition && (
        <Card className="w-full p-5">
          <p className="font-mono text-2xl font-semibold tabular-nums">{nutrition.calories.toFixed(0)} kkal</p>
        </Card>
      )}

      <div className="mt-4 flex w-full flex-col gap-3">
        <Button fullWidth onClick={onScanAgain}>
          Scan Lagi
        </Button>
        <Link href="/">
          <Button fullWidth variant="secondary">
            Kembali ke Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
