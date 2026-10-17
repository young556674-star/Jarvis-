import React from 'react';
import { JarvisState } from '../types';

interface ArcReactorOrbProps {
  state: JarvisState;
  amplitude: number; // 0 to 1
  onClick?: () => void;
}

export const ArcReactorOrb: React.FC<ArcReactorOrbProps> = ({
  state,
  amplitude,
  onClick,
}) => {
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';
  const isError = state === 'error';

  // Dynamic scale based on state and speech audio amplitude
  const coreScale = 1 + (isSpeaking ? amplitude * 0.16 : isListening ? 0.05 + amplitude * 0.1 : 0);
  const glowSpread = isSpeaking
    ? 30 + amplitude * 50
    : isListening
    ? 35 + amplitude * 25
    : isProcessing
    ? 45
    : 25;

  const getSubtext = () => {
    switch (state) {
      case 'listening':
        return 'LISTENING';
      case 'processing':
        return 'THINKING';
      case 'speaking':
        return 'TRANSMITTING';
      case 'error':
        return 'ANOMALY';
      default:
        return 'ACTIVE NODE';
    }
  };

  return (
    <div className="relative flex items-center justify-center select-none w-[340px] sm:w-[420px] aspect-square">
      {/* 1. Subtle Radial Ambient Lighting behind orb */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
          isError
            ? 'bg-red-500/15 blur-3xl'
            : isProcessing
            ? 'bg-cyan-400/30 blur-3xl animate-pulse'
            : isSpeaking
            ? 'bg-cyan-400/25 blur-3xl'
            : isListening
            ? 'bg-cyan-300/30 blur-3xl'
            : 'bg-cyan-500/10 blur-3xl'
        }`}
      />

      {/* 2. Concentric Orbital Rings (Matching Reference Image Exactly) */}
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
      >
        <defs>
          <filter id="orbRingGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outermost Orbit Ring with 3 Dashed Arc Accents in Top-Right Quadrant */}
        <g
          className={
            isProcessing
              ? 'animate-spin duration-3000'
              : isSpeaking
              ? 'animate-spin-slow duration-10000'
              : 'animate-spin-slow'
          }
          style={{ transformOrigin: '200px 200px' }}
        >
          {/* Main outer thin circle */}
          <circle
            cx="200"
            cy="200"
            r="165"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="1.2"
            strokeOpacity="0.4"
            strokeDasharray="450 150"
          />

          {/* 3 distinct bright cyan dashed arc tick marks in the upper-right (as seen in image) */}
          <path
            d="M 315 90 A 165 165 0 0 1 350 140"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="14 14"
            filter="url(#orbRingGlow)"
          />
        </g>

        {/* Middle Orbit Ring with Arc Gap */}
        <g
          className={
            isProcessing
              ? 'animate-spin-reverse-slow duration-2000'
              : 'animate-spin-reverse-slow'
          }
          style={{ transformOrigin: '200px 200px' }}
        >
          <circle
            cx="200"
            cy="200"
            r="125"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="1.4"
            strokeOpacity="0.65"
            strokeDasharray="500 120"
            filter="url(#orbRingGlow)"
          />
        </g>

        {/* Innermost subtle orbit line */}
        <circle
          cx="200"
          cy="200"
          r="95"
          fill="none"
          stroke="#00d2ff"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* Subtle crosshair tick marks at cardinal positions */}
        <line x1="200" y1="25" x2="200" y2="35" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="200" y1="365" x2="200" y2="375" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="25" y1="200" x2="35" y2="200" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="365" y1="200" x2="375" y2="200" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />
      </svg>

      {/* Ripple Rings when Processing or Speaking */}
      {(isProcessing || isSpeaking || isListening) && (
        <div
          className="absolute rounded-full border border-cyan-400 pointer-events-none animate-ping opacity-35"
          style={{
            width: '180px',
            height: '180px',
            animationDuration: isProcessing ? '1.2s' : isSpeaking ? '1.6s' : '2.4s',
          }}
        />
      )}

      {/* 3. The Central Glowing Solid Arc-Reactor Orb (As in Reference Image) */}
      <div
        onClick={onClick}
        className="relative z-10 w-[140px] sm:w-[155px] aspect-square rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform duration-100 ease-out group"
        style={{
          transform: `scale(${coreScale})`,
          background: isError
            ? 'radial-gradient(circle at 50% 45%, #ff4d6d 0%, #ff2a55 55%, #991b1b 100%)'
            : 'radial-gradient(circle at 50% 45%, #e0fcff 0%, #00f0ff 40%, #00b4d8 75%, #0077b6 100%)',
          boxShadow: isError
            ? `0 0 ${glowSpread}px rgba(255, 42, 85, 0.9), inset 0 0 15px rgba(255, 255, 255, 0.7)`
            : `0 0 ${glowSpread}px rgba(0, 240, 255, 0.95), 0 0 ${glowSpread * 2}px rgba(0, 240, 255, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.8)`,
        }}
        title="J.A.R.V.I.S. Core (Click for Systems Check)"
      >
        {/* Minimal Cyan Plus Icon '+' Above Orb (From Reference Image) */}
        <div className="absolute -top-4 text-cyan-300 font-bold text-sm tracking-tighter opacity-80 pointer-events-none">
          +
        </div>

        {/* Center Typography */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className="font-['Rajdhani',sans-serif] text-xl sm:text-2xl font-black tracking-[0.25em] text-[#02182b] select-none uppercase drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]">
            JARVIS
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.3em] text-[#032b49] font-bold uppercase select-none opacity-90 mt-0.5">
            {getSubtext()}
          </span>
        </div>

        {/* Subtle glossy glass reflection overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-black/20 pointer-events-none" />
      </div>
    </div>
  );
};
