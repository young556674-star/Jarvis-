import React, { useMemo } from 'react';
import { JarvisState } from '../types';
import { ArcReactor } from './ArcReactor';

interface IronManHologramProps {
  state: JarvisState;
  amplitude: number; // 0 to 1
  onReactorClick?: () => void;
}

export const IronManHologram: React.FC<IronManHologramProps> = ({
  state,
  amplitude,
  onReactorClick,
}) => {
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isError = state === 'error';

  // Eye intensity
  const eyeColor = isError ? '#ff2a55' : '#00f0ff';
  const eyeGlow = isSpeaking
    ? `drop-shadow(0 0 ${12 + amplitude * 18}px rgba(0, 240, 255, 0.95))`
    : isListening
    ? 'drop-shadow(0 0 16px rgba(0, 240, 255, 0.9))'
    : isProcessing
    ? 'drop-shadow(0 0 18px rgba(255, 255, 255, 1))'
    : 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.65))';

  // Jaw displacement for speaking animation
  // Moves down by up to 14px dynamically when speaking!
  const jawY = isSpeaking ? amplitude * 12 : 0;

  // Mouth equalizer bars inside the mouth cavity during speech
  const mouthBars = useMemo(() => {
    return Array.from({ length: 9 }).map((_, i) => {
      const height = isSpeaking
        ? Math.max(3, Math.min(22, Math.sin(i * 0.8 + Date.now() / 80) * 12 * amplitude + amplitude * 18))
        : 2;
      return height;
    });
  }, [isSpeaking, amplitude]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4 py-2 select-none">
      {/* Background Hologram Ambient Glow Cone */}
      <div
        className={`absolute top-1/4 w-80 h-80 rounded-full pointer-events-none transition-all duration-500 ${
          isSpeaking
            ? 'bg-cyan-500/15 blur-3xl scale-125'
            : isListening
            ? 'bg-cyan-400/20 blur-3xl scale-110'
            : isProcessing
            ? 'bg-blue-400/25 blur-3xl scale-120 animate-pulse'
            : isError
            ? 'bg-red-500/20 blur-3xl'
            : 'bg-cyan-500/10 blur-3xl scale-95'
        }`}
      />

      {/* Cybernetic HUD Target Reticle Rings Around Head */}
      <div className="absolute top-6 w-72 h-72 border border-cyan-500/15 rounded-full pointer-events-none animate-spin-slow" />
      <div className="absolute top-10 w-64 h-64 border border-dashed border-cyan-500/20 rounded-full pointer-events-none animate-spin-reverse-slow" />

      {/* Telemetry Lateral Equalizer Bars (Left & Right) */}
      <div className="absolute left-2 sm:left-6 top-24 hidden md:flex flex-col gap-1.5 opacity-60">
        <span className="text-[10px] text-cyan-400/80 font-mono tracking-wider">AUDIO IN</span>
        {Array.from({ length: 8 }).map((_, i) => {
          const w = isListening || isSpeaking ? Math.min(48, Math.max(8, amplitude * 50 + (i % 3) * 6)) : 10;
          return (
            <div
              key={i}
              className="h-1 bg-cyan-400 transition-all duration-75 rounded-xs"
              style={{ width: `${w}px` }}
            />
          );
        })}
      </div>

      <div className="absolute right-2 sm:right-6 top-24 hidden md:flex flex-col items-end gap-1.5 opacity-60">
        <span className="text-[10px] text-cyan-400/80 font-mono tracking-wider">NEURAL LINK</span>
        {Array.from({ length: 8 }).map((_, i) => {
          const w = isSpeaking || isProcessing ? Math.min(48, Math.max(8, amplitude * 45 + ((7 - i) % 3) * 7)) : 12;
          return (
            <div
              key={i}
              className="h-1 bg-cyan-400 transition-all duration-75 rounded-xs"
              style={{ width: `${w}px` }}
            />
          );
        })}
      </div>

      {/* MAIN IRON MAN HOLOGRAPHIC BLUEPRINT SVG (Accurately modelled from reference image) */}
      <div className="relative w-full max-w-[380px] sm:max-w-[440px] aspect-[360/520]">
        <svg
          viewBox="0 0 360 520"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Hologram Cyan Glow Filter */}
            <filter id="holoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Crimson Accent Glow Filter */}
            <filter id="crimsonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* High intensity Eye Glow */}
            <filter id="eyeIntenseGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            <linearGradient id="eyeGradRed" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#ff2a55" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>

          {/* ------------------------------------------------------------- */}
          {/* A. TORSO & CHEST ARMOR PLATING (Cyan wireframes with red accents) */}
          {/* ------------------------------------------------------------- */}
          <g id="torso-armor" filter="url(#holoGlow)">
            {/* Outer Shoulder Armor Arcs */}
            <path
              d="M 50 250 L 15 260 L 5 300 L 40 330 L 75 310"
              fill="none"
              stroke="#00d2ff"
              strokeWidth="2"
              strokeOpacity="0.85"
            />
            <path
              d="M 310 250 L 345 260 L 355 300 L 320 330 L 285 310"
              fill="none"
              stroke="#00d2ff"
              strokeWidth="2"
              strokeOpacity="0.85"
            />

            {/* Shoulder Ball Joints */}
            <circle cx="32" cy="305" r="7" fill="none" stroke="#00f0ff" strokeWidth="2" />
            <circle cx="32" cy="305" r="3" fill="#00f0ff" />
            <circle cx="328" cy="305" r="7" fill="none" stroke="#00f0ff" strokeWidth="2" />
            <circle cx="328" cy="305" r="3" fill="#00f0ff" />

            {/* Main Pectoral Armor Left */}
            <path
              d="M 80 280 L 140 280 L 160 320 L 130 400 L 70 380 L 50 330 Z"
              fill="#020d1a"
              fillOpacity="0.6"
              stroke="#00f0ff"
              strokeWidth="2"
            />
            {/* Pectoral Armor Right */}
            <path
              d="M 280 280 L 220 280 L 200 320 L 230 400 L 290 380 L 310 330 Z"
              fill="#020d1a"
              fillOpacity="0.6"
              stroke="#00f0ff"
              strokeWidth="2"
            />

            {/* Chest Center Bevel Angles framing the Arc Reactor */}
            <path
              d="M 140 280 L 180 305 L 220 280"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2"
            />
            <path
              d="M 125 350 L 145 375 L 145 425 L 180 445 L 215 425 L 215 375 L 235 350"
              fill="none"
              stroke="#00d2ff"
              strokeWidth="1.8"
            />

            {/* Clavicle Ridge Lines */}
            <line x1="80" y1="260" x2="135" y2="270" stroke="#00d2ff" strokeWidth="2" />
            <line x1="280" y1="260" x2="225" y2="270" stroke="#00d2ff" strokeWidth="2" />
          </g>

          {/* ------------------------------------------------------------- */}
          {/* B. CRIMSON / RED POWER CONDUITS & HYDRAULIC ACCENTS (as in image) */}
          {/* ------------------------------------------------------------- */}
          <g id="crimson-accents" filter="url(#crimsonGlow)">
            {/* Neck Hydraulic Y-Link */}
            <path
              d="M 125 240 L 145 255 L 175 255 L 180 270 L 185 255 L 215 255 L 235 240"
              fill="none"
              stroke="#ff2a55"
              strokeWidth="2.5"
            />
            {/* Center Neck Vertical Channel */}
            <line x1="180" y1="270" x2="180" y2="295" stroke="#ff2a55" strokeWidth="3" />
            <rect x="176" y="278" width="8" height="10" fill="#ff2a55" rx="1" />

            {/* Neck Support Nodes */}
            <circle cx="130" cy="245" r="3.5" fill="#ff2a55" />
            <circle cx="230" cy="245" r="3.5" fill="#ff2a55" />
            <circle cx="150" cy="255" r="3" fill="#ff2a55" />
            <circle cx="210" cy="255" r="3" fill="#ff2a55" />

            {/* Lower Rib Conduits */}
            <path
              d="M 55 370 L 65 410 L 85 415"
              fill="none"
              stroke="#ff2a55"
              strokeWidth="2"
            />
            <path
              d="M 305 370 L 295 410 L 275 415"
              fill="none"
              stroke="#ff2a55"
              strokeWidth="2"
            />
            <circle cx="65" cy="410" r="2.5" fill="#ff2a55" />
            <circle cx="295" cy="410" r="2.5" fill="#ff2a55" />

            {/* Chest Arc Reactor Outer Crimson Bracket Rings */}
            <path
              d="M 135 405 C 150 435 210 435 225 405"
              fill="none"
              stroke="#ff2a55"
              strokeWidth="2"
            />
          </g>

          {/* ------------------------------------------------------------- */}
          {/* C. IRON MAN HELMET - STATIC HEAD, BROW, AND EYES */}
          {/* ------------------------------------------------------------- */}
          <g id="helmet-upper" filter="url(#holoGlow)">
            {/* Outer Helmet Dome Contour */}
            <path
              d="M 125 50 
                 C 130 35, 230 35, 235 50
                 L 250 85
                 L 255 140
                 L 245 170
                 L 225 210
                 L 135 210
                 L 115 170
                 L 105 140
                 L 110 85
                 Z"
              fill="#030b18"
              fillOpacity="0.75"
              stroke="#00f0ff"
              strokeWidth="2.5"
            />

            {/* Forehead Hexagonal Plate & Inset Seams */}
            <path
              d="M 155 45 L 165 75 L 195 75 L 205 45"
              fill="none"
              stroke="#00d2ff"
              strokeWidth="2"
            />
            <line x1="165" y1="75" x2="165" y2="105" stroke="#00d2ff" strokeWidth="1.5" />
            <line x1="195" y1="75" x2="195" y2="105" stroke="#00d2ff" strokeWidth="1.5" />
            <line x1="180" y1="45" x2="180" y2="75" stroke="#00d2ff" strokeWidth="1" strokeDasharray="3 3" />

            {/* Temporal / Brow Browline */}
            <path
              d="M 115 110 L 140 105 L 180 120 L 220 105 L 245 110"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2.5"
            />

            {/* Ear Cylinders / Prow Pivots */}
            <rect x="98" y="115" width="8" height="28" rx="2" fill="#011224" stroke="#00f0ff" strokeWidth="1.8" />
            <line x1="102" y1="120" x2="102" y2="138" stroke="#00f0ff" strokeWidth="1" />
            <rect x="254" y="115" width="8" height="28" rx="2" fill="#011224" stroke="#00f0ff" strokeWidth="1.8" />
            <line x1="258" y1="120" x2="258" y2="138" stroke="#00f0ff" strokeWidth="1" />

            {/* Cheekbone Outer Angles */}
            <path
              d="M 112 145 L 130 150 L 145 140 L 150 160"
              fill="none"
              stroke="#00d2ff"
              strokeWidth="2"
            />
            <path
              d="M 248 145 L 230 150 L 215 140 L 210 160"
              fill="none"
              stroke="#00d2ff"
              strokeWidth="2"
            />

            {/* Nose Bridge Contour */}
            <polygon
              points="175,125 185,125 187,145 180,150 173,145"
              fill="#021528"
              stroke="#00f0ff"
              strokeWidth="1.6"
            />

            {/* ------------------------------------------------------- */}
            {/* ICONIC GLOWING CYAN EYES */}
            {/* ------------------------------------------------------- */}
            {/* Left Eye */}
            <polygon
              points="126,128 162,130 166,138 132,137"
              fill={isError ? 'url(#eyeGradRed)' : 'url(#eyeGrad)'}
              stroke={eyeColor}
              strokeWidth="1.8"
              filter="url(#eyeIntenseGlow)"
              style={{ filter: eyeGlow, transition: 'all 0.15s ease-out' }}
            />
            {/* Right Eye */}
            <polygon
              points="234,128 198,130 194,138 228,137"
              fill={isError ? 'url(#eyeGradRed)' : 'url(#eyeGrad)'}
              stroke={eyeColor}
              strokeWidth="1.8"
              filter="url(#eyeIntenseGlow)"
              style={{ filter: eyeGlow, transition: 'all 0.15s ease-out' }}
            />

            {/* Eye Pupil / High-frequency Laser Beam Core */}
            <line x1="130" y1="133" x2="160" y2="134" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="230" y1="133" x2="200" y2="134" stroke="#ffffff" strokeWidth="1.5" />
          </g>

          {/* ------------------------------------------------------------- */}
          {/* D. ARTICULATED LOWER JAW / MOUTH VISOR (ANIMATES WITH SPEECH!) */}
          {/* Translates downwards dynamically with audio amplitude */}
          {/* ------------------------------------------------------------- */}
          <g
            id="articulated-jaw"
            filter="url(#holoGlow)"
            style={{
              transform: `translateY(${jawY}px)`,
              transition: isSpeaking ? 'transform 0.05s ease-out' : 'transform 0.25s ease-in-out',
            }}
          >
            {/* Upper Jaw Seam */}
            <path
              d="M 148 168 L 165 174 L 195 174 L 212 168"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2.2"
            />

            {/* Mouth Aperture / Slit with Dynamic Voice Waveform Equalizer */}
            <rect
              x="152"
              y="173"
              width="56"
              height={isSpeaking ? Math.max(4, 3 + amplitude * 12) : 3}
              rx="1.5"
              fill="#01101e"
              stroke="#00f0ff"
              strokeWidth="1.2"
            />

            {/* Inside Mouth: Audio-reactive Voice Equalizer Bars during speech */}
            {isSpeaking && (
              <g transform="translate(154, 174)">
                {mouthBars.map((barH, i) => (
                  <rect
                    key={i}
                    x={i * 6}
                    y={Math.max(0, 1 - barH / 4)}
                    width="4"
                    height={barH / 2}
                    fill="#38bdf8"
                    rx="0.5"
                  />
                ))}
              </g>
            )}

            {/* Lower Mouth / Chin Contour */}
            <path
              d="M 145 176 
                 L 155 198 
                 L 170 206 
                 L 190 206 
                 L 205 198 
                 L 215 176
                 L 195 180
                 L 165 180
                 Z"
              fill="#020e1d"
              stroke="#00f0ff"
              strokeWidth="2.2"
            />

            {/* Chin Accent Lines */}
            <line x1="170" y1="192" x2="190" y2="192" stroke="#00d2ff" strokeWidth="1.8" />
            <line x1="174" y1="198" x2="186" y2="198" stroke="#00d2ff" strokeWidth="1.5" />
            <line x1="180" y1="184" x2="180" y2="190" stroke="#00d2ff" strokeWidth="1.2" />
          </g>

          {/* ------------------------------------------------------------- */}
          {/* E. HUD SCANLINE ANIMATION OVER HELMET */}
          {/* ------------------------------------------------------------- */}
          <line
            x1="100"
            y1="50"
            x2="260"
            y2="50"
            stroke="rgba(0, 240, 255, 0.45)"
            strokeWidth="2"
            filter="url(#holoGlow)"
            className="animate-scan"
          />
        </svg>

        {/* ------------------------------------------------------------- */}
        {/* F. ARC REACTOR AT CENTER CHEST (Exactly positioned over chest) */}
        {/* ------------------------------------------------------------- */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-[14px] cursor-pointer group"
          onClick={onReactorClick}
          title="Stark Arc Reactor Core (Click for Diagnostics)"
        >
          <ArcReactor state={state} amplitude={amplitude} size={150} />
        </div>
      </div>

      {/* Holographic HUD Status Badge */}
      <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-black/60 border border-cyan-500/30 rounded-sm backdrop-blur-md">
        <span
          className={`w-2 h-2 rounded-full ${
            isSpeaking
              ? 'bg-cyan-400 animate-ping'
              : isListening
              ? 'bg-cyan-300 animate-pulse'
              : isProcessing
              ? 'bg-blue-400 animate-bounce'
              : isError
              ? 'bg-red-500'
              : 'bg-cyan-500/80'
          }`}
        />
        <span className="text-xs font-mono tracking-widest text-cyan-300 font-semibold uppercase">
          {state === 'idle' && 'SYSTEM STATUS: NOMINAL // J.A.R.V.I.S. READY'}
          {state === 'listening' && 'LISTENING TO VOCAL TRANSMISSION...'}
          {state === 'processing' && 'SYNTHESIZING PROTOCOL DIRECTIVE...'}
          {state === 'speaking' && 'TRANSMITTING VOCAL SYNTHESIS...'}
          {state === 'error' && 'NEURAL LATENCY ANOMALY DETECTED'}
        </span>
      </div>
    </div>
  );
};
