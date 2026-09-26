"use client";

import { useState } from "react";
import { confirmScan, submitScan } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { presentError } from "@/lib/errorMessages";
import type { ConfirmScanResponse, ScanCandidate, ScanResponse } from "@/lib/types";
import { CaptureStep } from "@/components/scan/CaptureStep";
import { LoadingStep } from "@/components/scan/LoadingStep";
import { ResultStep } from "@/components/scan/ResultStep";
import { CorrectionStep } from "@/components/scan/CorrectionStep";
import { ConfirmedStep } from "@/components/scan/ConfirmedStep";
import { ErrorStep } from "@/components/scan/ErrorStep";

type Step = "capture" | "loading" | "result" | "correction" | "confirmed" | "error";

export default function ScanPage() {
  const { token } = useAuth();
  const [step, setStep] = useState<Step>("capture");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmScanResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ message: string; actionLabel: string; action: "retry" | "reselect" } | null>(
    null,
  );

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setConfirmed(null);
    setStep("capture");
  }

  async function runScan(selectedFile: File) {
    setStep("loading");
    try {
      const result = await submitScan(selectedFile, token);
      setScanResult(result);
      setStep(result.lowConfidence ? "correction" : "result");
    } catch (err) {
      setErrorInfo(presentError(err));
      setStep("error");
    }
  }

  function handleCapture(selectedFile: File) {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    void runScan(selectedFile);
  }

  async function handleConfirm() {
    if (!scanResult) return;
    setIsSubmitting(true);
    try {
      const result = await confirmScan(scanResult.scan.id, { confirmed: true }, token);
      setConfirmed(result);
      setStep("confirmed");
    } catch (err) {
      setErrorInfo(presentError(err));
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelectCandidate(candidate: ScanCandidate) {
    if (!scanResult) return;
    setIsSubmitting(true);
    try {
      const result = await confirmScan(
        scanResult.scan.id,
        { foodName: candidate.name, portionEstimateG: candidate.portionEstimateG },
        token,
      );
      setConfirmed(result);
      setStep("confirmed");
    } catch (err) {
      setErrorInfo(presentError(err));
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleManualSubmit(foodName: string, portionEstimateG: number) {
    if (!scanResult) return;
    setIsSubmitting(true);
    try {
      const result = await confirmScan(scanResult.scan.id, { foodName, portionEstimateG }, token);
      setConfirmed(result);
      setStep("confirmed");
    } catch (err) {
      setErrorInfo(presentError(err));
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleErrorAction() {
    if (errorInfo?.action === "retry" && file) {
      void runScan(file);
      return;
    }
    reset();
  }

  if (step === "capture") {
    return <CaptureStep onSubmit={handleCapture} />;
  }

  if (step === "loading" && previewUrl) {
    return <LoadingStep previewUrl={previewUrl} />;
  }

  if (step === "result" && scanResult && previewUrl) {
    return (
      <ResultStep
        previewUrl={previewUrl}
        scan={scanResult.scan}
        nutrition={scanResult.nutrition}
        onConfirm={handleConfirm}
        onCorrect={() => setStep("correction")}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (step === "correction") {
    return (
      <CorrectionStep
        candidates={scanResult?.candidates}
        onSelectCandidate={handleSelectCandidate}
        onManualSubmit={handleManualSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (step === "confirmed" && confirmed) {
    return <ConfirmedStep scan={confirmed.scan} nutrition={confirmed.nutrition} onScanAgain={reset} />;
  }

  if (step === "error" && errorInfo) {
    return <ErrorStep message={errorInfo.message} actionLabel={errorInfo.actionLabel} onAction={handleErrorAction} />;
  }

  return null;
}
