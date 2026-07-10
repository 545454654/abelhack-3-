import { useState, useEffect, useRef } from 'react';

interface RadarProps {
  multiplier: number;
  loading: boolean;
  labels: {
    calculating: string;
  };
}

export default function Radar({ multiplier, loading, labels }: RadarProps) {
  const [currentVal, setCurrentVal] = useState(1.0);
  const [scaleFactor, setScaleFactor] = useState(1.0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading) {
      setCurrentVal(1.0);
      setScaleFactor(0.8);
    } else {
      const targetVal = multiplier;
      const duration = 1400; // 1.4s sweep animation
      const startTime = performance.now();

      // Custom smooth easing for multiplier counter ticking
      const easeOutBack = (x: number): number => {
        return 1 + 2.6 * Math.pow(x - 1, 3) + 1.6 * Math.pow(x - 1, 2);
      };

      const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);

        setCurrentVal(1 + (targetVal - 1) * easeOutBack(progress));
        setScaleFactor(progress >= 0.99 ? 1 : 0.85 + progress * 0.15);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [multiplier, loading]);

  return (
    <div className="relative w-72 h-72 flex items-center justify-center transition-all duration-500">
      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-radar-sweep {
          animation: radar-sweep 2s linear infinite;
        }
        @keyframes plane-hover-3d {
          0%, 100% { transform: rotateX(15deg) rotateY(-10deg) translateY(0px); }
          50% { transform: rotateX(15deg) rotateY(5deg) translateY(3px); }
        }
        .animate-plane-hover-3d {
          animation: plane-hover-3d 3s ease-in-out infinite;
        }
        @keyframes propeller-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-propeller-rotate {
          animation: propeller-rotate 0.15s linear infinite;
          transform-origin: center;
        }
        @keyframes multiplier-popup {
          0% { transform: scale(0.5) rotateX(45deg); opacity: 0; filter: blur(15px); }
          100% { transform: scale(1) rotateX(0deg); opacity: 1; filter: blur(0px); }
        }
        .animate-multiplier-popup {
          animation: multiplier-popup 0.7s cubic-bezier(0.17, 0.84, 0.44, 1) forwards;
        }
        .perspective-500 {
          perspective: 500px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
      `}</style>

      {/* Target concentric grids */}
      <div className="absolute inset-4 rounded-full border border-green-500/20" />
      <div className="absolute inset-8 rounded-full border border-white/10" />
      <div className="absolute inset-16 rounded-full border border-white/5" />

      {/* Radar sweep indicator */}
      {loading && (
        <div className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 270deg at 50% 50%, #16a34a 0deg, transparent 60deg)'
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-1/2 bg-green-600 shadow-[0_0_20px_rgba(34,197,94,1)]">
            {/* Spinning tactical 3D plane riding the radar sweep */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 scale-75">
              <div className="perspective-500 transform-style-3d inline-block">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-12 h-12 text-green-500 animate-plane-hover-3d transform-style-3d overflow-visible"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g className="transform-style-3d">
                    <path
                      d="M21 16.5L14 12 L21 7.5V16.5ZM3 12L10 16.5V7.5L3 12ZM12 12L12 2L10 10L12 12ZM12 12L12 22L14 14L12 12Z"
                    />
                    <g transform="translate(12, 2)">
                      <rect
                        x="-4"
                        y="-0.5"
                        width="8"
                        height="1"
                        fill="white"
                        opacity="0.9"
                        className="animate-propeller-rotate"
                      />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multiplier readout or loading signal */}
      <div className="relative z-10 flex flex-col items-center">
        {loading ? (
          <div className="animate-pulse text-green-500 font-black tracking-[0.3em] text-[10px] uppercase font-mono">
            {labels.calculating}
          </div>
        ) : (
          <div
            style={{ transform: `scale(${scaleFactor})` }}
            className="animate-multiplier-popup font-black flex items-baseline"
          >
            <span className="text-6xl text-white drop-shadow-[0_0_20px_rgba(34,197,94,0.8)] font-mono italic">
              {currentVal.toFixed(2)}
            </span>
            <span className="text-2xl text-green-500 ml-1 italic font-black">X</span>
          </div>
        )}
      </div>

      {/* Crosshair coordinate markers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-8 w-[1px] bg-gradient-to-t from-green-600 to-transparent shadow-[0_0_10px_#16a34a]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-8 w-[1px] bg-gradient-to-b from-green-600 to-transparent shadow-[0_0_10px_#16a34a]" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-gradient-to-l from-green-600 to-transparent shadow-[0_0_10px_#16a34a]" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-gradient-to-r from-green-600 to-transparent shadow-[0_0_10px_#16a34a]" />
    </div>
  );
}
