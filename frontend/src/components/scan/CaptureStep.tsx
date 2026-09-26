"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Image as ImageIcon, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface CaptureStepProps {
  onSubmit: (file: File) => void;
}

export function CaptureStep({ onSubmit }: CaptureStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handleFile(selected: File | undefined) {
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pb-10 pt-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Scan Makanan</h1>
        <p className="mt-1 text-sm text-muted">Foto makanan atau minumanmu untuk lihat kalori & gizinya.</p>
      </header>

      <Card className="flex flex-1 items-center justify-center overflow-hidden p-0">
        {previewUrl ? (
          <div className="relative aspect-square w-full">
            <Image src={previewUrl} alt="Preview foto makanan" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 text-muted">
            <ImageIcon size={40} />
            <p className="text-sm">Belum ada foto dipilih</p>
          </div>
        )}
      </Card>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" icon={<Camera size={18} />} onClick={() => cameraInputRef.current?.click()}>
          Kamera
        </Button>
        <Button variant="secondary" icon={<ImageIcon size={18} />} onClick={() => galleryInputRef.current?.click()}>
          Galeri
        </Button>
      </div>

      <Button
        fullWidth
        disabled={!file}
        icon={<ArrowRight size={18} weight="bold" />}
        onClick={() => file && onSubmit(file)}
      >
        Scan Sekarang
      </Button>
    </div>
  );
}
