"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon, ModuleBadge } from "@/components/studio/StudioShell";
import { useAuth } from "@/lib/auth";
import { confirmScan, listFoods, submitManualEntry, submitScan } from "@/lib/api";
import { presentError } from "@/lib/errorMessages";
import type { FoodDatasetEntry, ScanResponse } from "@/lib/types";

const MODE_TABS = [
  { key: "camera", icon: "photo_camera", label: "Scan kamera" },
  { key: "upload", icon: "upload_file", label: "Upload foto" },
  { key: "barcode", icon: "barcode_scanner", label: "Barcode" },
  { key: "table", icon: "table_restaurant", label: "Cari makanan" },
] as const;

type ModeKey = (typeof MODE_TABS)[number]["key"];

interface DetectedEntry {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: number | null;
  confidence: number | null;
}

function scale(per100g: number, grams: number) {
  return (per100g * grams) / 100;
}

const mediaDevicesSupported = () =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

export default function ScannerPage() {
  const { token } = useAuth();
  const [mode, setMode] = useState<ModeKey>("camera");

  // --- Shared photo pipeline (camera capture + gallery upload both feed this) ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [qty, setQty] = useState(1);

  // --- Live camera capture ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraSupported = useSyncExternalStore(
    () => () => {},
    () => mediaDevicesSupported(),
    () => false,
  );

  // --- Barcode reader (real Open Food Facts lookup) ---
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<{ name: string; caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number } | null>(null);
  const [barcodePortion, setBarcodePortion] = useState(100);
  const [isBarcodeScanning, setIsBarcodeScanning] = useState(false);
  const barcodeVideoRef = useRef<HTMLVideoElement>(null);
  const barcodeStreamRef = useRef<MediaStream | null>(null);

  // --- Food table recognition (local dataset search + real log) ---
  const [foodQuery, setFoodQuery] = useState("");
  const [foods, setFoods] = useState<FoodDatasetEntry[]>([]);
  const [isLoadingFoods, setIsLoadingFoods] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodDatasetEntry | null>(null);
  const [tablePortion, setTablePortion] = useState(100);

  useEffect(() => {
    if (mode !== "table") return;
    const timer = setTimeout(() => {
      setIsLoadingFoods(true);
      listFoods(foodQuery)
        .then((res) => setFoods(res.foods))
        .catch(() => setFoods([]))
        .finally(() => setIsLoadingFoods(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [mode, foodQuery]);

  // --- Shared confirm/log state ---
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedMsg, setConfirmedMsg] = useState<string | null>(null);

  function stopPhotoCamera() {
    photoStreamRef.current?.getTracks().forEach((t) => t.stop());
    photoStreamRef.current = null;
    setIsCameraActive(false);
  }

  function stopBarcodeCamera() {
    barcodeStreamRef.current?.getTracks().forEach((t) => t.stop());
    barcodeStreamRef.current = null;
    setIsBarcodeScanning(false);
  }

  useEffect(() => {
    return () => {
      stopPhotoCamera();
      stopBarcodeCamera();
    };
  }, []);

  function resetAllResults() {
    setPreviewUrl(null);
    setScanResult(null);
    setScanError(null);
    setQty(1);
    setBarcodeProduct(null);
    setBarcodeError(null);
    setBarcodeInput("");
    setSelectedFood(null);
    setConfirmedMsg(null);
  }

  function selectMode(next: ModeKey) {
    if (mode === "camera") stopPhotoCamera();
    if (mode === "barcode") stopBarcodeCamera();
    setMode(next);
    resetAllResults();
  }

  async function processPhoto(file: File) {
    resetAllResults();
    setPreviewUrl(URL.createObjectURL(file));
    setIsScanning(true);
    try {
      const res = await submitScan(file, token);
      setScanResult(res);
      setQty(1);
    } catch (err) {
      setScanError(presentError(err).message);
    } finally {
      setIsScanning(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void processPhoto(file);
  }

  async function startPhotoCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      photoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      setCameraError("Tidak bisa akses kamera. Cek izin kamera di browser, atau pakai tab Upload Foto.");
      setIsCameraActive(false);
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopPhotoCamera();
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return;
    void processPhoto(new File([blob], "capture.jpg", { type: "image/jpeg" }));
  }

  async function lookupBarcode(code: string) {
    if (!code.trim()) return;
    setBarcodeError(null);
    setBarcodeProduct(null);
    setIsLookingUpBarcode(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code.trim())}.json`);
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        throw new Error("Produk tidak ditemukan di database Open Food Facts.");
      }
      const n = data.product.nutriments ?? {};
      setBarcodeProduct({
        name: data.product.product_name || data.product.generic_name || `Barcode ${code}`,
        caloriesPer100g: n["energy-kcal_100g"] ?? 0,
        proteinPer100g: n["proteins_100g"] ?? 0,
        carbsPer100g: n["carbohydrates_100g"] ?? 0,
        fatPer100g: n["fat_100g"] ?? 0,
      });
      setBarcodePortion(100);
    } catch (err) {
      setBarcodeError(err instanceof Error ? err.message : "Gagal mengambil data produk.");
    } finally {
      setIsLookingUpBarcode(false);
    }
  }

  async function startBarcodeCamera() {
    setBarcodeError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      barcodeStreamRef.current = stream;
      if (barcodeVideoRef.current) {
        barcodeVideoRef.current.srcObject = stream;
        await barcodeVideoRef.current.play();
      }
      setIsBarcodeScanning(true);

      const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
      const detector = new BarcodeDetectorCtor({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });

      const poll = async () => {
        if (!barcodeStreamRef.current || !barcodeVideoRef.current) return;
        try {
          const codes = await detector.detect(barcodeVideoRef.current);
          if (codes.length > 0) {
            stopBarcodeCamera();
            setBarcodeInput(codes[0].rawValue);
            void lookupBarcode(codes[0].rawValue);
            return;
          }
        } catch {
          // detection frame failed, keep polling
        }
        requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
    } catch {
      setBarcodeError("Tidak bisa akses kamera — masukkan barcode manual aja.");
      setIsBarcodeScanning(false);
    }
  }

  async function handleConfirmLog() {
    setIsConfirming(true);
    setScanError(null);
    try {
      if ((mode === "camera" || mode === "upload") && scanResult) {
        await confirmScan(scanResult.scan.id, { confirmed: true }, token);
      } else if (mode === "barcode" && barcodeProduct) {
        await submitManualEntry(
          {
            foodName: barcodeProduct.name,
            portionEstimateG: barcodePortion,
            source: "barcode",
            nutrition: {
              calories: scale(barcodeProduct.caloriesPer100g, barcodePortion),
              proteinG: scale(barcodeProduct.proteinPer100g, barcodePortion),
              carbsG: scale(barcodeProduct.carbsPer100g, barcodePortion),
              fatG: scale(barcodeProduct.fatPer100g, barcodePortion),
            },
          },
          token,
        );
      } else if (mode === "table" && selectedFood) {
        await submitManualEntry(
          { foodName: selectedFood.name, portionEstimateG: tablePortion, source: "table" },
          token,
        );
      } else {
        return;
      }
      setConfirmedMsg("Tersimpan ke log hari ini.");
    } catch (err) {
      setScanError(presentError(err).message);
    } finally {
      setIsConfirming(false);
    }
  }

  const detected: DetectedEntry | null =
    (mode === "camera" || mode === "upload") && scanResult
      ? {
          name: scanResult.scan.detected_food_name ?? "Makanan",
          calories: Math.round(scanResult.nutrition.calories * qty),
          protein: scanResult.nutrition.protein_g * qty,
          carbs: scanResult.nutrition.carbs_g * qty,
          fat: scanResult.nutrition.fat_g * qty,
          portion: scanResult.scan.portion_estimate_g,
          confidence: scanResult.scan.confidence_score,
        }
      : mode === "barcode" && barcodeProduct
        ? {
            name: barcodeProduct.name,
            calories: Math.round(scale(barcodeProduct.caloriesPer100g, barcodePortion)),
            protein: scale(barcodeProduct.proteinPer100g, barcodePortion),
            carbs: scale(barcodeProduct.carbsPer100g, barcodePortion),
            fat: scale(barcodeProduct.fatPer100g, barcodePortion),
            portion: barcodePortion,
            confidence: null,
          }
        : mode === "table" && selectedFood
          ? {
              name: selectedFood.name,
              calories: Math.round(scale(selectedFood.caloriesPer100g, tablePortion)),
              protein: scale(selectedFood.proteinPer100g, tablePortion),
              carbs: scale(selectedFood.carbsPer100g, tablePortion),
              fat: scale(selectedFood.fatPer100g, tablePortion),
              portion: tablePortion,
              confidence: null,
            }
          : null;

  const macroTotal = detected ? detected.protein + detected.carbs + detected.fat || 1 : 1;
  const canLog =
    ((mode === "camera" || mode === "upload") && !!scanResult) ||
    (mode === "barcode" && !!barcodeProduct) ||
    (mode === "table" && !!selectedFood);

  return (
    <>
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div>
          <ModuleBadge moduleLabel="Module 01 // Computer Vision" description="High-Resolution Food Instance Segmentation" color="rose" />
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">
            AI Camera &amp; Nutritional Vision Studio
          </h1>
        </div>
        <div className="scrollbar-none flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {MODE_TABS.map((tab) => {
            const isActive = mode === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => selectMode(tab.key)}
                className={`flex shrink-0 items-center gap-space-xs rounded-lg px-3 py-space-sm text-xs transition-all duration-300 sm:px-space-md sm:text-sm ${
                  isActive ? "bg-slate-900 font-semibold text-white shadow-sm" : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon name={tab.icon} className={`text-[18px] ${isActive ? "text-rose-400" : ""}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
        {/* Left: interactive panel per mode */}
        <div className="group relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 shadow-md sm:min-h-[540px] lg:col-span-7">
          <canvas ref={canvasRef} className="hidden" />

          {(mode === "camera" || mode === "upload") && (
            <div className="animate-fade-up flex flex-1 flex-col">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              {!previewUrl && mode === "upload" && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-1 flex-col items-center justify-center gap-space-md p-space-xl text-center transition-colors hover:bg-slate-800/60"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-slate-600 bg-slate-800">
                    <Icon name="upload_file" className="text-[32px] text-rose-400" />
                  </span>
                  <div>
                    <p className="font-title-lg text-title-lg font-semibold text-white">Upload foto makanan</p>
                    <p className="mt-1 font-body-sm text-body-sm text-slate-400">JPG/PNG · dianalisis oleh AI vision asli</p>
                  </div>
                </button>
              )}

              {!previewUrl && mode === "camera" && (
                <div className="flex flex-1 flex-col">
                  {isCameraActive ? (
                    <div className="relative flex-1">
                      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
                      <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-white/40" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-space-md p-space-lg">
                        <button
                          onClick={stopPhotoCamera}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md"
                        >
                          <Icon name="close" className="text-[20px]" />
                        </button>
                        <button
                          onClick={() => void capturePhoto()}
                          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-rose-600 text-white shadow-lg transition-transform hover:scale-105"
                          aria-label="Ambil foto"
                        >
                          <Icon name="photo_camera" className="text-[26px]" />
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md"
                          aria-label="Upload dari galeri"
                        >
                          <Icon name="image" className="text-[20px]" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-space-md p-space-xl text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-slate-600 bg-slate-800">
                        <Icon name="photo_camera" className="text-[32px] text-rose-400" />
                      </span>
                      <div>
                        <p className="font-title-lg text-title-lg font-semibold text-white">Scan pakai kamera</p>
                        <p className="mt-1 max-w-xs font-body-sm text-body-sm text-slate-400">
                          Arahkan kamera ke makananmu, AI akan deteksi jenis dan estimasi kalorinya otomatis.
                        </p>
                      </div>
                      {cameraSupported ? (
                        <button
                          onClick={() => void startPhotoCamera()}
                          className="flex items-center gap-space-xs rounded-full bg-rose-600 px-space-lg py-space-sm text-xs font-semibold text-white transition-all hover:bg-rose-700"
                        >
                          <Icon name="videocam" className="text-[18px]" />
                          Aktifkan kamera
                        </button>
                      ) : (
                        <p className="font-body-sm text-body-sm text-amber-400">Kamera tidak didukung di browser ini.</p>
                      )}
                      {cameraError && <p className="max-w-xs font-body-sm text-body-sm text-rose-400">{cameraError}</p>}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="font-label-sm text-xs font-semibold text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
                      >
                        atau upload dari galeri
                      </button>
                    </div>
                  )}
                </div>
              )}

              {previewUrl && (
                <div className="relative flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Foto makanan" className="absolute inset-0 h-full w-full object-cover" src={previewUrl} />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/30" />
                  {isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-space-md">
                      <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-rose-400" />
                      <p className="font-label-sm text-xs font-bold uppercase tracking-widest text-white">Menganalisis foto…</p>
                    </div>
                  )}
                  {!isScanning && scanError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-space-md p-space-lg text-center">
                      <Icon name="error" className="text-[32px] text-rose-400" />
                      <p className="max-w-xs font-body-sm text-body-sm text-white">{scanError}</p>
                      <button
                        onClick={() => (mode === "camera" ? void startPhotoCamera() : fileInputRef.current?.click())}
                        className="rounded-full bg-rose-600 px-space-lg py-space-sm text-xs font-semibold text-white transition-all hover:bg-rose-700"
                      >
                        Coba lagi
                      </button>
                    </div>
                  )}
                  {!isScanning && !scanError && scanResult && (
                    <div className="animate-fade-up relative z-10 flex h-full flex-col justify-between p-space-lg">
                      <div className="flex items-center gap-space-sm self-start rounded-full border border-slate-200/60 bg-white/95 px-space-md py-space-xs shadow-md backdrop-blur-md">
                        <Icon name="check_circle" className="text-[18px] text-emerald-600" />
                        <span className="font-label-sm text-[11px] font-bold uppercase tracking-widest text-slate-800">Terdeteksi: {detected?.name}</span>
                      </div>
                      <button
                        onClick={() => (mode === "camera" ? void startPhotoCamera() : fileInputRef.current?.click())}
                        className="flex items-center gap-space-xs self-end rounded-full bg-rose-600 px-space-lg py-space-sm text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-700"
                      >
                        <Icon name="add_a_photo" className="text-[18px]" />
                        {mode === "camera" ? "Scan ulang" : "Upload foto lain"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === "barcode" && (
            <div className="animate-fade-up flex flex-1 flex-col gap-space-md p-space-lg">
              <div className="flex flex-1 flex-col items-center justify-center gap-space-md text-center">
                {isBarcodeScanning ? (
                  <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-700">
                    <video ref={barcodeVideoRef} className="aspect-video w-full object-cover" muted playsInline />
                    <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-rose-500/80" />
                    <button
                      onClick={stopBarcodeCamera}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                    >
                      <Icon name="close" className="text-[18px]" />
                    </button>
                  </div>
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                    <Icon name="barcode_scanner" className="text-[32px] text-rose-400" />
                  </span>
                )}
                {!isBarcodeScanning && (
                  <div>
                    <p className="font-title-lg text-title-lg font-semibold text-white">Barcode reader</p>
                    <p className="mt-1 max-w-xs font-body-sm text-body-sm text-slate-400">
                      Scan barcode kemasan (via kamera) atau ketik nomornya — data diambil dari Open Food Facts.
                    </p>
                  </div>
                )}
                {cameraSupported && !isBarcodeScanning && (
                  <button onClick={() => void startBarcodeCamera()} className="flex items-center gap-space-xs rounded-full bg-rose-600 px-space-lg py-space-sm text-xs font-semibold text-white transition-all hover:bg-rose-700">
                    <Icon name="videocam" className="text-[18px]" />
                    Scan pakai kamera
                  </button>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void lookupBarcode(barcodeInput);
                }}
                className="flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Masukkan nomor barcode…"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLookingUpBarcode || !barcodeInput.trim()}
                  className="flex items-center justify-center gap-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLookingUpBarcode ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Icon name="search" className="text-[18px]" />
                  )}
                  Cari
                </button>
              </form>
              {barcodeError && <p className="font-body-sm text-body-sm text-rose-400">{barcodeError}</p>}
            </div>
          )}

          {mode === "table" && (
            <div className="animate-fade-up flex flex-1 flex-col gap-space-md p-space-lg">
              <div className="relative">
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari makanan (mis. Nasi Goreng, Rendang, Alpukat)…"
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800">
                {isLoadingFoods && <p className="p-space-md font-body-sm text-body-sm text-slate-400">Memuat…</p>}
                {!isLoadingFoods && foods.length === 0 && (
                  <p className="p-space-md font-body-sm text-body-sm text-slate-400">Tidak ada makanan ditemukan.</p>
                )}
                {!isLoadingFoods &&
                  foods.map((food) => (
                    <button
                      key={food.name}
                      onClick={() => {
                        setSelectedFood(food);
                        setTablePortion(100);
                        setConfirmedMsg(null);
                      }}
                      className={`flex w-full items-center justify-between gap-space-sm border-b border-slate-800 px-space-md py-3 text-left transition-all last:border-b-0 hover:bg-slate-800 ${
                        selectedFood?.name === food.name ? "bg-slate-800" : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-body-md text-body-md font-medium text-white">{food.name}</span>
                        <span className="font-label-sm text-[10px] uppercase tracking-wide text-slate-500">{food.category}</span>
                      </span>
                      <span className="shrink-0 font-label-sm text-xs text-slate-400">{food.caloriesPer100g} kcal/100g</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: nutrition breakdown */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md text-slate-900 shadow-sm sm:p-space-xl lg:col-span-5">
          {!detected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-space-sm py-space-xl text-center">
              <Icon name="restaurant" className="text-[32px] text-slate-300" />
              <p className="font-body-sm text-body-sm text-slate-500">
                {mode === "camera" && "Scan atau upload foto makanan buat lihat hasil di sini."}
                {mode === "upload" && "Upload foto makanan buat lihat hasil di sini."}
                {mode === "barcode" && "Scan atau cari barcode buat lihat hasil di sini."}
                {mode === "table" && "Pilih makanan dari daftar buat lihat hasil di sini."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-space-lg">
              <div className="flex items-center justify-between gap-space-sm">
                <div className="min-w-0">
                  <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">Detected Item</span>
                  <h3 className="mt-0.5 truncate font-headline-md text-headline-md font-bold tracking-tight text-slate-900">{detected.name}</h3>
                </div>
                {(mode === "camera" || mode === "upload") && scanResult && (
                  <div className="flex shrink-0 items-center rounded-full border border-slate-200/80 bg-slate-100 p-1">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50">-</button>
                    <span className="px-space-md font-title-md text-title-md font-bold text-slate-900">{qty}</span>
                    <button onClick={() => setQty((q) => q + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50">+</button>
                  </div>
                )}
                {mode === "barcode" && (
                  <div className="flex shrink-0 items-center gap-1">
                    <input type="number" min={1} value={barcodePortion} onChange={(e) => setBarcodePortion(Math.max(1, Number(e.target.value)))} className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm font-bold" />
                    <span className="font-label-sm text-xs text-slate-500">gram</span>
                  </div>
                )}
                {mode === "table" && (
                  <div className="flex shrink-0 items-center gap-1">
                    <input type="number" min={1} value={tablePortion} onChange={(e) => setTablePortion(Math.max(1, Number(e.target.value)))} className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm font-bold" />
                    <span className="font-label-sm text-xs text-slate-500">gram</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-sm text-headline-sm text-rose-500">🔥</span>
                  <span className="font-title-md text-title-md font-semibold text-slate-800">Calories</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-metric-display text-metric-display font-bold tracking-tight text-slate-900 transition-all">{detected.calories}</span>
                  <span className="font-body-sm text-body-sm font-medium text-slate-500">kcal</span>
                </div>
              </div>

              <div className="flex flex-col gap-space-md">
                <MacroBar label="Protein" grams={`${detected.protein.toFixed(0)}g`} pct={(detected.protein / macroTotal) * 100} color="bg-rose-500" />
                <MacroBar label="Carbs" grams={`${detected.carbs.toFixed(0)}g`} pct={(detected.carbs / macroTotal) * 100} color="bg-emerald-500" />
                <MacroBar label="Fat" grams={`${detected.fat.toFixed(0)}g`} pct={(detected.fat / macroTotal) * 100} color="bg-blue-500" />
              </div>

              <div className="animate-fade-up flex flex-col gap-space-sm pt-space-xs">
                <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">Detail</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                    <span className="font-headline-sm text-headline-sm font-bold text-slate-900">{detected.portion ? `${detected.portion.toFixed(0)}g` : "—"}</span>
                    <p className="font-label-sm text-[11px] font-medium text-slate-500">Estimasi porsi</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                    <span className="font-headline-sm text-headline-sm font-bold text-slate-900">{detected.confidence !== null ? `${Math.round(detected.confidence * 100)}%` : "—"}</span>
                    <p className="font-label-sm text-[11px] font-medium text-slate-500">Keyakinan</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-space-sm pt-space-lg">
            <div className="flex items-center gap-space-md">
              <button
                onClick={canLog ? handleConfirmLog : undefined}
                disabled={!canLog || isConfirming || !!confirmedMsg}
                className="flex w-full items-center justify-center gap-space-xs rounded-xl bg-slate-900 px-space-md py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-900"
              >
                <Icon name={confirmedMsg ? "check_circle" : "check"} className="text-[20px] text-emerald-400" />
                {isConfirming ? "Menyimpan…" : confirmedMsg ? "Tersimpan" : "Confirm & Log Meal"}
              </button>
            </div>
            {confirmedMsg && (
              <p className="animate-fade-up flex items-center gap-1 font-label-sm text-xs font-semibold text-emerald-600">
                <Icon name="check_circle" className="text-[14px]" />
                {confirmedMsg}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function MacroBar({ label, grams, pct, color }: { label: string; grams: string; pct: number; color: string }) {
  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex items-center justify-between font-label-md text-label-md">
        <span className="flex items-center gap-space-xs font-semibold text-slate-800">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
        </span>
        <span className="font-bold text-slate-900">{grams}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-200/50 bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
