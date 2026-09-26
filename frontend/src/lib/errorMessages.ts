import { ApiError } from "./api";

export type ErrorAction = "retry" | "reselect";

interface ErrorPresentation {
  message: string;
  actionLabel: string;
  action: ErrorAction;
}

const BY_CODE: Record<string, ErrorPresentation> = {
  PHOTO_REQUIRED: { message: "Pilih foto dulu ya.", actionLabel: "Pilih Foto", action: "reselect" },
  INVALID_FILE_TYPE: {
    message: "Format foto harus JPG, PNG, atau WEBP.",
    actionLabel: "Pilih Foto Lain",
    action: "reselect",
  },
  LIMIT_FILE_SIZE: {
    message: "Ukuran foto maksimal 8MB.",
    actionLabel: "Pilih Foto Lain",
    action: "reselect",
  },
  IMAGE_RESOLUTION_TOO_LOW: {
    message: "Resolusi foto terlalu kecil, minimal 300x300px.",
    actionLabel: "Pilih Foto Lain",
    action: "reselect",
  },
  NOT_FOOD: {
    message: "Tidak terdeteksi makanan, coba foto ulang.",
    actionLabel: "Foto Ulang",
    action: "reselect",
  },
  PROVIDER_TIMEOUT: {
    message: "Server sedang lama merespons, coba lagi.",
    actionLabel: "Coba Lagi",
    action: "retry",
  },
  STORAGE_UPLOAD_FAILED: {
    message: "Layanan sedang penuh, coba beberapa saat lagi.",
    actionLabel: "Coba Lagi",
    action: "retry",
  },
};

const DEFAULT: ErrorPresentation = {
  message: "Layanan sedang penuh, coba beberapa saat lagi.",
  actionLabel: "Coba Lagi",
  action: "retry",
};

export function presentError(error: unknown): ErrorPresentation {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return { message: "Tunggu sebentar sebelum scan lagi.", actionLabel: "Coba Lagi", action: "retry" };
    }
    if (error.code && BY_CODE[error.code]) {
      return BY_CODE[error.code];
    }
  }
  return DEFAULT;
}
