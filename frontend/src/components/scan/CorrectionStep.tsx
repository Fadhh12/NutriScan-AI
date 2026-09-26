"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ScanCandidate } from "@/lib/types";

interface CorrectionStepProps {
  candidates?: ScanCandidate[];
  onSelectCandidate: (candidate: ScanCandidate) => void;
  onManualSubmit: (foodName: string, portionEstimateG: number) => void;
  isSubmitting: boolean;
}

export function CorrectionStep({
  candidates,
  onSelectCandidate,
  onManualSubmit,
  isSubmitting,
}: CorrectionStepProps) {
  const [manualName, setManualName] = useState("");
  const [manualPortion, setManualPortion] = useState("150");

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-10 pt-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pilih yang benar</h1>
        <p className="mt-1 text-sm text-muted">Kami kurang yakin, tolong pilih makanan yang sesuai.</p>
      </header>

      {candidates && candidates.length > 0 && (
        <div className="flex flex-col gap-3">
          {candidates.map((candidate) => (
            <button
              key={candidate.name}
              type="button"
              disabled={isSubmitting}
              onClick={() => onSelectCandidate(candidate)}
              className="text-left disabled:opacity-50"
            >
              <Card className="flex items-center justify-between p-4 transition hover:border-accent">
                <div>
                  <p className="font-medium text-foreground">{candidate.name}</p>
                  <p className="text-xs text-muted">
                    {candidate.nutrition.calories.toFixed(0)} kkal · {candidate.portionEstimateG.toFixed(0)}g
                  </p>
                </div>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 font-mono text-xs font-medium text-accent">
                  {Math.round(candidate.confidence * 100)}%
                </span>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Card className="p-4">
        <p className="mb-3 text-sm font-medium text-muted">Tidak ada yang cocok? Cari manual</p>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted" htmlFor="manual-food-name">
            Nama makanan
          </label>
          <input
            id="manual-food-name"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Contoh: Nasi Goreng"
            className="rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <label className="text-xs font-medium text-muted" htmlFor="manual-portion">
            Estimasi porsi (gram)
          </label>
          <input
            id="manual-portion"
            type="number"
            min={1}
            value={manualPortion}
            onChange={(e) => setManualPortion(e.target.value)}
            className="rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <Button
          fullWidth
          className="mt-4"
          icon={<MagnifyingGlass size={18} />}
          disabled={!manualName.trim() || isSubmitting}
          onClick={() => onManualSubmit(manualName.trim(), Number(manualPortion) || 100)}
        >
          Pakai Nama Ini
        </Button>
      </Card>
    </div>
  );
}
