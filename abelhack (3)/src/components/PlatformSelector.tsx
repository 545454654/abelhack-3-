import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/audio';
import { Language, Platform } from '../types';
import { Globe, Wifi, Check, ShieldAlert, Layers, Database, Loader2, Terminal } from 'lucide-react';

interface PlatformSelectorProps {
  onSelect: (platform: Platform) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function PlatformSelector({ onSelect, language, onLanguageChange }: PlatformSelectorProps) {
  const [selected, setSelected] = useState<Platform>('GREENBET');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const isArabic = language === 'ar';

  const platforms = [
    {
      id: 'GREENBET' as Platform,
      name: 'Greenbet',
      code: 'NODE_01',
      region: 'Global-Alpha',
      status: isArabic ? 'مستقر' : 'Stable'
    }
  ];

  const steps = isArabic
    ? ['جاري تهيئة الاتصال', 'مزامنة البيانات المشفرة', 'تفعيل بروتوكول أبيل هاك', 'تم الربط بنجاح']
    : ['Initializing Uplink', 'Syncing Encrypted Data', 'Activating AbelHack Protocol', 'Uplink Established'];

  useEffect(() => {
    if (isSyncing) {
      const interval = setInterval(() => {
        setSyncProgress((prev) => {
          const next = prev + 1;
          
          if (next >= 15 && !completedSteps.includes(0)) setCompletedSteps((s) => [...s, 0]);
          if (next >= 45 && !completedSteps.includes(1)) setCompletedSteps((s) => [...s, 1]);
          if (next >= 75 && !completedSteps.includes(2)) setCompletedSteps((s) => [...s, 2]);
          if (next >= 95 && !completedSteps.includes(3)) setCompletedSteps((s) => [...s, 3]);

          if (next >= 100) {
            clearInterval(interval);
            return 100;
          }
          return next;
        });
      }, 30);

      const timeout = setTimeout(() => {
        onSelectRef.current(selected);
      }, 3500);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isSyncing, selected, completedSteps]);

  const handleInitialize = () => {
    playSound('click');
    setIsSyncing(true);
  };

  const handleSelectPlatform = (id: Platform) => {
    playSound('click');
    setSelected(id);
  };

  const handleToggleLanguage = () => {
    playSound('toggle');
    onLanguageChange(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className={`flex flex-col h-full bg-[#020202] relative overflow-hidden ${isArabic ? 'font-ar' : 'font-en'}`}>
      {/* Visual background layers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-green-600/[0.03] rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-green-600/[0.03] rounded-full blur-[180px]" />
        <div className="absolute inset-0 bg-grid-moving opacity-[0.4]" />
      </div>

      {/* Header bar */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] h-20 bg-black/40 backdrop-blur-xl border-b border-green-600/10 flex items-center justify-between px-8"
      >
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute -inset-1 bg-green-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-11 h-11 rounded-xl bg-black border border-green-500/30 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center font-black text-white italic text-base tracking-tighter">
                GB
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-white tracking-[0.4em] uppercase italic leading-none">
              ABEL<span className="text-green-600">HACK</span>
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest">
                SYSTEM_ONLINE_v4.5
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleToggleLanguage}
          className="h-10 px-5 rounded-xl bg-white/[0.03] border border-white/5 text-[9px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-green-600/10 hover:border-green-600/30 transition-all active:scale-95 group"
        >
          <Globe className="w-4 h-4 text-green-600 group-hover:rotate-180 transition-transform duration-700" />
          {language === 'en' ? 'AR' : 'EN'}
        </button>
      </motion.div>

      {/* Main body content */}
      <div className={`flex-1 flex flex-col pt-32 pb-12 px-8 relative z-10 ${isArabic ? 'text-right' : 'text-left'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-[1px] w-8 bg-green-600/50" />
            <span className="text-[9px] font-black text-green-600 uppercase tracking-[0.4em]">
              {isArabic ? 'تحديد الهدف' : 'TARGET_ACQUISITION'}
            </span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
            {isArabic ? 'اختر المنصة' : 'SELECT_NODE'}
          </h2>
        </motion.div>

        {/* Platforms stack */}
        <div className="flex-1 flex flex-col gap-5 max-w-sm mx-auto w-full">
          {platforms.map((plat, idx) => (
            <motion.div
              key={plat.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.15 }}
            >
              <button
                onClick={() => handleSelectPlatform(plat.id)}
                disabled={isSyncing}
                className={`group relative w-full rounded-[2.5rem] transition-all duration-700 overflow-hidden flex flex-col p-6 border-2 ${
                  selected === plat.id
                    ? 'border-green-600 bg-green-600/[0.07] shadow-[0_0_50px_rgba(34,197,94,0.15)]'
                    : 'border-white/[0.03] bg-zinc-900/20 hover:border-white/10'
                }`}
              >
                {/* Status indicator pill */}
                <div
                  className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-2 ${
                    selected === plat.id ? 'bg-green-600 text-black' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <div
                    className={`w-1 h-1 rounded-full ${
                      selected === plat.id ? 'bg-black animate-pulse' : 'bg-zinc-600'
                    }`}
                  />
                  {plat.status}
                </div>

                <div className="flex items-center gap-6">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-3xl overflow-hidden border border-white/5 bg-black shrink-0 group-hover:scale-105 transition-transform duration-700 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center">
                      <span className="text-white font-black italic text-4xl tracking-tighter select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">GB</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>

                  {/* Info details */}
                  <div className="flex-1 flex flex-col items-start">
                    <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] mb-1.5">
                      {plat.code}
                    </span>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-wider leading-none group-hover:text-green-600 transition-colors">
                      {plat.name}
                    </h3>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Wifi size={10} className={selected === plat.id ? 'text-green-600' : 'text-zinc-700'} />
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">
                          {plat.region}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uplink connected decoration */}
                <AnimatePresence>
                  {selected === plat.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 pt-6 border-t border-green-600/10 flex items-center justify-between w-full"
                    >
                      <div className="flex gap-1.5">
                        {[...Array(4)].map((_, stepIdx) => (
                          <div
                            key={stepIdx}
                            className="w-6 h-1 rounded-full bg-green-600/20 overflow-hidden"
                          >
                            <motion.div
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: stepIdx * 0.2 }}
                              className="w-full h-full bg-green-600"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                        <Check className="w-4 h-4 text-black stroke-[4px]" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Footer actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 space-y-10 max-w-sm mx-auto w-full"
        >
          <button
            onClick={handleInitialize}
            disabled={isSyncing}
            className="group relative w-full h-20 rounded-[2.5rem] bg-green-600 text-black font-black text-sm tracking-[0.5em] uppercase flex items-center justify-center gap-4 hover:bg-green-500 active:scale-[0.98] transition-all disabled:opacity-50 overflow-hidden italic shadow-[0_20px_50px_rgba(34,197,94,0.25)]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
            <span className="relative z-10">
              {isArabic ? 'بدء المزامنة' : 'INITIALIZE_LINK'}
            </span>
            <Check className={`w-6 h-6 relative z-10 transition-transform group-hover:translate-x-2 ${isArabic ? 'rotate-180 group-hover:-translate-x-2' : ''}`} />
          </button>

          <div className="flex justify-center gap-10 opacity-30">
            <div className="flex flex-col items-center gap-2 group cursor-help">
              <div className="w-10 h-10 rounded-xl border border-green-600/20 flex items-center justify-center group-hover:border-green-600/50 transition-colors">
                <ShieldAlert size={18} className="text-green-600" />
              </div>
              <span className="text-[7px] font-mono text-green-600 uppercase tracking-[0.3em]">
                Encrypted
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-help">
              <div className="w-10 h-10 rounded-xl border border-green-600/20 flex items-center justify-center group-hover:border-green-600/50 transition-colors">
                <Layers size={18} className="text-green-600" />
              </div>
              <span className="text-[7px] font-mono text-green-600 uppercase tracking-[0.3em]">
                Multi-Layer
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-help">
              <div className="w-10 h-10 rounded-xl border border-green-600/20 flex items-center justify-center group-hover:border-green-600/50 transition-colors">
                <Database size={18} className="text-green-600" />
              </div>
              <span className="text-[7px] font-mono text-green-600 uppercase tracking-[0.3em]">
                Secure_DB
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Uplink Syncing Modal overlay */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-8"
          >
            <div className="w-full max-w-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#050505] border border-green-600/20 rounded-[4rem] p-12 relative overflow-hidden shadow-[0_0_100px_rgba(34,197,94,0.2)]"
              >
                {/* Micro linear bar at the top */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-900 overflow-hidden">
                  <motion.div
                    className="h-full bg-green-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${syncProgress}%` }}
                  />
                </div>

                <div className="flex flex-col items-center mb-12">
                  <div className="relative mb-10">
                    <div className="relative w-28 h-28 rounded-[2.5rem] bg-black border border-green-600/30 flex items-center justify-center">
                      <Terminal className="w-14 h-14 text-green-600" />
                      <div className="absolute -inset-4 rounded-[3rem] border border-green-600/20 animate-ping opacity-20" />
                      <div className="absolute -inset-8 rounded-[3.5rem] border border-green-600/10 animate-ping opacity-10 delay-300" />
                    </div>
                  </div>
                  <h4 className="text-3xl font-black text-white uppercase tracking-[0.1em] italic">
                    {isArabic ? 'جاري الربط' : 'ESTABLISHING'}
                  </h4>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.5em]">
                      DATA_STREAM_ACTIVE
                    </span>
                  </div>
                </div>

                {/* Synchronized status list */}
                <div className="space-y-6 mb-12">
                  {steps.map((stepText, stepIdx) => (
                    <motion.div
                      key={stepIdx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: completedSteps.includes(stepIdx) ? 1 : 0.1,
                        x: 0
                      }}
                      transition={{ duration: 0.5 }}
                      className={`flex items-center gap-5 ${isArabic ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all duration-700 ${
                          completedSteps.includes(stepIdx)
                            ? 'bg-green-600/20 border-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                            : 'border-zinc-800'
                        }`}
                      >
                        {completedSteps.includes(stepIdx) ? (
                          <Check className="w-4 h-4 text-green-600 stroke-[3px]" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-zinc-800 animate-spin" />
                        )}
                      </div>
                      <span className="text-xs font-black text-zinc-300 uppercase tracking-widest">
                        {stepText}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Progress bar metrics */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end px-2">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">
                      UPLINK_STRENGTH
                    </span>
                    <span className="text-4xl font-black text-green-600 font-mono italic">
                      {Math.round(syncProgress)}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
