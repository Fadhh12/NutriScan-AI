export type ScanStatus = "pending" | "confirmed" | "rejected";

export interface Scan {
  id: string;
  user_id: string | null;
  image_url: string;
  detected_food_name: string | null;
  confidence_score: number | null;
  portion_estimate_g: number | null;
  status: ScanStatus;
  created_at: string;
}

export interface ScanNutrition {
  id: string;
  scan_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
}

export interface ScanCandidate {
  name: string;
  confidence: number;
  portionEstimateG: number;
  nutrition: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sugarG: number;
  };
}

export interface ScanResponse {
  scan: Scan;
  nutrition: ScanNutrition;
  lowConfidence: boolean;
  candidates?: ScanCandidate[];
}

export interface ConfirmScanResponse {
  scan: Scan;
  nutrition: ScanNutrition | null;
}
