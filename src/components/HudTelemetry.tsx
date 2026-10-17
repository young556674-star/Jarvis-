import React, { useState, useEffect } from 'react';
import { Menu, Volume2, VolumeX, Square, Shield, Zap, Cpu, Radio } from 'lucide-react';
import { JarvisState, SystemStats } from '../types';

interface HudTelemetryProps {
  stats: SystemStats;
  state: JarvisState;
  isMuted: boolean;
  onToggleMute: () => void;
  onStopSpeaking: () => void;
  onOpenDashboard: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export const HudTelemetry: React.FC<HudTelemetryProps> = ({
  stats,
  state,
  isMuted,
  onToggleMute,
  onStopSpeaking,
  onOpenDashboard,
  onSelectPrompt,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }).toUpperCase()
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const samplePrompts = [
    'Schedule meeting tomorrow at 3 PM',
    'Add finish my assignment to my tasks',
    'What is on my calendar today?',
    'Mark my first task complete',
    'Arc reactor status and diagnostics',
  ];

  return (
    <>
      {/* TOP BAR / HEADER */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3 bg-gradient-to-b from-[#020610]/90 to-transparent backdrop-blur-xs select-none">
        {/* Top-Left: Stark Telemetry */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-cyan-400/50 flex items-center justify-center bg-cyan-950/30 text-cyan-400 font-extrabold tracking-tighter text-xs">
            STARK
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-['Orbitron',sans-serif] text-sm sm:text-base font-bold tracking-widest text-cyan-300">
                J.A.R.V.I.S.
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-mono">
                MK-LXXXV
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-cyan-400/70">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" /> {stats.reactorOutput || '10.84 GJ/s'}
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" /> {stats.coreTemperature || '48.2 °C'}
              </span>
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" /> ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right: Time & Dashboard Trigger */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="text-right hidden sm:block font-mono">
            <div className="text-sm font-semibold tracking-wider text-cyan-200">{timeStr}</div>
            <div className="text-[10px] text-cyan-400/60 tracking-wider">{dateStr}</div>
          </div>

          {/* Slide-out Dashboard Trigger Button */}
          <button
            onClick={onOpenDashboard}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-400/40 hover:border-cyan-400 text-cyan-300 rounded-sm transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)] group"
            title="Open Mission Dashboard (Calendar, Tasks, Projects, Reminders)"
          >
            <Menu className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono tracking-widest uppercase hidden md:inline">
              DASHBOARD
            </span>
          </button>
        </div>
      </header>

      {/* BOTTOM-LEFT: Audio & Control Toggles */}
      <div className="absolute bottom-20 sm:bottom-6 left-4 z-20 flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-sm border transition-all duration-200 cursor-pointer ${
            isMuted
              ? 'bg-red-950/40 border-red-500/50 text-red-400 hover:bg-red-900/50'
              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400'
          }`}
          title={isMuted ? 'Unmute JARVIS Voice' : 'Mute JARVIS Voice'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {state === 'speaking' && (
          <button
            onClick={onStopSpeaking}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-950/60 border border-red-500/60 text-red-300 rounded-sm hover:bg-red-900/80 transition-all cursor-pointer font-mono text-xs animate-pulse"
            title="Silence speech output"
          >
            <Square className="w-3.5 h-3.5 fill-red-400" />
            <span>HALT SPEECH</span>
          </button>
        )}
      </div>

      {/* BOTTOM-RIGHT: Discrete Command Suggestions */}
      <div className="absolute bottom-20 sm:bottom-6 right-4 z-20 hidden lg:flex flex-col items-end gap-1.5 pointer-events-auto">
        <div className="text-[10px] font-mono tracking-wider text-cyan-400/50 uppercase">
          TACTICAL DIRECTIVE SAMPLES:
        </div>
        <div className="flex flex-col items-end gap-1">
          {samplePrompts.slice(0, 3).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(prompt)}
              className="text-xs font-mono px-2 py-1 bg-cyan-950/20 hover:bg-cyan-900/40 border border-cyan-500/20 hover:border-cyan-400/60 text-cyan-400/80 hover:text-cyan-200 transition-all duration-150 cursor-pointer rounded-xs"
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
