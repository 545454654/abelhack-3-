import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Language } from '../types';
import { Terminal } from 'lucide-react';

interface SplashProps {
  key?: string;
  onComplete: () => void;
  language: Language;
}

export default function Splash({ onComplete, language }: SplashProps) {
  const [progress, setProgress] = useState(0);
  const [fade, setFade] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 4000; // 4 seconds loading

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => setFade(true), 500);
        setTimeout(() => {
          onCompleteRef.current();
        }, 1500);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const isArabic = language === 'ar';

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out bg-[#050505] overflow-hidden ${
        fade ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'
      } ${isArabic ? 'font-ar' : ''}`}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-green-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-green-500/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-grid-moving opacity-10" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-6 flex-1 justify-center">
        {/* Animated Main Logo Group */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-12"
        >
          <div className="absolute inset-0 bg-green-500/20 blur-[60px] rounded-full animate-pulse" />
          
          <div className="relative w-40 h-40 overflow-hidden rounded-[3rem] border border-green-500/30 bg-black shadow-[0_0_60px_rgba(34,197,94,0.15)] flex items-center justify-center">
            <Terminal className="w-16 h-16 text-green-500 animate-pulse" />
          </div>

          {/* Floating Platform Badge: Greenbet */}
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-6 -right-6 w-14 h-14 rounded-xl bg-black/80 backdrop-blur-md border border-green-500/40 p-2 shadow-2xl flex items-center justify-center font-black text-green-500 text-[10px] tracking-wider uppercase border-dashed font-mono"
          >
            LIVE
          </motion.div>
        </motion.div>

        {/* Brand Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
          className="text-center"
        >
          <h1 className="text-2xl font-black text-white tracking-[0.5em] uppercase italic mb-2 font-en">
            ABEL<span className="text-green-500">HACK</span>
          </h1>
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-green-500/50 to-transparent mx-auto mb-4" />
          <p className="text-[9px] font-mono text-green-500/60 uppercase tracking-[0.4em] font-bold">
            {isArabic ? 'ذكاء مصفوفة غرين بت' : 'Greenbet Matrix Intelligence'}
          </p>
        </motion.div>
      </div>

      {/* Progress Footer */}
      <div className="pb-32 flex flex-col items-center gap-6 w-full max-w-[240px] relative z-10">
        <div className="flex justify-between w-full px-4">
          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em]">
            {isArabic ? 'جاري تهيئة الإشارة' : 'Establishing Link'}
          </span>
          <span className="text-[10px] font-mono text-green-500 font-bold">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="relative w-full h-[1px] bg-zinc-900 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-600 via-green-400 to-green-600"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-4">
          <div className="w-1 h-1 rounded-full bg-green-500/40 animate-ping" />
          <div className="w-1 h-1 rounded-full bg-green-500/40 animate-ping delay-300" />
          <div className="w-1 h-1 rounded-full bg-green-500/40 animate-ping delay-700" />
        </div>
      </div>
    </div>
  );
}
