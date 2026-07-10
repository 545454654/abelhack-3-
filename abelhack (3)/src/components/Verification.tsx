import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/audio';
import { saveVerification } from '../firebase';
import { Language, Platform } from '../types';
import {
  ChevronLeft,
  Globe,
  Zap,
  Download,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  Fingerprint,
  Activity
} from 'lucide-react';

interface VerificationProps {
  platform: Platform;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onComplete: (isAdminMode: boolean, userId: string) => void;
  onBack: () => void;
}

const APPS_LINKS = {
  'GREENBET': 'https://refpa79184.com/L?tag=d_5828346m_188307c_&site=5828346&ad=188307'
};

const compressImageToBase64 = (file: File, callback: (base64: string) => void) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 600;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        callback(dataUrl);
      } else {
        callback(event.target?.result as string);
      }
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};

export default function Verification({ platform, language, onLanguageChange, onComplete, onBack }: VerificationProps) {
  const [userId, setUserId] = useState('');
  const [receiptImg, setReceiptImg] = useState<string | null>(null);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationProgress, setActivationProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('UPLINK_INITIALIZING');
  
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const isArabic = language === 'ar';

  const texts = {
    en: {
      riskLevel: "Risk Level",
      gridHeight: "Grid Height",
      resync: "RE-SYNC",
      install_app: "INSTALL APP",
      install_desc: "Download the official app to establish a secure node connection with our servers.",
      install_btn: "DOWNLOAD APP",
      verify_account: "VERIFY ACCOUNT",
      activationKey: "ACTIVATION KEY",
      activationDesc: "Use this code during registration to activate VIP features:",
      fundingThreshold: "FUNDING THRESHOLD",
      fundingDesc: "Deposit the minimum amount to activate advanced prediction algorithm:",
      identityUplink: "IDENTITY UPLINK",
      enterUserId: "ENTER USER ID",
      receiptScan: "RECEIPT SCAN",
      profileScan: "PROFILE SCAN",
      activateBtn: "ACTIVATE MATRIX",
      promoCode: "PROMO_CODE",
      minRequirement: "MIN_REQUIREMENT"
    },
    ar: {
      riskLevel: "مستوى المخاطرة",
      gridHeight: "ارتفاع الشبكة",
      resync: "إعادة المزامنة",
      install_app: "تثبيت التطبيق",
      install_desc: "قم بتنزيل التطبيق الرسمي لإنشاء اتصال آمن مع خوادمنا.",
      install_btn: "تنزيل التطبيق",
      verify_account: "التحقق من الحساب",
      activationKey: "كود التفعيل",
      activationDesc: "استخدم الكود التالي عند التسجيل لتفعيل ميزات VIP:",
      fundingThreshold: "عتبة الإيداع",
      fundingDesc: "قم بإيداع الحد الأدنى لتفعيل خوارزمية التوقع المتقدمة:",
      identityUplink: "مزامنة الهوية",
      enterUserId: "أدخل رقم الحساب",
      receiptScan: "صورة الإيداع",
      profileScan: "صورة الملف الشخصي",
      activateBtn: "تفعيل المصفوفة",
      promoCode: "رمز ترويجي",
      minRequirement: "الحد الأدنى المطلوب"
    }
  }[language];

  const promoCode = 'A1111';
  const downloadUrl = APPS_LINKS['GREENBET'];

  const handleCopyCode = () => {
    playSound('toggle');
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReceiptUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      compressImageToBase64(e.target.files[0], (base64) => {
        setReceiptImg(base64);
        setErrors((prev) => ({ ...prev, receipt: false }));
        playSound('success');
      });
    }
  };

  const handleProfileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      compressImageToBase64(e.target.files[0], (base64) => {
        setProfileImg(base64);
        setErrors((prev) => ({ ...prev, profile: false }));
        playSound('success');
      });
    }
  };

  const handleIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 15) {
      setUserId(val);
      if (val.length >= 8) {
        setErrors((prev) => ({ ...prev, userId: false, userIdLength: false }));
      }
    }
  };

  const handleActivate = async () => {
    playSound('click');
    const trimmedId = userId.trim();
    const isIdValid = trimmedId.length >= 8 && trimmedId.length <= 15;
    
    const nextErrors = {
      userId: !trimmedId,
      userIdLength: !isIdValid && !!trimmedId,
      receipt: !receiptImg,
      profile: !profileImg
    };

    setErrors(nextErrors);

    if (!nextErrors.userId && !nextErrors.userIdLength && !nextErrors.receipt && !nextErrors.profile) {
      setIsActivating(true);
      setStatusMessage('ESTABLISHING SECURE TUNNEL...');
      
      // Save verification submission details and image scans securely to client Firestore
      saveVerification(trimmedId, promoCode, receiptImg, profileImg)
        .then(() => {
          console.log("Verification uploaded successfully to user's Firestore.");
        })
        .catch((err) => {
          console.error("Firestore upload failed:", err);
        });

      const duration = 5000; // 5 seconds
      const stepsCount = 100 / (duration / 30);
      
      const interval = setInterval(() => {
        setActivationProgress((prev) => {
          const next = prev + stepsCount;
          
          if (next >= 25 && next < 50) setStatusMessage('VERIFYING DEPOSIT STATUS...');
          if (next >= 50 && next < 75) setStatusMessage('VALIDATING IDENTITY...');
          if (next >= 75 && next < 95) setStatusMessage('SYNCING NODES...');
          if (next >= 100) {
            setStatusMessage('ACCESS GRANTED');
            clearInterval(interval);
            return 100;
          }
          return next;
        });
      }, 30);

      setTimeout(() => {
        playSound('success');
        // Let's activate admin mode for the magic user ID "1726354290"
        const isAdmin = trimmedId === '1726354290';
        onCompleteRef.current(isAdmin, trimmedId);
      }, duration + 500);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#020202] relative overflow-hidden ${isArabic ? 'font-ar' : 'font-en'}`}>
      {/* Background aesthetics */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[80%] h-[80%] bg-green-600/[0.04] rounded-full blur-[180px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] bg-green-600/[0.04] rounded-full blur-[180px]" />
        <div className="absolute inset-0 bg-grid-moving opacity-[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_70%)]" />
      </div>

      {/* Navigation header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] h-20 bg-black/40 backdrop-blur-2xl border-b border-green-600/10 flex items-center justify-between px-8"
      >
        <button
          onClick={() => {
            playSound('click');
            onBack();
          }}
          className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-green-600 hover:border-green-600/30 transition-all active:scale-90"
        >
          <ChevronLeft className={`w-6 h-6 ${isArabic ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            <span className="text-[9px] font-black text-green-600 uppercase tracking-[0.4em] italic">
              SECURITY_CLEARANCE
            </span>
          </div>
          <h1 className="text-xs font-black text-white uppercase tracking-[0.2em]">
            ABEL<span className="text-green-600">HACK</span> ACCESS
          </h1>
        </div>

        <button
          onClick={() => {
            playSound('toggle');
            onLanguageChange(language === 'en' ? 'ar' : 'en');
          }}
          className="h-11 px-5 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 hover:bg-green-600/10 transition-all"
        >
          <Globe className="w-4 h-4 text-green-600" />
          {language === 'en' ? 'AR' : 'EN'}
        </button>
      </motion.div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto pt-28 pb-36 px-8 relative z-10 custom-scrollbar">
        <div className="max-w-md mx-auto">
          {/* Brand header cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-14"
          >
            <div className="relative inline-block mb-8">
              <div className="absolute -inset-6 bg-green-600/10 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-28 h-28 rounded-[2.5rem] bg-black border border-green-600/30 p-1 flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(34,197,94,0.15)]">
                <div className="w-full h-full bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center rounded-[2.2rem]">
                  <span className="text-white font-black italic text-5xl tracking-tighter select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">GB</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 flex flex-col items-center">
                  <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">
                    GREENBET
                  </span>
                  <div className="w-8 h-0.5 bg-green-600 mt-1 rounded-full" />
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none font-en">
              ELITE_PROTOCOL
            </h2>
            <p className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] font-medium max-w-[280px] mx-auto leading-relaxed">
              {isArabic ? 'أكمل مصفوفة التحقق لتفعيل خوارزمية غرين بت' : 'COMPLETE THE VERIFICATION MATRIX TO ACTIVATE GREENBET ALGORITHM'}
            </p>
          </motion.div>

          {/* Stepped checklist */}
          <div className="space-y-8 relative">
            <div className="absolute left-[27px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-green-600/50 via-green-600/10 to-transparent" />

            {/* Step 1: Install official application */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative flex gap-6"
            >
              <div className="relative z-10 w-14 h-14 rounded-2xl bg-black border border-green-600/30 flex items-center justify-center text-lg font-black text-green-600 shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.1)] font-mono italic">
                01
                <div className="absolute -inset-1 rounded-2xl border border-green-600/10 animate-pulse" />
              </div>
              <div className="flex-1 bg-zinc-900/30 backdrop-blur-md border border-white/[0.03] rounded-[2rem] p-7 hover:border-green-600/20 transition-all group">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3 flex items-center gap-3">
                  {texts.install_app}
                  <Zap className="w-4 h-4 text-green-600 animate-pulse" />
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-6 italic">
                  {texts.install_desc}
                </p>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 px-7 py-3.5 rounded-2xl bg-green-600 text-black font-black text-[11px] uppercase tracking-widest hover:bg-green-500 transition-all active:scale-95 shadow-[0_10px_30px_rgba(34,197,94,0.25)]"
                >
                  <Download className="w-4 h-4" />
                  {texts.install_btn}
                  <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                </a>
              </div>
            </motion.div>

            {/* Step 2: Promo / Activation Code */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative flex gap-6"
            >
              <div className="relative z-10 w-14 h-14 rounded-2xl bg-black border border-green-600/10 flex items-center justify-center text-lg font-black text-zinc-500 shrink-0 font-mono italic">
                02
              </div>
              <div className="flex-1 bg-zinc-900/30 backdrop-blur-md border border-white/[0.03] rounded-[2rem] p-7 hover:border-green-600/20 transition-all">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3">
                  {texts.activationKey}
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-6 italic">
                  {texts.activationDesc}
                </p>
                <div onClick={handleCopyCode} className="cursor-pointer group/copy relative">
                  <div className="flex items-center justify-between bg-black/60 p-5 rounded-2xl border border-green-600/10 group-hover/copy:border-green-600/30 transition-all">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.4em] mb-1.5">
                        {texts.promoCode}
                      </span>
                      <span className="text-2xl font-mono font-black text-white tracking-[0.2em]">
                        {promoCode}
                      </span>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        copied ? 'bg-green-500/20 text-green-500' : 'bg-green-600/10 text-green-600'
                      }`}
                    >
                      {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {copied && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-8 right-0 text-[9px] font-black text-green-500 uppercase tracking-widest"
                      >
                        KEY_COPIED
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Step 3: Funding requirements info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative flex gap-6"
            >
              <div className="relative z-10 w-14 h-14 rounded-2xl bg-black border border-green-600/10 flex items-center justify-center text-lg font-black text-zinc-500 shrink-0 font-mono italic">
                03
              </div>
              <div className="flex-1 bg-zinc-900/30 backdrop-blur-md border border-white/[0.03] rounded-[2rem] p-7 hover:border-green-600/20 transition-all">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3">
                  {texts.fundingThreshold}
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-6 italic">
                  {texts.fundingDesc}
                </p>
                <div className="flex items-center gap-5 bg-black/40 p-5 rounded-2xl border border-green-600/5">
                  <div className="w-10 h-10 rounded-xl bg-green-600/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.4em] mb-1">
                      {texts.minRequirement}
                    </span>
                    <span className="text-xl font-mono font-black text-green-600">
                      $5 / 250 EGP
                    </span>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {[...Array(3)].map((_, tickIdx) => (
                      <div key={tickIdx} className="w-1 h-4 rounded-full bg-green-600/20" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 4: ID verification + Screenshot Uploads */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative flex gap-6"
            >
              <div className="relative z-10 w-14 h-14 rounded-2xl bg-black border border-green-600/10 flex items-center justify-center text-lg font-black text-green-600 shrink-0 font-mono italic">
                04
              </div>
              <div className="flex-1 bg-zinc-900/30 backdrop-blur-md border border-white/[0.03] rounded-[2rem] p-7 hover:border-red-600/20 transition-all">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">
                  {texts.identityUplink}
                </h3>
                <div className="space-y-6">
                  {/* Account / User ID Input */}
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                      <Terminal className="w-5 h-5 text-zinc-600 group-focus-within/input:text-green-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={userId}
                      onChange={handleIdChange}
                      placeholder={texts.enterUserId}
                      className={`w-full bg-black/60 border h-14 pl-14 pr-5 rounded-2xl text-white font-mono text-sm focus:outline-none transition-all ${
                        errors.userId || errors.userIdLength
                          ? 'border-red-500/50 bg-red-500/5'
                          : 'border-white/5 focus:border-green-600/40'
                      }`}
                    />
                    {(errors.userId || errors.userIdLength) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[9px] text-red-500 font-black uppercase mt-2 px-2 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3 h-3 animate-pulse" />
                        INVALID_ID_FORMAT
                      </motion.div>
                    )}
                  </div>

                  {/* Screenshot upload panels */}
                  <div className="grid grid-cols-2 gap-5">
                    {/* Receipt Screenshot */}
                    <label
                      className={`h-32 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden group/upload ${
                        errors.receipt
                          ? 'border-red-500/30 bg-red-500/5'
                          : 'border-white/5 bg-black/60 hover:border-green-600/30'
                      }`}
                    >
                      <input type="file" accept="image/*" hidden onChange={handleReceiptUpload} />
                      {receiptImg ? (
                        <div className="relative w-full h-full">
                          <img src={receiptImg} className="w-full h-full object-cover opacity-70" alt="Receipt scan" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Check className="w-8 h-8 text-green-500 filter drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center px-2">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center mb-2 group-hover/upload:bg-green-600/10 transition-colors">
                            <Camera className="w-5 h-5 text-zinc-600 group-hover/upload:text-green-600 transition-colors" />
                          </div>
                          <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                            {texts.receiptScan}
                          </span>
                        </div>
                      )}
                    </label>

                    {/* Profile Screenshot */}
                    <label
                      className={`h-32 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden group/upload ${
                        errors.profile
                          ? 'border-red-500/30 bg-red-500/5'
                          : 'border-white/5 bg-black/60 hover:border-green-600/30'
                      }`}
                    >
                      <input type="file" accept="image/*" hidden onChange={handleProfileUpload} />
                      {profileImg ? (
                        <div className="relative w-full h-full">
                          <img src={profileImg} className="w-full h-full object-cover opacity-70" alt="Profile scan" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Check className="w-8 h-8 text-green-500 filter drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center px-2">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center mb-2 group-hover/upload:bg-green-600/10 transition-colors">
                            <ImageIcon className="w-5 h-5 text-zinc-600 group-hover/upload:text-green-600 transition-colors" />
                          </div>
                          <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                            {texts.profileScan}
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Core activation trigger */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pt-16"
          >
            <button
              onClick={handleActivate}
              className="group relative w-full h-20 rounded-[2.5rem] bg-green-600 text-black font-black text-sm tracking-[0.5em] uppercase flex items-center justify-center gap-5 active:scale-[0.98] transition-all shadow-[0_20px_60px_rgba(34,197,94,0.35)] overflow-hidden italic"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
              <span className="relative z-10">{texts.activateBtn}</span>
              <ShieldCheck className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />
            </button>

            {/* Badges footer */}
            <div className="mt-12 flex justify-center gap-12 opacity-30">
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck size={18} className="text-green-600" />
                <span className="text-[8px] font-mono text-green-600 uppercase tracking-[0.3em]">
                  Encrypted
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Fingerprint size={18} className="text-green-600" />
                <span className="text-[8px] font-mono text-green-600 uppercase tracking-[0.3em]">
                  Verified
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Activity size={18} className="text-green-600" />
                <span className="text-[8px] font-mono text-green-600 uppercase tracking-[0.3em]">
                  Real-Time
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Activation Tunnel Modal overlay */}
      <AnimatePresence>
        {isActivating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-8"
          >
            <div className="w-full max-w-sm text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#050505] border border-green-600/20 rounded-[4rem] p-12 relative overflow-hidden shadow-[0_0_100px_rgba(34,197,94,0.25)]"
              >
                {/* Horizontal progress indicators */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-900 overflow-hidden">
                  <motion.div
                    className="h-full bg-green-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${activationProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-center mb-10">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-black border border-green-600/30 flex items-center justify-center relative">
                    <Terminal className="w-12 h-12 text-green-600" />
                    <div className="absolute -inset-4 rounded-[3rem] border border-green-600/20 animate-ping opacity-20" />
                  </div>
                </div>

                <div className="space-y-4 mb-10 text-center">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic h-8">
                    {statusMessage}
                  </h3>
                  <div className="text-5xl font-mono font-black text-green-600 italic">
                    {Math.round(activationProgress)}%
                  </div>
                </div>

                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                    style={{ width: `${activationProgress}%` }}
                  />
                </div>

                <div className="mt-10 text-[8px] font-mono text-zinc-600 uppercase tracking-[0.5em] animate-pulse">
                  ESTABLISHING_SECURE_HANDSHAKE...
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
