import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { playSound } from './utils/audio';
import { Language, Platform, ScreenState, AccessKeyData } from './types';
import Splash from './components/Splash';
import PlatformSelector from './components/PlatformSelector';
import Verification from './components/Verification';
import GameSelection from './components/GameSelection';
import CrashPredictor from './components/CrashPredictor';
import ApplePredictor from './components/ApplePredictor';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(() => {
    try {
      const saved = localStorage.getItem('selected_platform');
      if (saved === 'GREENBET') return saved;
    } catch {}
    return 'GREENBET';
  });

  const [accessKeyData, setAccessKeyData] = useState<AccessKeyData>(() => {
    try {
      const saved = localStorage.getItem('access_key_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.key) return parsed;
      }
    } catch {}
    return {
      key: '8963007529',
      isActive: true,
      type: 'SESSION',
      createdAt: Date.now(),
      isAdminMode: false
    };
  });

  const [screen, setScreen] = useState<ScreenState>(() => {
    try {
      if (localStorage.getItem('selected_platform')) {
        return 'GAME_SELECTION';
      }
    } catch {}
    return 'SELECTION';
  });

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved === 'en' || saved === 'ar') return saved;
    } catch {}
    return 'en';
  });

  // Keep language synchronized in LocalStorage
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch {}
  };

  // Sync access key changes
  useEffect(() => {
    try {
      localStorage.setItem('access_key_data', JSON.stringify(accessKeyData));
    } catch {}
  }, [accessKeyData]);

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    try {
      localStorage.setItem('selected_platform', platform);
    } catch {}
    setScreen('CONDITIONS');
  };

  const handleVerificationComplete = (isAdminMode: boolean, userId: string) => {
    setAccessKeyData({
      key: userId,
      isActive: true,
      type: 'VERIFIED',
      createdAt: Date.now(),
      isAdminMode
    });
    setScreen('GAME_SELECTION');
  };

  const isArabic = language === 'ar';

  const renderActiveScreen = () => {
    switch (screen) {
      case 'SELECTION':
        return (
          <PlatformSelector
            onSelect={handlePlatformSelect}
            language={language}
            onLanguageChange={handleLanguageChange}
          />
        );
      case 'CONDITIONS':
        return (
          <Verification
            platform={selectedPlatform}
            language={language}
            onLanguageChange={handleLanguageChange}
            onComplete={handleVerificationComplete}
            onBack={() => setScreen('SELECTION')}
          />
        );
      case 'GAME_SELECTION':
        return (
          <GameSelection
            platform={selectedPlatform}
            language={language}
            onLanguageChange={handleLanguageChange}
            onSelect={(gameId) => setScreen(gameId === 'APPLE' ? 'APPLE' : 'CRASH')}
            onBack={() => setScreen('CONDITIONS')}
          />
        );
      case 'CRASH':
        return (
          <CrashPredictor
            onBack={() => setScreen('GAME_SELECTION')}
            accessKeyData={accessKeyData}
            language={language}
            onLanguageChange={handleLanguageChange}
            platform={selectedPlatform}
          />
        );
      case 'APPLE':
        return (
          <ApplePredictor
            onBack={() => setScreen('GAME_SELECTION')}
            accessKeyData={accessKeyData}
            language={language}
            onLanguageChange={handleLanguageChange}
            platform={selectedPlatform}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-black text-white selection:bg-green-500/30 overflow-hidden relative ${isArabic ? 'font-ar' : 'font-en'}`}>
      <AnimatePresence mode="wait">
        {showSplash ? (
          <Splash
            key="splash"
            language={language}
            onComplete={() => setShowSplash(false)}
          />
        ) : (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto relative flex flex-col min-h-screen bg-transparent z-10"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex-1 flex flex-col"
              >
                {renderActiveScreen()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
