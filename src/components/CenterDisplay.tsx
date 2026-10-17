import React, { useState } from 'react';
import { Mic, MicOff, Loader2, Volume2, Shield } from 'lucide-react';
import { JarvisState } from '../types';
import { ArcReactor } from './ArcReactor';
import { IronManHologram } from './IronManHologram';

interface CenterDisplayProps {
  state: JarvisState;
  amplitude: number; // 0 to 1
  onMicClick: () => void;
  lastTranscript: string;
  jarvisSpeech: string;
  onReactorClick: () => void;
}

export const CenterDisplay: React.FC<CenterDisplayProps> = ({
  state,
  amplitude,
  onMicClick,
  lastTranscript,
  jarvisSpeech,
  onReactorClick,
}) => {
  const [viewMode, setViewMode] = useState<'radar' | 'armor'>('radar');

  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isError = state === 'error';

  // Soundwave waveform bars below the core
  const waveBarsCount = 17;
  const waveBars = Array.from({ length: waveBarsCount }).map((_, i) => {
    const centerDist = Math.abs(i - Math.floor(waveBarsCount / 2));
    const factor = Math.max(0.2, 1 - centerDist * 0.1);
    if (isSpeaking) {
      return Math.max(4, Math.min(28, (amplitude * 24 + Math.sin(i * 0.9 + Date.now() / 90) * 8) * factor));
    }
    if (isListening) {
      return Math.max(4, Math.min(24, (amplitude * 20 + Math.sin(i * 1.2) * 5) * factor));
    }
    if (isProcessing) {
      return Math.max(3, Math.min(18, Math.sin(i * 0.8 + Date.now() / 150) * 8 + 10));
    }
    // Idle gentle wave
    return Math.max(3, Math.sin(i * 0.5 + Date.now() / 800) * 3 + 4);
  });

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full min-h-[460px] select-none px-2">
      {/* View Mode Toggle: Tactical Radar vs Armor Hologram */}
      <div className="absolute top-2 z-20 flex items-center gap-1.5 p-1 bg-[#010a18]/80 border border-cyan-500/30 rounded-xs font-mono text-[10px]">
        <button
          onClick={() => setViewMode('radar')}
          className={`px-2.5 py-1 rounded-2xs transition-all cursor-pointer ${
            viewMode === 'radar'
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]'
              : 'text-cyan-400/60 hover:text-cyan-300'
          }`}
        >
          CORE RADAR HUD
        </button>
        <button
          onClick={() => setViewMode('armor')}
          className={`px-2.5 py-1 rounded-2xs transition-all cursor-pointer ${
            viewMode === 'armor'
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]'
              : 'text-cyan-400/60 hover:text-cyan-300'
          }`}
        >
          MARK LXXXV HOLOGRAM
        </button>
      </div>

      {/* VIEW 1: TACTICAL RADAR HUD (From Screenshot) */}
      {viewMode === 'radar' ? (
        <div className="relative w-full max-w-[360px] sm:max-w-[420px] aspect-square flex items-center justify-center my-auto">
          {/* Radial HUD Reticle SVG */}
          <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
            <defs>
              <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Outermost Dashed Radar Ring */}
            <circle
              cx="200"
              cy="200"
              r="170"
              fill="none"
              stroke="#00d2ff"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              strokeOpacity="0.4"
              className={isProcessing ? 'animate-spin-slow duration-3000' : 'animate-spin-slow'}
              style={{ transformOrigin: '200px 200px' }}
            />

            {/* 2. Middle Radar Ring with Quadrant Ticks */}
            <circle
              cx="200"
              cy="200"
              r="135"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.8"
              strokeOpacity="0.75"
              filter="url(#radarGlow)"
            />

            {/* 3. Inner Ring */}
            <circle
              cx="200"
              cy="200"
              r="90"
              fill="none"
              stroke="#00d2ff"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />

            {/* Quadrant Crosshair lines */}
            <line x1="200" y1="20" x2="200" y2="70" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.8" />
            <line x1="200" y1="330" x2="200" y2="380" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.8" />
            <line x1="20" y1="200" x2="70" y2="200" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.8" />
            <line x1="330" y1="200" x2="380" y2="200" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.8" />

            {/* Diagonal crosshairs */}
            <line x1="75" y1="75" x2="105" y2="105" stroke="#00d2ff" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="325" y1="75" x2="295" y2="105" stroke="#00d2ff" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="75" y1="325" x2="105" y2="295" stroke="#00d2ff" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="325" y1="325" x2="295" y2="295" stroke="#00d2ff" strokeWidth="1" strokeOpacity="0.5" />

            {/* Rotating Cyan Scanner Blips (As in reference image) */}
            <g
              className="animate-radar-sweep"
              style={{ transformOrigin: '200px 200px', animationDuration: isProcessing ? '1.5s' : '4s' }}
            >
              {/* Top-Right blip */}
              <rect x="250" y="70" width="10" height="4" fill="#00f0ff" rx="1" filter="url(#radarGlow)" />
              {/* Bottom-Right blip */}
              <rect x="310" y="270" width="10" height="4" fill="#00f0ff" rx="1" filter="url(#radarGlow)" />
              {/* Scanner sweep gradient wedge */}
              <path
                d="M 200 200 L 370 200 A 170 170 0 0 0 320 80 Z"
                fill="url(#radarSweepGrad)"
                opacity="0.15"
              />
            </g>

            {/* Center Arc Reactor / CORE ACTIVE Target */}
            <g
              onClick={onReactorClick}
              className="cursor-pointer group"
              transform="translate(145, 145)"
            >
              {/* Outer square brackets */}
              <rect
                x="0"
                y="0"
                width="110"
                height="110"
                fill="#010e1e"
                fillOpacity="0.8"
                stroke="#00f0ff"
                strokeWidth="1.5"
                rx="4"
              />

              {/* 4 Corner Matrix Dots */}
              <rect x="8" y="8" width="6" height="6" fill="none" stroke="#00f0ff" strokeWidth="1.2" />
              <rect x="96" y="8" width="6" height="6" fill="none" stroke="#00f0ff" strokeWidth="1.2" />
              <rect x="8" y="96" width="6" height="6" fill="none" stroke="#00f0ff" strokeWidth="1.2" />
              <rect x="96" y="96" width="6" height="6" fill="none" stroke="#00f0ff" strokeWidth="1.2" />

              {/* Center Core Luminous Circle */}
              <circle cx="55" cy="55" r="32" fill="#021428" stroke="#00d2ff" strokeWidth="1.5" />
              <circle
                cx="55"
                cy="55"
                r={22 + (isSpeaking ? amplitude * 6 : 0)}
                fill="none"
                stroke="#00f0ff"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-spin-slow"
                style={{ transformOrigin: '55px 55px' }}
              />
              <circle
                cx="55"
                cy="55"
                r={10 + (isSpeaking ? amplitude * 4 : 0)}
                fill="#00f0ff"
                filter="url(#radarGlow)"
              />
            </g>

            <defs>
              <linearGradient id="radarSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Central Overlay Text: CORE ACTIVE */}
          <div
            onClick={onReactorClick}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-mono text-center select-none"
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="w-1.5 h-1.5 border border-cyan-400 inline-block" />
              <span className="w-1.5 h-1.5 border border-cyan-400 inline-block" />
              <span className="w-1.5 h-1.5 border border-cyan-400 inline-block" />
            </div>
            <span className="text-[11px] font-bold tracking-widest text-cyan-200">CORE</span>
            <span className="text-[10px] tracking-widest text-cyan-400 font-semibold">ACTIVE</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 border border-cyan-400 inline-block" />
              <span className="w-1.5 h-1.5 border border-cyan-400 inline-block" />
              <span className="w-1.5 h-1.5 border border-cyan-400 inline-block" />
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: IRON MAN HOLOGRAPHIC BLUEPRINT HELMET & ARC REACTOR */
        <div className="relative w-full max-w-[360px] sm:max-w-[420px] flex items-center justify-center my-auto scale-90 sm:scale-95">
          <IronManHologram
            state={state}
            amplitude={amplitude}
            onReactorClick={onReactorClick}
          />
        </div>
      )}

      {/* Holographic Spoken Transcript / Output Readout */}
      {(lastTranscript || jarvisSpeech) && (
        <div className="max-w-md w-full text-center px-4 py-2 bg-[#020b18]/90 border border-cyan-500/30 rounded-xs backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.2)] mb-3 transition-all">
          {lastTranscript && (
            <div className="text-[11px] font-mono text-cyan-400/70 truncate">
              <span className="text-cyan-200 uppercase font-semibold">Sir:</span> &ldquo;{lastTranscript}&rdquo;
            </div>
          )}
          {jarvisSpeech && (
            <div className="text-xs sm:text-sm font-sans tracking-wide text-cyan-200 mt-0.5">
              <span className="text-cyan-400 font-mono font-bold mr-1.5 text-[11px]">J.A.R.V.I.S.:</span>
              {jarvisSpeech}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Soundwave Waveform Equalizer (As in Screenshot) */}
      <div className="flex items-center justify-center gap-1 h-7 px-3 mb-3">
        {waveBars.map((barH, i) => (
          <div
            key={i}
            className="w-1 bg-cyan-400 rounded-full transition-all duration-75 shadow-[0_0_6px_rgba(0,240,255,0.7)]"
            style={{
              height: `${barH}px`,
              opacity: isSpeaking ? 1 : isListening ? 0.9 : 0.6,
            }}
          />
        ))}
      </div>

      {/* THE ICONIC VOICE BUTTON PILL: [ 🎙 AWAITING COMMAND... ] */}
      <button
        onClick={onMicClick}
        disabled={isProcessing}
        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full border transition-all duration-300 cursor-pointer font-mono text-xs tracking-wider uppercase shadow-lg ${
          isListening
            ? 'bg-cyan-500 text-black border-white shadow-[0_0_25px_rgba(0,240,255,0.9)] scale-105 font-bold animate-pulse'
            : isProcessing
            ? 'bg-[#021024] text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
            : isSpeaking
            ? 'bg-[#021024] text-cyan-300 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.6)]'
            : isError
            ? 'bg-red-950/60 text-red-300 border-red-500'
            : 'bg-[#020d1c]/90 hover:bg-[#03152d] text-cyan-300 border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]'
        }`}
        title="Toggle Microphone Listening"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
        ) : (
          <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : 'text-cyan-400'}`} />
        )}
        <span>
          {isListening
            ? 'LISTENING TO TRANSMISSION...'
            : isProcessing
            ? 'COMPUTING DIRECTIVE...'
            : isSpeaking
            ? 'TRANSMITTING VOCAL SYNTHESIS...'
            : isError
            ? 'COMMUNICATION ANOMALY'
            : 'AWAITING COMMAND...'}
        </span>
      </button>
    </div>
  );
};
