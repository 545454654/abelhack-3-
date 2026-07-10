import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { Apple, Cpu, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

// Custom icons to ensure gorgeous, reliable rendering of whole and sliced apples
function WholeAppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      {/* Leaf and stem */}
      <path d="M12 2C11.5 3 11 4.5 12 6C13.5 6 15 5.5 16 4C14.5 4 13 4.5 12 2Z" fill="#22c55e" />
      <path d="M12 6C11.8 4.5 12.2 3.5 12.5 3" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" />
      {/* Apple body */}
      <path d="M12 6.5C10.5 6.5 8.5 7.5 7.5 9.5C6.5 11.5 6.5 14.5 7.5 16.5C8.5 18.5 10.5 20.5 12 20.5C13.5 20.5 15.5 18.5 16.5 16.5C17.5 14.5 17.5 11.5 16.5 9.5C15.5 7.5 13.5 6.5 12 6.5Z" />
    </svg>
  );
}

function SlicedAppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      {/* Stem */}
      <path d="M12 6C11.8 4.5 12.2 3.5 12.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Outer skin split left and right */}
      <path d="M11 6.5C9.5 6.5 8.2 7.5 7.5 9.5C6.8 11.5 6.8 14.5 7.5 16.5C8.2 18.5 9.5 20.5 11 20.5C11.5 20.5 11.8 19.5 11.8 18.5C11.8 16 11.5 14 11 11.5C10.5 9 10.8 7.5 11 6.5Z" opacity="0.6" />
      <path d="M13 6.5C14.5 6.5 15.8 7.5 16.5 9.5C17.2 11.5 17.2 14.5 16.5 16.5C15.8 18.5 14.5 20.5 13 20.5C12.5 20.5 12.2 19.5 12.2 18.5C12.2 16 12.5 14 13 11.5C13.5 9 13.2 7.5 13 6.5Z" opacity="0.6" />
      {/* Inner flesh slice in the middle */}
      <path d="M12 7C11.2 7 10.5 8 10 10C9.5 12 9.5 15 10 17C10.5 19 11.2 20 12 20C12.8 20 13.5 19 14 17C14.5 15 14.5 12 14 10C13.5 8 12.8 7 12 7Z" fill="currentColor" opacity="0.25" />
      {/* Two tiny seeds in the core */}
      <circle cx="11.4" cy="12.5" r="0.6" fill="currentColor" opacity="0.8" />
      <circle cx="12.6" cy="12.5" r="0.6" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

interface AppleGridProps {
  path: number[];
  isAnalyzing: boolean;
  predictionId: string;
  rowCount: number;
  difficulty: "Easy" | "Pro";
  revealRotten?: boolean;
  gridData: boolean[][] | null;
  language: Language;
}

const MULTIPLIERS = [
  "1.23", "1.54", "1.93", "2.41", "4.02", "6.71", "11.18", "27.96", "69.91", "349.54", "x500", "x1k", "x2.5k", "x5k", "MAX"
];

const COL_LABELS = ["A", "B", "C", "D", "E"];

export default function AppleGrid({
  path,
  isAnalyzing,
  predictionId,
  rowCount,
  difficulty,
  revealRotten = false,
  gridData,
  language
}: AppleGridProps) {
  const [successFlicker, setSuccessFlicker] = useState(false);

  const isArabic = language === 'ar';

  const localizedText = {
    en: {
      matrixFailureMsg: "Safety threshold exceeded. Probability nodes corrupted. Reset session required.",
      retrySync: "RE-INITIALIZE",
      uplinkDenied: "UPLINK_DENIED"
    },
    ar: {
      matrixFailureMsg: "تم تجاوز حد الأمان. عُقد الاحتمالية تالفة. مطلوب إعادة تشغيل الجلسة.",
      retrySync: "إعادة التهيئة",
      uplinkDenied: "تم رفض الاتصال"
    }
  }[language];

  const targetRows = useMemo(() => [
    { mult: "349.68", row: 9 }, // أعلى صف
    { mult: "69.93",  row: 8 },
    { mult: "27.92",  row: 7 },
    { mult: "11.18",  row: 6 },
    { mult: "6.71",   row: 5 },
    { mult: "4.02",   row: 4 },
    { mult: "2.41",   row: 3 },
    { mult: "1.93",   row: 2 },
    { mult: "1.54",   row: 1 },
    { mult: "1.23",   row: 0 }, // أسفل صف يبدأ منه المشغل
  ], []);

  const visibleRows = useMemo(() => {
    return targetRows.filter((r) => r.row < rowCount);
  }, [rowCount, targetRows]);

  const hasPrediction = !isAnalyzing && predictionId && path.length > 0;
  const hasFailure = !isAnalyzing && predictionId && path.every((col) => col === -1);
  const showPathApples = hasPrediction && !hasFailure;

  useEffect(() => {
    if (showPathApples) {
      setSuccessFlicker(true);
      const timer = setTimeout(() => setSuccessFlicker(false), 800);
      return () => clearTimeout(timer);
    }
  }, [predictionId, showPathApples]);

  // Decrypts the complete safe/rotten map of the board for predictions
  const resolvedGrid = useMemo(() => {
    if (!predictionId) return null;

    return Array.from({ length: rowCount }).map((_, rIdx) => {
      const pathCol = path[rIdx] !== undefined ? path[rIdx] : -1;

      // If we have live grid data from Firebase RTDB, map it directly
      if (gridData && gridData[rIdx]) {
        return gridData[rIdx].map((isSafe, cIdx) => {
          if (cIdx === pathCol) return "path";
          return isSafe ? "good" : "bad";
        });
      }

      // Fallback: Generate safe/rotten maps according to difficulty counts
      // Rotten apples count mapping based on row index
      const rottenCount = Array.from({ length: 15 }, (_, idx) => {
        if (idx + 1 <= 4) return 1; // Lower rows: 1 rotten
        if (idx + 1 <= 7) return 2; // Middle rows: 2 rotten
        if (idx + 1 <= 9) return 3; // Advanced rows: 3 rotten
        return 4;                   // Last row: 4 rotten
      })[rIdx] || 1;

      const cols = [0, 1, 2, 3, 4];
      const otherCols = cols.filter((c) => c !== pathCol);

      // Shuffle other columns to select rotten ones
      for (let i = otherCols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherCols[i], otherCols[j]] = [otherCols[j], otherCols[i]];
      }

      const badCols = otherCols.slice(0, rottenCount);

      return cols.map((colIdx) => {
        if (colIdx === pathCol) return "path";
        if (badCols.includes(colIdx)) return "bad";
        return "good";
      });
    });
  }, [predictionId, path, rowCount, gridData]);

  const hasRevealed = !isAnalyzing && !!predictionId && (!!gridData || path.length > 0) && !hasFailure;

  const getCellState = (rowIdx: number, colIdx: number): "path" | "good" | "bad" | "unknown" => {
    if (!predictionId) return "unknown";
    
    const pathCol = path[rowIdx] !== undefined ? path[rowIdx] : -1;
    
    // If we have live grid data from Firebase RTDB
    if (gridData && gridData[rowIdx]) {
      const isSafe = gridData[rowIdx][colIdx] === true;
      if (isSafe) {
        return colIdx === pathCol ? "path" : "good";
      } else {
        return "bad";
      }
    }
    
    // Fallback: use resolvedGrid if available
    if (resolvedGrid && resolvedGrid[rowIdx]) {
      const state = resolvedGrid[rowIdx][colIdx];
      if (state === "path") return "path";
      if (state === "good") return "good";
      if (state === "bad") return "bad";
    }
    
    return "unknown";
  };

  return (
    <div className="relative w-full mx-auto select-none overflow-hidden h-full flex flex-col bg-[#050505]">
      {/* Laser line grid decoration */}
      <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(rgba(34,197,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />

      <div className={`flex flex-col gap-1.5 p-3 relative z-10 flex-1 transition-all duration-300 ${successFlicker ? 'brightness-125' : ''}`}>
        
        {/* Column headings */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-12 flex justify-center opacity-40">
            <Cpu className="w-4 h-4 text-green-600 animate-pulse" />
          </div>
          <div className="grid grid-cols-5 gap-2 flex-1">
            {COL_LABELS.map((label) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-[7px] font-black text-zinc-500 font-mono tracking-[0.3em] uppercase">
                  {label}
                </span>
                <div className="w-1 h-1 rounded-full bg-green-600/30 mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Analyzer Loading Screen */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm rounded-[2.5rem] overflow-hidden border border-green-600/30"
            >
              <div className="relative z-20 flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute -inset-8 bg-green-600/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-24 h-24 rounded-3xl bg-black border border-green-600/40 flex items-center justify-center">
                    <Cpu className="w-12 h-12 text-green-600" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-dashed border-green-600/20 rounded-3xl"
                    />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.6em] italic animate-pulse font-en">
                    DECRYPTING_...
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-1 w-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1 w-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1 w-2 bg-green-600 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tactical rows */}
        <div className="flex-1 flex flex-col gap-2">
          {visibleRows.map((rowInfo, rIdx) => {
            const isRowOdd = rowInfo.row % 2 === 0;

            return (
              <div key={rIdx} className="flex items-center gap-3">
                {/* Multiplier Tag */}
                <div className="w-12 flex items-center justify-end h-full">
                  <div
                    className={`w-full py-2 rounded-xl border text-center transition-all duration-500 shadow-lg ${
                      hasRevealed
                        ? isRowOdd
                          ? "border-green-600/60 bg-green-600/20 text-green-500 shadow-green-900/40"
                          : "border-white/30 bg-white/10 text-white"
                        : "border-white/5 bg-transparent text-zinc-800"
                    }`}
                  >
                    <span className="font-mono text-[9px] font-black italic tracking-tighter leading-none">
                      x{rowInfo.mult}
                    </span>
                  </div>
                </div>

                {/* Grid cells */}
                <div className="grid grid-cols-5 gap-2 flex-1">
                  {Array.from({ length: 5 }).map((_, cIdx) => {
                    const cellState = getCellState(rowInfo.row, cIdx);
                    const isPath = cellState === "path";
                    const isGood = cellState === "good";
                    const isBad = cellState === "bad";

                    return (
                      <div
                        key={cIdx}
                        className={`aspect-[1.1/1] w-full flex items-center justify-center relative rounded-2xl transition-all duration-500 overflow-hidden group/cell ${
                          hasRevealed
                            ? isPath
                              ? "border-green-500 bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-[1.03] z-10"
                              : isGood
                                ? "border-green-500/30 bg-green-500/10 shadow-[0_0_8px_rgba(34,197,94,0.2)]"
                                : "border-red-950/40 bg-red-950/5 shadow-[0_0_8px_rgba(239,68,68,0.05)]"
                            : "border-white/5 bg-white/[0.02]"
                        }`}
                      >
                        {hasRevealed ? (
                          <motion.div
                            initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="w-full h-full flex items-center justify-center p-2.5"
                          >
                            {isPath ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <div className="absolute inset-0 bg-green-600/15 rounded-full blur-md animate-pulse" />
                                <WholeAppleIcon className="w-[85%] h-[85%] text-green-500 fill-green-500/20 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                              </div>
                            ) : isGood ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <WholeAppleIcon className="w-[70%] h-[70%] text-green-600/80 fill-green-600/10" />
                              </div>
                            ) : (
                              <div className="relative flex items-center justify-center w-full h-full text-zinc-600">
                                <SlicedAppleIcon className="w-[75%] h-[75%] opacity-40 shrink-0" />
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          /* Coordinate Dots in standby mode */
                          <div className="relative w-full h-full flex items-center justify-center">
                            <div
                              className={`w-1 h-1 rounded-full transition-all duration-700 ${
                                isAnalyzing
                                  ? "bg-green-600 scale-150 shadow-[0_0_12px_rgba(34,197,94,1)] animate-pulse"
                                  : "bg-zinc-800"
                              }`}
                            />
                            <div className="absolute inset-[3px] border-[1px] border-white/[0.02] rounded-xl group-hover/cell:border-green-600/10 transition-colors" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Threat block: Node Corrupted alert */}
      <AnimatePresence>
        {hasFailure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/98 backdrop-blur-md rounded-[2.5rem] p-10 text-center border-2 border-green-600/40 shadow-[0_0_100px_rgba(0,0,0,1)]"
          >
            <div className="relative mb-10">
              <div className="absolute -inset-8 bg-green-600/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-black border border-green-600/50 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                <AlertTriangle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-white uppercase mb-4 italic font-en tracking-[0.4em] leading-none">
              {localizedText.uplinkDenied}
            </h3>
            
            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.3em] max-w-[240px] leading-relaxed mb-10 italic">
              {localizedText.matrixFailureMsg}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full max-w-[220px] h-16 bg-green-600 text-black font-black text-[10px] uppercase tracking-[0.5em] rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-4 hover:bg-green-500 shadow-[0_15px_40px_rgba(34,197,94,0.4)] italic font-en"
            >
              <RefreshCw className="w-5 h-5" />
              <span>{localizedText.retrySync}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
