import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { playSound } from '../utils/audio';
import { Language, AccessKeyData, Platform } from '../types';
import Radar from './Radar';
import { ChevronLeft, Globe, Zap, Shield, Activity, Users, ShieldAlert } from 'lucide-react';

interface CrashPredictorProps {
  onBack: () => void;
  accessKeyData: AccessKeyData;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  platform: Platform;
}

export default function CrashPredictor({ onBack, accessKeyData, language, onLanguageChange, platform }: CrashPredictorProps) {
  const [status, setStatus] = useState<'IDLE' | 'LOADING'>('IDLE');
  const [multiplier, setMultiplier] = useState(1.0);
  const [onlineUsers, setOnlineUsers] = useState(() => Math.floor(Math.random() * 951) + 50);

  const isArabic = language === 'ar';

  const texts = {
    en: {
      tacticalRadar: "TACTICAL RADAR V1",
      scanning: "SCANNING...",
      getSignal: "GET_SIGNAL",
      scanningWaves: "SCANNING_WAVES..."
    },
    ar: {
      tacticalRadar: "رادار تكتيكي v1",
      scanning: "جاري المسح...",
      getSignal: "جلب الإشارة",
      scanningWaves: "مسح الترددات..."
    }
  }[language];

  // Online users random oscillation
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        return Math.min(1000, Math.max(50, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGetSignal = async () => {
    if (status === 'LOADING') return;
    
    playSound('predict');
    setStatus('LOADING');

    let finalMult = 1.0;
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), 8000);

    try {
      // Determine if admin mode is active
      const isAdmin = accessKeyData?.isAdminMode || accessKeyData?.key === "1726354290";
      console.log("Admin Mode Check:", isAdmin, "User ID Key:", accessKeyData?.key);

      if (isAdmin) {
        const dbEndpoints = [
          "https://evoioi-default-rtdb.europe-west1.firebasedatabase.app/pre/hipr/hipr.json",
          "https://evoioi-default-rtdb.europe-west1.firebasedatabase.app/pre/hip/hipr.json",
          "https://evoioi-default-rtdb.europe-west1.firebasedatabase.app/hipr/hipr.json"
        ];
        
        let fetchedData: any = null;
        let endpointUsed = "";

        for (const url of dbEndpoints) {
          try {
            const res = await fetch(url, { signal: controller.signal });
            if (res.ok) {
              fetchedData = await res.json();
              if (fetchedData !== null) {
                endpointUsed = url;
                break;
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch from ${url}`, err);
          }
        }

        clearTimeout(timeoutTimer);
        console.log("Firebase Data from:", endpointUsed, fetchedData);

        let parsedVal = NaN;
        if (fetchedData !== null) {
          if (typeof fetchedData === "number") {
            parsedVal = fetchedData;
          } else if (typeof fetchedData === "string") {
            parsedVal = parseFloat(fetchedData);
          } else if (typeof fetchedData === "object") {
            // Recursive field lookup like in the original bundle
            const findValue = (obj: any): number | null => {
              if (typeof obj === "number") return obj;
              if (typeof obj === "string" && !isNaN(parseFloat(obj))) return parseFloat(obj);
              if (obj && typeof obj === "object") {
                const keys = ["hipr", "multiplier", "value", "signal", "num", "val", "val1"];
                for (const key of keys) {
                  if (obj[key] !== undefined) {
                    const result = findValue(obj[key]);
                    if (result !== null) return result;
                  }
                }
                for (const key in obj) {
                  const result = findValue(obj[key]);
                  if (result !== null) return result;
                }
              }
              return null;
            };
            parsedVal = findValue(fetchedData) ?? NaN;
          }
        }

        if (!isNaN(parsedVal) && parsedVal > 0) {
          finalMult = parsedVal;
        } else {
          console.warn("Falling back to simulated high-accuracy for admin");
          finalMult = Number((Math.random() * 1.2 + 1.3).toFixed(2)); // Admin fallback
        }
      } else {
        // Regular user: simulated random multiplier between 1.00 and 4.05
        finalMult = Number((Math.random() * 3.05 + 1).toFixed(2));
      }
    } catch (err) {
      console.error("Signal Fetch Error:", err);
      finalMult = Number((Math.random() * 1.5 + 1.15).toFixed(2));
    } finally {
      clearTimeout(timeoutTimer);
    }

    setTimeout(() => {
      setMultiplier(finalMult);
      setStatus('IDLE');
      playSound('success');
    }, 2500);
  };

  const isScanning = status === 'LOADING';

  return (
    <div className={`flex flex-col h-full relative pt-0 select-none bg-[#050505] overflow-hidden ${isArabic ? 'font-ar' : 'font-en'}`}>
      {/* Moving green tracking background grids */}
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

      {/* Main content grid area */}
      <div className={`flex-1 flex flex-col items-center justify-center pt-20 pb-28 px-6 relative z-10 ${isArabic ? 'text-right' : 'text-left'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="z-10 flex flex-col items-center gap-12 w-full max-w-sm">
          {/* Header Title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Zap className="w-4 h-4 text-green-600 animate-pulse" />
              <h1 className="text-green-500 font-black tracking-[0.4em] text-xs uppercase opacity-70 font-mono">
                {texts.tacticalRadar}
              </h1>
              <Zap className="w-4 h-4 text-green-600 animate-pulse" />
            </div>
          </motion.div>

          {/* Interactive Radar */}
          <div className="relative group">
            <div className="absolute -inset-10 bg-green-600/5 rounded-full blur-[60px]" />
            <Radar
              multiplier={multiplier}
              loading={isScanning}
              labels={{ calculating: texts.scanningWaves }}
            />
          </div>

          {/* Metrics Indicator Pill */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-5 bg-black border border-green-500/30 px-6 py-2 rounded-2xl z-30 flex-row"
          >
            <div className="flex items-center gap-2.5 flex-row">
              <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-green-500/40'}`} />
              <span className="text-[9px] font-mono text-white tracking-[0.25em] uppercase font-black">
                {isScanning ? 'SCANNING' : (accessKeyData?.isAdminMode || accessKeyData?.key === "1726354290") ? 'ADMIN_SYNC' : 'LINKED'}
              </span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            <div className="flex items-center gap-2.5 flex-row">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-[11px] font-black text-white font-mono tracking-tighter">
                {onlineUsers.toLocaleString()}
              </span>
            </div>
          </motion.div>

          {/* Predictor execution button stack */}
          <div className="w-full space-y-4">
            <button
              onClick={handleGetSignal}
              disabled={isScanning}
              className={`group relative w-full h-16 rounded-[2rem] font-black text-sm tracking-[0.4em] uppercase transition-all active:scale-[0.98] shadow-2xl overflow-hidden italic
                ${isScanning
                  ? 'bg-black cursor-wait border border-green-500/30 text-green-500/50'
                  : 'bg-green-600 text-black hover:bg-green-500 shadow-green-900/40'}`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
              <span className="relative z-10">
                {isScanning ? texts.scanning : texts.getSignal}
              </span>
            </button>

            <div className="flex justify-center gap-10 opacity-30 mt-8">
              <div className="flex flex-col items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-[7px] font-mono text-green-600 uppercase tracking-[0.3em]">
                  Secure
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-[7px] font-mono text-green-600 uppercase tracking-[0.3em]">
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
