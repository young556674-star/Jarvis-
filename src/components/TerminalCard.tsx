import React, { useState } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalCardProps {
  onExecuteCommand: (cmd: string) => Promise<string | void>;
  terminalHistory: Array<{ command: string; output: string }>;
}

export const TerminalCard: React.FC<TerminalCardProps> = ({
  onExecuteCommand,
  terminalHistory,
}) => {
  const [cmdInput, setCmdInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim() || isBusy) return;
    const command = cmdInput.trim();
    setCmdInput('');
    setIsBusy(true);
    await onExecuteCommand(command);
    setIsBusy(false);
  };

  return (
    <div className="hud-corner-bracket-tr p-3.5 bg-[#020a16]/90 border border-cyan-500/30 rounded-xs select-none flex flex-col h-[150px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20 mb-2">
        <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
          <TerminalIcon className="w-3 h-3 text-cyan-400" /> SYSTEM // <span className="text-cyan-200">TERMINAL</span>
        </span>
        <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
          ROOT@JARVIS
        </span>
      </div>

      {/* Terminal Output history */}
      <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[10px] leading-tight pr-1">
        {terminalHistory.map((item, i) => (
          <div key={i} className="space-y-0.5">
            <div className="text-cyan-400/90 font-semibold flex items-center gap-1">
              <span className="text-cyan-500">&gt;_</span>
              <span>{item.command}</span>
            </div>
            <div className="text-cyan-200/70 pl-3 italic">{item.output}</div>
          </div>
        ))}
      </div>

      {/* Input prompt */}
      <form onSubmit={handleSubmit} className="mt-1 pt-1 border-t border-cyan-500/20 flex items-center gap-1">
        <span className="text-cyan-400 font-mono text-xs font-bold">&gt;_</span>
        <input
          type="text"
          value={cmdInput}
          onChange={(e) => setCmdInput(e.target.value)}
          placeholder="jarvis --analyze --current-environment"
          disabled={isBusy}
          className="flex-1 bg-transparent text-cyan-200 text-xs font-mono focus:outline-hidden placeholder-cyan-500/30"
        />
      </form>
    </div>
  );
};
