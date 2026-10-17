import React, { useState, useEffect } from 'react';
import { Bell, Settings, Menu, ShieldAlert, Volume2, VolumeX, Check } from 'lucide-react';
import { JarvisState } from '../types';

interface TopNavProps {
  state: JarvisState;
  remindersCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenDashboard: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  state,
  remindersCount,
  isMuted,
  onToggleMute,
  onOpenDashboard,
}) => {
  const [timeStr, setTimeStr] = useState('18:40:35');
  const [showSettings, setShowSettings] = useState(false);

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
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    switch (state) {
      case 'listening':
        return 'LISTENING';
      case 'processing':
        return 'COMPUTING';
      case 'speaking':
        return 'TRANSMITTING';
      case 'error':
        return 'LATENCY ANOMALY';
      default:
        return 'OPTIMAL';
    }
  };

  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-cyan-500/20 bg-[#010712]/90 backdrop-blur-md select-none z-30">
      {/* LEFT: Diamond Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rotate-45 border border-cyan-400 bg-cyan-500/20 flex items-center justify-center shadow-[0_0_8px_rgba(0,240,255,0.6)]">
          <div className="w-2 h-2 bg-cyan-300" />
        </div>
        <div className="flex flex-col">
          <span className="font-['Orbitron',sans-serif] text-sm sm:text-base font-bold tracking-[0.25em] text-cyan-200">
            JARVIS
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-cyan-400/60 uppercase">
            JUST A RATHER VERY INTELLIGENT SYSTEM
          </span>
        </div>
      </div>

      {/* CENTER: Status & Local Time */}
      <div className="hidden md:flex items-center gap-8 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400/60 tracking-wider">SYSTEM STATUS</span>
          <span className="flex items-center gap-1.5 font-bold tracking-widest text-cyan-300">
            <span
              className={`w-2 h-2 rounded-full ${
                state === 'listening'
                  ? 'bg-cyan-300 animate-ping'
                  : state === 'speaking'
                  ? 'bg-cyan-400 animate-pulse'
                  : state === 'error'
                  ? 'bg-red-500'
                  : 'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.9)]'
              }`}
            />
            {getStatusText()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-cyan-400/60 tracking-wider">LOCAL TIME</span>
          <span className="font-bold tracking-widest text-cyan-200">{timeStr}</span>
        </div>
      </div>

      {/* RIGHT: Notifications, Settings, T. Stark profile, and Dashboard drawer trigger */}
      <div className="flex items-center gap-3">
        {/* Bell Icon with badge */}
        <button
          onClick={onOpenDashboard}
          className="relative p-1.5 text-cyan-400/70 hover:text-cyan-200 transition-colors cursor-pointer"
          title="Active Alerts & Reminders"
        >
          <Bell className="w-4 h-4" />
          {remindersCount > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          )}
        </button>

        {/* Settings Button */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-cyan-400/70 hover:text-cyan-200 transition-colors cursor-pointer"
            title="System Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-8 w-56 p-3 bg-[#020b18] border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.2)] rounded-xs z-50 font-mono text-xs space-y-2">
              <div className="text-[10px] text-cyan-400/60 uppercase border-b border-cyan-500/20 pb-1">
                AUDIO PROTOCOL
              </div>
              <button
                onClick={onToggleMute}
                className="w-full flex items-center justify-between py-1 text-cyan-300 hover:text-white cursor-pointer"
              >
                <span>VOICE SYNTHESIS:</span>
                <span className="flex items-center gap-1">
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-red-400 font-bold">MUTED</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">ACTIVE</span>
                    </>
                  )}
                </span>
              </button>
              <div className="text-[10px] text-cyan-400/40 pt-1 border-t border-cyan-500/20">
                MODEL: GEMINI-3.8-FLASH-LITE-TTS
              </div>
            </div>
          )}
        </div>

        {/* T. STARK Profile Capsule Pill */}
        <div className="flex items-center gap-2 pl-3 pr-1 py-1 border border-cyan-500/40 rounded-full bg-[#021022]/80 shadow-[0_0_12px_rgba(0,240,255,0.15)]">
          <span className="font-['Orbitron',sans-serif] text-xs font-bold tracking-widest text-cyan-200">
            T. STARK
          </span>
          <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center text-[10px] font-bold text-cyan-300">
            TS
          </div>
        </div>

        {/* Slide-out Dashboard Trigger Button */}
        <button
          onClick={onOpenDashboard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 rounded-xs text-cyan-200 text-xs font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.3)] ml-1"
          title="Open Calendar, Tasks, Projects & Reminders"
        >
          <Menu className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">DASHBOARD</span>
        </button>
      </div>
    </header>
  );
};
