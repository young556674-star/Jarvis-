import React, { useState } from 'react';
import { Shield, Zap, Radio, Power } from 'lucide-react';

interface ArmorStatusCardProps {
  onActionClick?: (action: string) => void;
}

export const ArmorStatusCard: React.FC<ArmorStatusCardProps> = ({ onActionClick }) => {
  const [shieldActive, setShieldActive] = useState(true);
  const [repulsorActive, setRepulsorActive] = useState(true);
  const [sensorsActive, setSensorsActive] = useState(true);
  const [powerActive, setPowerActive] = useState(true);

  return (
    <div className="hud-corner-bracket-tr p-3.5 bg-[#020a16]/80 border border-cyan-500/30 rounded-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-3">
        <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold">
          SYSTEM // <span className="text-cyan-200">ARMOR STATUS</span>
        </span>
        <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
          MARK LXXXV
        </span>
      </div>

      {/* Power Core & Structural metrics */}
      <div className="space-y-3 font-mono text-xs mb-3">
        <div>
          <div className="flex items-center justify-between mb-1 text-[11px]">
            <span className="text-cyan-400/80 uppercase">POWER CORE</span>
            <span className="font-bold text-cyan-200">98%</span>
          </div>
          <div className="w-full h-1.5 bg-[#010814] border border-cyan-500/30 rounded-2xs overflow-hidden">
            <div className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]" style={{ width: '98%' }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1 text-[11px]">
            <span className="text-cyan-400/80 uppercase">STRUCTURAL</span>
            <span className="font-bold text-cyan-200">100%</span>
          </div>
          <div className="w-full h-1.5 bg-[#010814] border border-cyan-500/30 rounded-2xs overflow-hidden">
            <div className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* DEFENSE SYSTEMS: 4 Action Buttons */}
      <div>
        <div className="text-[10px] font-mono text-cyan-400/70 uppercase mb-2">
          DEFENSE SYSTEMS
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => {
              setShieldActive(!shieldActive);
              onActionClick?.(shieldActive ? 'Defensive kinetic shield deactivated' : 'Defensive kinetic shield active');
            }}
            className={`p-2 rounded-xs border flex items-center justify-center transition-all cursor-pointer ${
              shieldActive
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'bg-[#010814] border-cyan-500/20 text-cyan-500/40 hover:text-cyan-300'
            }`}
            title="Kinetic Energy Shield"
          >
            <Shield className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setRepulsorActive(!repulsorActive);
              onActionClick?.(repulsorActive ? 'Repulsor arrays set to idle' : 'Repulsor arrays armed at maximum power');
            }}
            className={`p-2 rounded-xs border flex items-center justify-center transition-all cursor-pointer ${
              repulsorActive
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'bg-[#010814] border-cyan-500/20 text-cyan-500/40 hover:text-cyan-300'
            }`}
            title="Repulsor Beam Arrays"
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setSensorsActive(!sensorsActive);
              onActionClick?.(sensorsActive ? 'Scanning sensors placed on standby' : 'Full-spectrum spatial sensor array online');
            }}
            className={`p-2 rounded-xs border flex items-center justify-center transition-all cursor-pointer ${
              sensorsActive
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'bg-[#010814] border-cyan-500/20 text-cyan-500/40 hover:text-cyan-300'
            }`}
            title="Spatial Sensor Array"
          >
            <Radio className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setPowerActive(!powerActive);
              onActionClick?.(powerActive ? 'Auxiliary power conservation mode' : 'Main power grid restored to full output');
            }}
            className={`p-2 rounded-xs border flex items-center justify-center transition-all cursor-pointer ${
              powerActive
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'bg-[#010814] border-cyan-500/20 text-cyan-500/40 hover:text-cyan-300'
            }`}
            title="Mark 85 Core Power"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
