import { PredictionResult } from "../types";

const FIREBASE_DB_URL = "https://mrwan-dd795-default-rtdb.firebaseio.com";

// Fetches prediction data from Firebase RTDB at m11.json
export const fetchPredictionsFromFirebase = async (): Promise<boolean[][] | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let res = await fetch(`${FIREBASE_DB_URL}/m11.json`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    let data = await res.json();
    
    // Auto-seed if the database returns empty/null
    if (!data) {
      console.log("Database at m11 path is empty. Seeding auto-generated predictions...");
      const seeded = await uploadPredictionsToFirebase();
      if (seeded) {
        const freshRes = await fetch(`${FIREBASE_DB_URL}/m11.json`);
        if (freshRes.ok) {
          data = await freshRes.json();
        }
      }
    }
    
    if (!data) return null;
    
    // Create a 10x5 grid initialized to false (rotten)
    const grid: boolean[][] = Array(10).fill(null).map(() => Array(5).fill(false));
    for (let f = 1; f <= 50; f++) {
      const p = `m${f}`;
      const item = data[p];
      if (item !== undefined) {
        const val = typeof item === "object" && item[p] !== undefined ? item[p] : item;
        if (val !== undefined) {
          // "1" is safe, "0" is rotten
          const isSafe = String(val) === "1";
          const index = f - 1;
          const r = Math.floor(index / 5);
          const c = index % 5;
          if (r < 10 && c < 5) {
            grid[r][c] = isSafe;
          }
        }
      }
    }
    return grid;
  } catch (err) {
    console.error("Apple Grid Fetch Error:", err);
    return null;
  }
};

// Generates and uploads new predictions to Firebase under the main path m11
export const uploadPredictionsToFirebase = async (): Promise<boolean> => {
  try {
    const finalObject: Record<string, any> = {};

    for (let r = 0; r < 10; r++) {
      // Determine safeCount based on row index
      let safeCount = 4;
      if (r >= 4 && r < 7) safeCount = 3;      // Rows 4, 5, 6
      if (r >= 7 && r < 9) safeCount = 2;      // Rows 7, 8
      if (r >= 9) safeCount = 1;               // Last row (9)

      const safeCols: number[] = [];
      while (safeCols.length < safeCount) {
        const randomCol = Math.floor(Math.random() * 5);
        if (!safeCols.includes(randomCol)) {
          safeCols.push(randomCol);
        }
      }

      for (let c = 0; c < 5; c++) {
        const mIndex = r * 5 + c + 1;
        const value = safeCols.includes(c) ? "1" : "0";
        finalObject[`m${mIndex}`] = value;
      }
    }

    const res = await fetch(`${FIREBASE_DB_URL}/m11.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalObject)
    });
    return res.ok;
  } catch (err) {
    console.error("Error uploading Apple Grid Data:", err);
    return false;
  }
};

// Generates prediction result (path, confidence, analysis)
export const generatePredictionsLocal = async (rowCount: number): Promise<PredictionResult> => {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const path: number[] = [];
  let prevCol = 2;
  for (let r = 0; r < rowCount; r++) {
    const rand = Math.random();
    let col: number;
    if (rand > 0.7) {
      col = Math.floor(Math.random() * 5);
    } else {
      const step = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      col = Math.max(0, Math.min(4, prevCol + step));
    }
    path.push(col);
    prevCol = col;
  }
  const confidence = Math.floor(Math.random() * 17) + 82;
  const analyses = [
    "Pattern recognition sequence complete. Central corridor favored.",
    "Deviations detected in lateral rows. Zig-zag pattern highly probable.",
    "Grid density analysis suggests low trap probability in selected path.",
    "RNG seed oscillation detected. Safety path calculated with 92% variance.",
    "Vertical trendline established. Left-side bias detected in upper rows."
  ];
  const analysis = analyses[Math.floor(Math.random() * analyses.length)];
  return {
    path,
    confidence,
    analysis,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };
};
