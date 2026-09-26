import Image from "next/image";
import { Card } from "@/components/ui/Card";

interface LoadingStepProps {
  previewUrl: string;
}

export function LoadingStep({ previewUrl }: LoadingStepProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pb-10 pt-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Menganalisis foto...</h1>
        <p className="mt-1 text-sm text-muted">Biasanya butuh beberapa detik.</p>
      </header>

      <Card className="relative flex-1 overflow-hidden p-0">
        <div className="relative aspect-square w-full">
          <Image src={previewUrl} alt="Foto sedang dianalisis" fill className="object-cover opacity-60" unoptimized />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-accent-soft border-t-accent" />
        </div>
      </Card>
    </div>
  );
}
