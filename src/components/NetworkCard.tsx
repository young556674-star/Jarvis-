import React from 'react';

export const NetworkCard: React.FC = () => {
  return (
    <div className="hud-corner-bracket p-3.5 bg-[#020a16]/80 border border-cyan-500/30 rounded-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-3">
        <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold">
          SYSTEM // <span className="text-cyan-200">NETWORK</span>
        </span>
        <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
          UP-LINK: 5GB/S
        </span>
      </div>

      {/* Rotating Radar / Encrypted Satellite Array */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Outer dashed rotating ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/40 animate-spin-slow" />
          {/* Inner ring */}
          <div className="absolute inset-2.5 rounded-full border border-cyan-400/50" />
          {/* Crosshairs */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500/20" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500/20" />
          {/* Signal bars */}
          <div className="flex items-end gap-1 z-10">
            <div className="w-1 h-2 bg-cyan-400 rounded-2xs" />
            <div className="w-1 h-3.5 bg-cyan-400 rounded-2xs" />
            <div className="w-1 h-5 bg-cyan-400 rounded-2xs" />
            <div className="w-1 h-6.5 bg-cyan-400 rounded-2xs" />
          </div>
          {/* Radar sweep beam */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 to-transparent pointer-events-none animate-radar-sweep" />
        </div>

        <div className="mt-2 text-center font-mono">
          <div className="text-[10px] tracking-widest text-cyan-200 font-bold">SIGNAL ENCRYPTED</div>
          <div className="text-[9px] text-cyan-400/60 tracking-wider">STARK-SAT-4</div>
        </div>
      </div>
    </div>
  );
};
