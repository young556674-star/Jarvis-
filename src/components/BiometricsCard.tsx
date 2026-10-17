import React, { useState, useEffect } from 'react';

export const BiometricsCard: React.FC = () => {
  const [bpm, setBpm] = useState(72);
  const [temp, setTemp] = useState('98.6 °F');

  // Subtle natural fluctuation for realism
  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(Math.floor(70 + Math.random() * 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-corner-bracket p-3.5 bg-[#020a16]/80 border border-cyan-500/30 rounded-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-3">
        <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold">
          SYSTEM // <span className="text-cyan-200">BIOMETRICS</span>
        </span>
        <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
          VITAL SIGNS
        </span>
      </div>

      {/* Heart Rate Display with EKG waveform */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] font-mono text-cyan-400/60 uppercase">Heart Rate</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-cyan-100 tracking-tight">{bpm}</span>
            <span className="text-[10px] font-mono text-cyan-400/70">BPM</span>
          </div>
        </div>

        {/* EKG Pulse Graph SVG */}
        <div className="w-24 h-9 overflow-hidden relative">
          <svg viewBox="0 0 100 40" className="w-full h-full">
            <path
              d="M 0 20 L 25 20 L 32 10 L 38 32 L 44 2 L 50 28 L 56 16 L 62 20 L 100 20"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_4px_rgba(0,240,255,0.8)]"
            />
          </svg>
        </div>
      </div>

      {/* Histogram Frequency Bar Equalizer */}
      <div className="flex items-end justify-between h-9 gap-1 mb-3 px-1 bg-[#010814] border border-cyan-500/20 py-1 rounded-xs">
        {[40, 65, 30, 80, 55, 90, 75, 45, 60, 85, 35, 70, 50, 95, 60, 40].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-cyan-400/80 rounded-2xs transition-all duration-300"
            style={{
              height: `${Math.min(100, Math.max(15, h + (i % 2 === 0 ? 10 : -10)))}%`,
            }}
          />
        ))}
      </div>

      {/* Bottom Sub-Metrics: Body Temp & Neural Link */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2 bg-[#010814] border border-cyan-500/20 rounded-xs">
          <div className="text-[9px] text-cyan-400/60 uppercase">Body Temp</div>
          <div className="text-sm font-bold text-cyan-200 mt-0.5">{temp}</div>
        </div>
        <div className="p-2 bg-[#010814] border border-cyan-500/20 rounded-xs">
          <div className="text-[9px] text-cyan-400/60 uppercase">Neural Link</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
};
