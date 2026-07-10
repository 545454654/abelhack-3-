import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/audio';
import { Language, AccessKeyData, Platform, PredictionResult } from '../types';
import AppleGrid from './AppleGrid';
import {
  fetchPredictionsFromFirebase,
  uploadPredictionsToFirebase,
  generatePredictionsLocal
} from '../utils/prediction';
import {
  ChevronLeft,
  Globe,
  Users,
  Target,
  Shield,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  Lock,
  Download,
  Terminal,
  Activity,
  Loader2
} from 'lucide-react';

interface ApplePredictorProps {
  onBack: () => void;
  accessKeyData: AccessKeyData;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  platform: Platform;
}

export default function ApplePredictor({ onBack, accessKeyData, language, onLanguageChange, platform }: ApplePredictorProps) {
  const [status, setStatus] = useState<'IDLE' | 'ANALYZING' | 'PREDICTED'>('IDLE');
  const [isResyncing, setIsResyncing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(() => Math.floor(Math.random() * 951) + 50);
  
  const [rowCount, setRowCount] = useState(() => {
    try {
      const saved = localStorage.getItem('fortune-ai-rows');
      if (saved) return Math.min(10, Math.max(5, parseInt(saved, 10)));
    } catch {}
    return 10;
  });

  const [difficulty, setDifficulty] = useState<"Easy" | "Pro">(() => {
    try {
      const saved = localStorage.getItem('fortune-ai-difficulty');
      if (saved === 'Easy' || saved === 'Pro') return saved;
    } catch {}
    return 'Pro';
  });

  const [result, setResult] = useState<PredictionResult | null>(() => {
    try {
      const saved = localStorage.getItem('fortune-ai-last-result');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.path)) return parsed;
      }
    } catch {}
    return null;
  });

  const [revealRotten, setRevealRotten] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [showHeightDropdown, setShowHeightDropdown] = useState(false);

  const isArabic = language === 'ar';

  const localizedText = {
    en: {
      riskLevel: "Risk Level",
      gridHeight: "Grid Height",
      generatePrediction: "GENERATE PREDICTION",
      resync: "RE-SYNC",
      revealRotten: "Reveal Rotten",
      hideRotten: "Hide Rotten",
      scanning: "DECRYPTING_..."
    },
    ar: {
      riskLevel: "مستوى المخاطرة",
      gridHeight: "ارتفاع الشبكة",
      generatePrediction: "توليد التوقع",
      resync: "إعادة المزامنة",
      revealRotten: "كشف الفاسد",
      hideRotten: "إخفاء الفاسد",
      scanning: "جاري فك التشفير..."
    }
  }[language];

  // Fluctuating online users counter
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.min(1000, Math.max(50, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Save layout configurations in local storage
  useEffect(() => {
    localStorage.setItem('fortune-ai-rows', rowCount.toString());
    localStorage.setItem('fortune-ai-difficulty', difficulty);
    if (result) {
      localStorage.setItem('fortune-ai-last-result', JSON.stringify(result));
    } else {
      localStorage.removeItem('fortune-ai-last-result');
    }
  }, [rowCount, difficulty, result]);

  const handleGeneratePrediction = async () => {
    if (status === 'ANALYZING') return;

    setStatus('ANALYZING');
    playSound('predict');

    // Automatically generate and upload a fresh, randomized set of predictions matching the rules of progressive difficulty to Firebase RTDB
    let liveGrid: boolean[][] | null = null;
    try {
      await uploadPredictionsToFirebase();
      liveGrid = await fetchPredictionsFromFirebase();
    } catch (e) {
      console.error("Failed to generate and upload fresh predictions to Firebase RTDB:", e);
      // Fallback: try fetching whatever is currently there or generate local
      try {
        liveGrid = await fetchPredictionsFromFirebase();
      } catch (err) {}
    }

    let predictionOutput: PredictionResult;

    if (liveGrid) {
      // Pick a safe path based on live safe grid coordinates
      const calculatedPath: number[] = [];
      for (let r = 0; r < rowCount; r++) {
        if (r < liveGrid.length) {
          const rowData = liveGrid[r];
          // Find which columns are safe (true)
          const safeColIndices = rowData
            .map((isSafe, cIdx) => (isSafe ? cIdx : -1))
            .filter((idx) => idx !== -1);
          
          if (safeColIndices.length > 0) {
            calculatedPath.push(safeColIndices[Math.floor(Math.random() * safeColIndices.length)]);
          } else {
            // No safe column found (all rotten) -> trigger threat alert
            calculatedPath.push(-1);
          }
        } else {
          calculatedPath.push(Math.floor(Math.random() * 5));
        }
      }

      predictionOutput = {
        path: calculatedPath,
        confidence: 99,
        analysis: isArabic ? "تم اعتراض الخادم بنجاح. فك تشفير مصفوفة الاحتمالات." : "SERVER INTERCEPTED. DECRYPTING PROBABILITY MATRIX.",
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        gridData: liveGrid
      };
    } else {
      // Regular simulated mode
      predictionOutput = await generatePredictionsLocal(rowCount);
    }

    setTimeout(() => {
      setStatus('PREDICTED');
      setResult(predictionOutput);
      playSound('success');
    }, 2000);
  };

  const handleResync = async () => {
    if (isResyncing || status === 'ANALYZING') return;

    setIsResyncing(true);
    playSound('click');

    // Perform database wipe/re-sync upload
    await uploadPredictionsToFirebase();
    await new Promise((resolve) => setTimeout(resolve, 800));

    setStatus('IDLE');
    setResult(null);
    setRevealRotten(false);
    setIsResyncing(false);
    playSound('success');
  };

  const handleSelectDifficulty = (level: "Easy" | "Pro") => {
    playSound('click');
    setDifficulty(level);
    setShowDifficultyDropdown(false);
    if (result) {
      setStatus('IDLE');
      setResult(null);
    }
  };

  const handleSelectHeight = (height: number) => {
    playSound('click');
    setRowCount(height);
    setShowHeightDropdown(false);
    if (result) {
      setStatus('IDLE');
      setResult(null);
    }
  };

  const isAnalyzing = status === 'ANALYZING';

  return (
    <div className={`flex flex-col h-full relative pt-0 select-none bg-[#050505] overflow-hidden ${isArabic ? 'font-ar' : 'font-en'}`}>
      
      {/* Top Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        dir="ltr"
        className="fixed top-0 left-0 right-0 z-[100] h-14 bg-black/80 backdrop-blur-md border-b border-green-500/20 flex items-center justify-between px-6"
      >
        <div className="flex items-center gap-3 flex-row">
          <button
            onClick={() => {
              playSound('click');
              onBack();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-green-500/20 hover:border-green-500/50 flex items-center justify-center transition-all active:scale-90 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="flex flex-col items-start">
            <div className="border border-green-500/30 rounded-[8px] px-2 py-1 bg-black/50 flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md overflow-hidden border border-green-500/40 flex items-center justify-center bg-black">
                <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
              </div>
              <h1 className="text-[9px] font-black text-white tracking-[0.1em] uppercase leading-none font-mono">
                UPLINK: <span className="text-green-500">{accessKeyData?.key || "8963007529"}</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              playSound('toggle');
              onLanguageChange(language === 'en' ? 'ar' : 'en');
            }}
            className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-green-500/20 hover:border-green-500/50 active:scale-95 transition-all flex items-center justify-center group"
          >
            <Globe className="w-3.5 h-3.5 mr-1.5 text-green-500 group-hover:rotate-180 transition-transform duration-700" />
            <span className="text-[9px] font-black uppercase font-mono tracking-tighter">
              {language === 'en' ? 'AR' : 'EN'}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Main scrolling predictor dashboard */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar pt-20 pb-28 px-6 relative z-10 flex flex-col ${isArabic ? 'text-right' : 'text-left'}`}>
        
        {/* Glowing Apple Grid Card */}
        <motion.div
          layout
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-8 group z-10 shrink-0 transform-gpu"
        >
          <div className={`bg-black/40 p-0.5 rounded-[2.5rem] border transition-all duration-700 overflow-hidden min-h-[420px] flex flex-col justify-end ${isAnalyzing ? 'border-green-500/50' : 'border-white/10'}`}>
            <AppleGrid
              path={result?.path || []}
              isAnalyzing={isAnalyzing}
              predictionId={result?.id || ''}
              rowCount={rowCount}
              difficulty={difficulty}
              revealRotten={revealRotten}
              gridData={result?.gridData || null}
              language={language}
            />
          </div>

          {/* Floating Indicators Overlay */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-5 bg-black border border-green-500/30 px-6 py-2 rounded-2xl z-30 flex-row shadow-2xl"
          >
            <div className="flex items-center gap-2.5 flex-row">
              <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-green-500 animate-pulse' : 'bg-green-500/40'}`} />
              <span className="text-[9px] font-mono text-white tracking-[0.25em] uppercase font-black">
                {isAnalyzing ? 'SCANNING' : 'LINKED'}
              </span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            <div className="flex items-center gap-2.5 flex-row">
              <Users className="w-4 h-4 text-green-500 animate-pulse" />
              <span className="text-[11px] font-black text-white font-mono tracking-tighter">
                {onlineUsers.toLocaleString()}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Dashboard parameters section */}
        <div className="space-y-4 relative z-10 shrink-0 pb-10">
          
          <div className="grid grid-cols-2 gap-4 mb-2">
            
            {/* Risk Control Settings */}
            <div className="relative space-y-1.5">
              <label className={`block text-[7px] text-zinc-500 uppercase font-black tracking-[0.4em] italic px-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                {localizedText.riskLevel}
              </label>
              
              <button
                disabled={isAnalyzing}
                onClick={() => {
                  playSound('click');
                  setShowDifficultyDropdown(!showDifficultyDropdown);
                  setShowHeightDropdown(false);
                }}
                className={`w-full h-12 bg-black border rounded-2xl px-4 flex items-center justify-between group transition-all disabled:opacity-30 ${
                  showDifficultyDropdown ? 'border-green-500/60' : 'border-white/10 hover:border-green-500/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {difficulty === 'Easy' ? (
                    <Shield className="w-4 h-4 text-green-500" />
                  ) : (
                    <Zap className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-[10px] font-black text-white uppercase tracking-widest font-en">
                    {difficulty}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-500 ${showDifficultyDropdown ? 'rotate-180 text-green-500' : ''}`} />
              </button>

              <AnimatePresence>
                {showDifficultyDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-[110%] left-0 right-0 z-[120] bg-black border border-green-500/30 rounded-2xl overflow-hidden"
                  >
                    {(['Easy', 'Pro'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => handleSelectDifficulty(level)}
                        className={`w-full h-12 px-5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest transition-all ${
                          difficulty === level ? 'bg-green-500 text-black' : 'text-zinc-500 hover:bg-green-500/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {level === 'Easy' ? <Shield size={12} /> : <Zap size={12} />}
                          <span className="font-en">{level}</span>
                        </div>
                        {difficulty === level && <div className="w-2 h-2 rounded-full bg-black animate-pulse" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Grid Row Height Settings */}
            <div className="relative space-y-1.5">
              <label className={`block text-[7px] text-zinc-500 uppercase font-black tracking-[0.4em] italic px-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                {localizedText.gridHeight}
              </label>
              
              <button
                disabled={isAnalyzing}
                onClick={() => {
                  playSound('click');
                  setShowHeightDropdown(!showHeightDropdown);
                  setShowDifficultyDropdown(false);
                }}
                className={`w-full h-12 bg-black border rounded-2xl px-4 flex items-center justify-between group transition-all disabled:opacity-30 ${
                  showHeightDropdown ? 'border-green-500/60' : 'border-white/10 hover:border-green-500/30'
                }`}
              >
                <span className="text-[11px] font-black text-white font-mono italic">
                  {rowCount}
                </span>
                <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-500 ${showHeightDropdown ? 'rotate-180 text-green-500' : ''}`} />
              </button>

              <AnimatePresence>
                {showHeightDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-[110%] left-0 right-0 z-[120] bg-black border border-green-500/30 rounded-2xl overflow-hidden grid grid-cols-2 p-2 gap-2"
                  >
                    {[5, 6, 7, 8, 9, 10].map((h) => (
                      <button
                        key={h}
                        onClick={() => handleSelectHeight(h)}
                        className={`h-11 rounded-xl flex items-center justify-center text-[11px] font-black font-mono transition-all ${
                          rowCount === h ? 'bg-green-500 text-black' : 'text-zinc-500 hover:bg-green-500/10 hover:text-white bg-white/5'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action triggers */}
          <div className="flex flex-col gap-4">
            {/* Generate Predictions */}
            <button
              onClick={handleGeneratePrediction}
              disabled={isAnalyzing || isResyncing}
              className={`group relative w-full h-16 rounded-[2rem] overflow-hidden transition-all active:scale-[0.96] ${
                isAnalyzing ? 'bg-black cursor-wait border border-green-500/30' : 'bg-green-500 hover:bg-green-400'
              }`}
            >
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.0 }}
                    className="absolute inset-y-0 left-0 bg-green-500/30 pointer-events-none transform-gpu"
                  />
                )}
              </AnimatePresence>

              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                {isAnalyzing ? (
                  <div className="flex items-center gap-4">
                    <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                    <span className="text-[10px] font-black tracking-[0.6em] text-green-500 uppercase italic font-en">
                      {localizedText.scanning}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 flex-row">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Target className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-sm font-black tracking-[0.5em] text-black uppercase italic leading-none font-en">
                      {localizedText.generatePrediction}
                    </span>
                  </div>
                )}
              </div>
            </button>

            {/* Helper Re-sync and Reveal Rotten buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleResync}
                disabled={isResyncing || isAnalyzing}
                className="h-14 rounded-2xl border border-white/10 bg-black/50 text-zinc-500 hover:text-white hover:border-green-500/50 hover:bg-green-500/5 transition-all active:scale-95 font-black text-[9px] uppercase tracking-[0.35em] flex items-center justify-center gap-3 flex-row disabled:opacity-20 font-en"
              >
                <RefreshCw className={`w-4 h-4 ${isResyncing ? 'animate-spin text-green-500' : 'group-hover:text-green-500'}`} />
                <span>{localizedText.resync}</span>
              </button>

              <button
                onClick={() => {
                  if (result) {
                    playSound('toggle');
                    setRevealRotten(!revealRotten);
                  }
                }}
                disabled={!result || isAnalyzing}
                className={`h-14 rounded-2xl border transition-all active:scale-95 font-black text-[9px] uppercase tracking-[0.35em] flex items-center justify-center gap-3 flex-row font-en ${
                  result
                    ? revealRotten
                      ? "bg-green-500/15 border-green-500 text-green-500"
                      : "border-white/10 bg-black/50 text-zinc-500 hover:text-white hover:border-green-500/50 hover:bg-green-500/5"
                    : "border-white/5 opacity-20"
                }`}
              >
                {revealRotten ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{revealRotten ? localizedText.hideRotten : localizedText.revealRotten}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
