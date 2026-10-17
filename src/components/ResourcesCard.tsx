import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Database } from 'lucide-react';

export const ResourcesCard: React.FC = () => {
  const [cpu, setCpu] = useState(24);
  const [mem, setMem] = useState(12.4);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(Math.floor(22 + Math.random() * 6));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-corner-bracket p-3.5 bg-[#020a16]/80 border border-cyan-500/30 rounded-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-3">
        <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold">
          SYSTEM // <span className="text-cyan-200">SYSTEM RESOURCES</span>
        </span>
        <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
          RT-MONITOR
        </span>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {/* CPU Load */}
        <div>
          <div className="flex items-center justify-between mb-1 text-[11px]">
            <span className="flex items-center gap-1.5 text-cyan-400/80">
              <Cpu className="w-3 h-3 text-cyan-400" /> CPU Load
            </span>
            <span className="font-bold text-cyan-200">{cpu}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#010814] border border-cyan-500/30 rounded-2xs overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-500 shadow-[0_0_8px_rgba(0,240,255,0.8)]"
              style={{ width: `${cpu}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div>
          <div className="flex items-center justify-between mb-1 text-[11px]">
            <span className="flex items-center gap-1.5 text-cyan-400/80">
              <Database className="w-3 h-3 text-cyan-400" /> Memory
            </span>
            <span className="font-bold text-cyan-200">{mem} GB</span>
          </div>
          <div className="w-full h-1.5 bg-[#010814] border border-cyan-500/30 rounded-2xs overflow-hidden">
            <div
              className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]"
              style={{ width: '42%' }}
            />
          </div>
        </div>

        {/* Storage */}
        <div>
          <div className="flex items-center justify-between mb-1 text-[11px]">
            <span className="flex items-center gap-1.5 text-cyan-400/80">
              <HardDrive className="w-3 h-3 text-cyan-400" /> Storage
            </span>
            <span className="font-bold text-cyan-200">89%</span>
          </div>
          <div className="w-full h-1.5 bg-[#010814] border border-cyan-500/30 rounded-2xs overflow-hidden">
            <div
              className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]"
              style={{ width: '89%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
