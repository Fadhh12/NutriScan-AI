import Image from "next/image";
import { CheckCircle, ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MacroBreakdown } from "@/components/nutrition/MacroBreakdown";
import type { Scan, ScanNutrition } from "@/lib/types";

interface ResultStepProps {
  previewUrl: string;
  scan: Scan;
  nutrition: ScanNutrition;
  onConfirm: () => void;
  onCorrect: () => void;
  isSubmitting: boolean;
}

export function ResultStep({ previewUrl, scan, nutrition, onConfirm, onCorrect, isSubmitting }: ResultStepProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pb-10 pt-8">
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[4/3] w-full">
          <Image src={previewUrl} alt={scan.detected_food_name ?? "Foto makanan"} fill className="object-cover" unoptimized />
        </div>
        <div className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Terdeteksi</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{scan.detected_food_name}</h1>
          <p className="mt-1 text-sm text-muted">
            Estimasi porsi {scan.portion_estimate_g?.toFixed(0)}g
            {scan.confidence_score !== null && ` · Keyakinan ${Math.round(scan.confidence_score * 100)}%`}
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Kalori</p>
        <p className="mt-1 font-mono text-4xl font-semibold tabular-nums">
          {nutrition.calories.toFixed(0)} <span className="text-lg font-normal text-muted">kkal</span>
        </p>
        <div className="mt-5">
          <MacroBreakdown
            proteinG={nutrition.protein_g}
            carbsG={nutrition.carbs_g}
            fatG={nutrition.fat_g}
            fiberG={nutrition.fiber_g}
          />
        </div>
      </Card>

      <div className="mt-auto flex flex-col gap-3">
        <Button fullWidth icon={<CheckCircle size={18} weight="bold" />} onClick={onConfirm} disabled={isSubmitting}>
          Ini benar
        </Button>
        <Button
          fullWidth
          variant="secondary"
          icon={<ArrowCounterClockwise size={18} />}
          onClick={onCorrect}
          disabled={isSubmitting}
        >
          Bukan ini, pilih lain
        </Button>
      </div>
    </div>
  );
}
