import { motion } from 'motion/react';
import { playSound } from '../utils/audio';
import { Language, Platform } from '../types';
import { ChevronLeft, Globe, Shield, Activity, Plane, Apple, ChevronRight } from 'lucide-react';

interface GameSelectionProps {
  platform: Platform;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSelect: (gameId: "APPLE" | "CRASH") => void;
  onBack: () => void;
}

export default function GameSelection({ platform, language, onLanguageChange, onSelect, onBack }: GameSelectionProps) {
  const isArabic = language === 'ar';

  const games = [
    {
      id: "APPLE" as const,
      name: "Apple of fortune",
      icon: Apple,
      code: "GAME_01",
      desc: isArabic ? "تنبؤات دقيقة لمسارات التفاح" : "High-precision apple path predictions"
    },
    {
      id: "CRASH" as const,
      name: "Crash",
      icon: Plane,
      code: "GAME_02",
      desc: isArabic ? "رادار تكتيكي لالتقاط إشارات الطيران" : "Tactical radar for aviation signal intake"
    }
  ];

  const handleGameSelect = (id: "APPLE" | "CRASH") => {
    playSound('click');
    onSelect(id);
  };

  const handleBack = () => {
    playSound('click');
    onBack();
  };

  return (
    <div className={`flex flex-col h-full bg-[#020202] relative overflow-hidden ${isArabic ? 'font-ar' : 'font-en'}`}>
      {/* Moving tactical grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-green-600/[0.03] rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-green-600/[0.03] rounded-full blur-[180px]" />
        <div className="absolute inset-0 bg-grid-moving opacity-[0.4]" />
      </div>

      {/* Main app header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] h-20 bg-black/40 backdrop-blur-xl border-b border-green-600/10 flex items-center justify-between px-6"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-green-600 hover:border-green-600/30 transition-all active:scale-90"
          >
            <ChevronLeft className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex items-center gap-4">
            <div className="relative w-9 h-9 rounded-xl bg-black border border-green-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <Activity className="w-5 h-5 text-green-500 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[10px] font-black text-white tracking-[0.3em] uppercase italic leading-none font-en">
                ABEL<span className="text-green-600">HACK</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1 h-1 rounded-full bg-green-600 animate-pulse" />
                <span className="text-[6px] font-mono text-zinc-500 uppercase tracking-widest">
                  SELECT_GAME
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            playSound('toggle');
            onLanguageChange(language === 'en' ? 'ar' : 'en');
          }}
          className="h-10 px-4 rounded-xl bg-white/[0.03] border border-white/5 text-[8px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-green-600/10 hover:border-green-600/30 transition-all active:scale-95 group"
        >
          <Globe className="w-3.5 h-3.5 text-green-600 group-hover:rotate-180 transition-transform duration-700" />
          {language === 'en' ? 'AR' : 'EN'}
        </button>
      </motion.div>

      {/* Selector Container */}
      <div className={`flex-1 flex flex-col pt-32 pb-12 px-8 relative z-10 ${isArabic ? 'text-right' : 'text-left'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-[1px] w-8 bg-green-600/50" />
            <span className="text-[9px] font-black text-green-600 uppercase tracking-[0.4em]">
              {isArabic ? 'اختيار الوحدات' : 'MODULE_SELECTION'}
            </span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
            {isArabic ? 'اختر اللعبة' : 'CHOOSE_GAME'}
          </h2>
        </motion.div>

        {/* Modules stack */}
        <div className="flex-1 flex flex-col gap-6 max-w-sm mx-auto w-full">
          {games.map((game, idx) => {
            const IconComponent = game.icon;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
              >
                <button
                  onClick={() => handleGameSelect(game.id)}
                  className="group relative w-full rounded-[2.5rem] bg-zinc-900/40 border border-white/[0.05] hover:border-green-600/40 transition-all duration-500 p-6 flex items-center gap-6 overflow-hidden active:scale-[0.98]"
                >
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-green-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative w-20 h-20 rounded-3xl overflow-hidden border border-green-600/20 bg-black/60 shrink-0 group-hover:border-green-600/50 transition-colors">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.15),transparent_70%)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <IconComponent className="w-12 h-12 text-green-600 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)] filter group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="absolute inset-0 border border-white/5 rounded-3xl" />
                  </div>

                  <div className="flex-1 flex flex-col items-start overflow-hidden text-left">
                    <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-[0.4em] mb-1.5">
                      {game.code}
                    </span>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-wider leading-tight mb-2 group-hover:text-green-600 transition-colors whitespace-nowrap">
                      {game.name}
                    </h3>
                    <p className="text-[9px] text-zinc-500 leading-tight line-clamp-2 italic">
                      {game.desc}
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-green-600/10 transition-colors">
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-green-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Security badges footer */}
        <div className="mt-12 flex justify-center gap-10 opacity-20">
          <div className="flex flex-col items-center gap-2">
            <Shield size={16} className="text-green-600" />
            <span className="text-[7px] font-mono text-white uppercase tracking-[0.3em]">
              SECURE
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Activity size={16} className="text-green-600" />
            <span className="text-[7px] font-mono text-white uppercase tracking-[0.3em]">
              LIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
