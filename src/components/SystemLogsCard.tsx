import React, { useRef, useEffect } from 'react';

export interface LogEntry {
  time: string;
  text: string;
  level?: 'info' | 'warn' | 'success';
}

interface SystemLogsCardProps {
  logs: LogEntry[];
}

export const SystemLogsCard: React.FC<SystemLogsCardProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="hud-corner-bracket-tr p-3.5 bg-[#020a16]/80 border border-cyan-500/30 rounded-xs select-none flex flex-col h-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-2">
        <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold">
          SYSTEM // <span className="text-cyan-200">SYSTEM LOGS</span>
        </span>
        <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
          RT-LOG
        </span>
      </div>

      {/* Log Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 font-mono text-[10px] pr-1 leading-relaxed"
      >
        {logs.map((log, index) => (
          <div key={index} className="flex items-start gap-1.5">
            <span className="text-cyan-500/50 shrink-0 font-semibold">[{log.time}]</span>
            <span
              className={
                log.level === 'warn'
                  ? 'text-red-400'
                  : log.level === 'success'
                  ? 'text-emerald-300'
                  : 'text-cyan-300/90'
              }
            >
              {log.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
