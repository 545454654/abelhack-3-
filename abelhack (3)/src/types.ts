export type Language = "en" | "ar";

export type Platform = "GREENBET";

export type ScreenState = "SELECTION" | "CONDITIONS" | "GAME_SELECTION" | "CRASH" | "APPLE";

export interface AccessKeyData {
  key: string;
  isActive: boolean;
  type: "SESSION" | "VERIFIED";
  createdAt: number;
  isAdminMode: boolean;
}

export interface PredictionResult {
  path: number[];
  confidence: number;
  analysis: string;
  id: string;
  timestamp: number;
  gridData?: boolean[][];
}
