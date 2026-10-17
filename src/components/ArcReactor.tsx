import React from 'react';
import { JarvisState } from '../types';

interface ArcReactorProps {
  state: JarvisState;
  amplitude: number; // 0 to 1
  size?: number; // diameter in px
}

export const ArcReactor: React.FC<ArcReactorProps> = ({ state, amplitude, size = 180 }) => {
  // Determine dynamic glow and scaling based on state and amplitude
  const isSpeaking = state === 'speaking';
  const isProcessing = state === 'processing';
  const isListening = state === 'listening';
  const isError = state === 'error';

  // Dynamic scale
  const scale = 1 + (isSpeaking ? amplitude * 0.18 : isListening ? amplitude * 0.12 : 0);
  const coreBrightness = isError
    ? '#ff2a55'
    : isProcessing
    ? '#ffffff'
    : isSpeaking
    ? `rgba(0, 240, 255, ${0.85 + amplitude * 0.15})`
    : '#00f0ff';

  // Number of coil teeth
  const coilCount = 10;
  const coils = Array.from({ length: coilCount });

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{
        width: size,
        height: size,
        transform: `scale(${scale})`,
        transition: 'transform 0.08s ease-out',
      }}
    >
      {/* Outer Glow Halo */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 pointer-events-none ${
          isError
            ? 'bg-red-500/20 blur-2xl'
            : isProcessing
            ? 'bg-cyan-400/40 blur-3xl animate-pulse'
            : isSpeaking
            ? 'bg-cyan-400/35 blur-2xl'
            : isListening
            ? 'bg-cyan-500/25 blur-xl'
            : 'bg-cyan-500/15 blur-lg'
        }`}
      />

      {/* SVG Arc Reactor Elements */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full relative z-10 overflow-visible"
      >
        <defs>
          <filter id="reactorGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="coreIntenseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="reactorCoreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%" stopColor="#a5f3fc" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#00d2ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
          </radialGradient>

          <radialGradient id="reactorCoreRedGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="50%" stopColor="#ff2a55" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#991b1b" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* 1. Outermost Bezel Ring */}
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="none"
          stroke={isError ? '#ff2a55' : '#00f0ff'}
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeDasharray="4 6"
        />

        {/* 2. Outer Rotating Telemetry Ring */}
        <g
          className={`origin-center ${
            isProcessing
              ? 'animate-spin duration-1000'
              : isSpeaking
              ? 'animate-spin-slow duration-7000'
              : 'animate-spin-slow'
          }`}
          style={{ transformOrigin: '100px 100px' }}
        >
          <circle
            cx="100"
            cy="100"
            r="86"
            fill="none"
            stroke={isError ? '#ff2a55' : '#00f0ff'}
            strokeWidth="2"
            strokeOpacity="0.75"
            filter="url(#reactorGlow)"
          />
          {/* Tick Marks along outer perimeter */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const r1 = i % 3 === 0 ? 80 : 83;
            const r2 = 86;
            const x1 = 100 + r1 * Math.cos(angle);
            const y1 = 100 + r1 * Math.sin(angle);
            const x2 = 100 + r2 * Math.cos(angle);
            const y2 = 100 + r2 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isError ? '#ff2a55' : '#38bdf8'}
                strokeWidth={i % 3 === 0 ? 1.8 : 1}
                strokeOpacity={i % 3 === 0 ? 0.9 : 0.5}
              />
            );
          })}
        </g>

        {/* 3. The 10 Magnetic Confinement Coils (Iconic Arc Reactor Notch Teeth) */}
        <g className="origin-center" style={{ transformOrigin: '100px 100px' }}>
          {coils.map((_, i) => {
            const angleDeg = (i * 360) / coilCount;
            return (
              <g
                key={i}
                transform={`rotate(${angleDeg} 100 100)`}
                filter="url(#reactorGlow)"
              >
                {/* Coil Mount / Block */}
                <rect
                  x="93"
                  y="24"
                  width="14"
                  height="22"
                  rx="2"
                  fill="#031628"
                  stroke={isError ? '#ff2a55' : '#00f0ff'}
                  strokeWidth="1.6"
                />
                {/* Copper/Cyan winding lines inside coil */}
                <line x1="94" y1="28" x2="106" y2="28" stroke={isError ? '#ff8899' : '#a5f3fc'} strokeWidth="1" strokeOpacity="0.9" />
                <line x1="94" y1="32" x2="106" y2="32" stroke={isError ? '#ff8899' : '#a5f3fc'} strokeWidth="1" strokeOpacity="0.9" />
                <line x1="94" y1="36" x2="106" y2="36" stroke={isError ? '#ff8899' : '#a5f3fc'} strokeWidth="1" strokeOpacity="0.9" />
                <line x1="94" y1="40" x2="106" y2="40" stroke={isError ? '#ff8899' : '#a5f3fc'} strokeWidth="1" strokeOpacity="0.9" />
                {/* Mini power node */}
                <circle cx="100" cy="21" r="2" fill={coreBrightness} />
              </g>
            );
          })}
        </g>

        {/* 4. Intermediate Housing Ring with counter-rotation */}
        <g
          className={`origin-center ${
            isProcessing
              ? 'animate-spin-reverse-slow duration-700'
              : 'animate-spin-reverse-slow'
          }`}
          style={{ transformOrigin: '100px 100px' }}
        >
          <circle
            cx="100"
            cy="100"
            r="54"
            fill="none"
            stroke={isError ? '#ff2a55' : '#00d2ff'}
            strokeWidth="3"
            strokeDasharray="18 10"
            strokeOpacity="0.9"
            filter="url(#reactorGlow)"
          />
          {/* Inner turbine segments */}
          {Array.from({ length: 8 }).map((_, i) => {
            const rot = i * 45;
            return (
              <line
                key={i}
                x1="100"
                y1="56"
                x2="100"
                y2="66"
                stroke={isError ? '#ff2a55' : '#67e8f9'}
                strokeWidth="2.5"
                transform={`rotate(${rot} 100 100)`}
              />
            );
          })}
        </g>

        {/* 5. Inner Confinement Ring */}
        <circle
          cx="100"
          cy="100"
          r="42"
          fill="none"
          stroke={isError ? '#ff2a55' : '#38bdf8'}
          strokeWidth="2"
          strokeOpacity="0.9"
        />

        {/* 6. Glowing Palladium / Nanotech Core Iris */}
        <circle
          cx="100"
          cy="100"
          r={28 + (isSpeaking ? amplitude * 8 : isProcessing ? 5 : 0)}
          fill={`url(#${isError ? 'reactorCoreRedGrad' : 'reactorCoreGrad'})`}
          filter="url(#coreIntenseGlow)"
          className="transition-all duration-75"
        />

        {/* Concentric Center Circles */}
        <circle
          cx="100"
          cy="100"
          r="16"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeOpacity="0.95"
        />

        <circle
          cx="100"
          cy="100"
          r="8"
          fill="#ffffff"
          filter="url(#reactorGlow)"
        />

        {/* Central Pure White Dot */}
        <circle
          cx="100"
          cy="100"
          r="3.5"
          fill="#ffffff"
        />
      </svg>

      {/* Dynamic Soundwave Rings radiating on voice or speech */}
      {(isSpeaking || isListening) && (
        <div
          className="absolute inset-0 rounded-full border border-cyan-400 pointer-events-none animate-ping opacity-40"
          style={{ animationDuration: isSpeaking ? '1.2s' : '1.8s' }}
        />
      )}
    </div>
  );
};
