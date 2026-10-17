/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TopNav } from './components/TopNav';
import { BiometricsCard } from './components/BiometricsCard';
import { ResourcesCard } from './components/ResourcesCard';
import { NetworkCard } from './components/NetworkCard';
import { ArmorStatusCard } from './components/ArmorStatusCard';
import { SystemLogsCard, LogEntry } from './components/SystemLogsCard';
import { TerminalCard } from './components/TerminalCard';
import { CenterDisplay } from './components/CenterDisplay';
import { SlideOutDashboard } from './components/SlideOutDashboard';
import { JarvisState, JarvisDataStore } from './types';
import { fetchJarvisData, sendJarvisCommand, requestJarvisTts } from './services/api';

const initialStore: JarvisDataStore = {
  calendar: [],
  tasks: [],
  projects: [],
  reminders: [],
  systemStats: {
    coreTemperature: '48.2 °C',
    reactorOutput: '10.84 GJ/s',
    suitEfficiency: '99.4%',
    defenseGrid: 'ONLINE',
    neuroLinkLatency: '1.2 ms',
  },
};

const initialLogs: LogEntry[] = [
  { time: '12:45:01', text: 'SYSTEM INTEGRITY CHECK COMPLETE', level: 'info' },
  { time: '12:45:12', text: 'BIO-SYNC STABLE AT 98.4%', level: 'success' },
  { time: '12:45:22', text: 'ARC REACTOR OUTPUT OPTIMAL', level: 'info' },
  { time: '12:45:34', text: 'SAT-LINK ESTABLISHED (STARK-7)', level: 'info' },
  { time: '12:45:45', text: 'AWAITING USER INPUT...', level: 'info' },
  { time: '12:46:02', text: 'NEURAL MAPPING RECALIBRATED', level: 'info' },
  { time: '12:46:15', text: 'DEFENSE PERIMETER ACTIVE', level: 'success' },
];

export default function App() {
  const [jarvisState, setJarvisState] = useState<JarvisState>('idle');
  const [amplitude, setAmplitude] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [dataStore, setDataStore] = useState<JarvisDataStore>(initialStore);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [jarvisSpeech, setJarvisSpeech] = useState<string>('');
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>(initialLogs);
  const [terminalHistory, setTerminalHistory] = useState<Array<{ command: string; output: string }>>([
    {
      command: 'jarvis --analyze --current-environment',
      output: 'Analyzing... All sectors nominal. 0 hostiles detected in immediate perimeter.',
    },
  ]);

  // Audio & Speech references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const synthTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);

  // Helper to add system log
  const addLog = useCallback((text: string, level: 'info' | 'warn' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setSystemLogs((prev) => [...prev.slice(-25), { time, text, level }]);
  }, []);

  // Initial Data Load
  const loadData = useCallback(async () => {
    try {
      const data = await fetchJarvisData();
      setDataStore(data);
    } catch (err) {
      console.warn('Notice: offline data fallback:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onstart = () => {
        isListeningRef.current = true;
        setJarvisState('listening');
        addLog('VOCAL FREQUENCY ACQUIRED - LISTENING', 'info');
        startMicAudioAnalysis();
      };

      recognizer.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        if (event.results[current].isFinal) {
          stopMicAudioAnalysis();
          isListeningRef.current = false;
          handleExecuteCommand(transcript);
        }
      };

      recognizer.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        stopMicAudioAnalysis();
        isListeningRef.current = false;
        setJarvisState('idle');
      };

      recognizer.onend = () => {
        stopMicAudioAnalysis();
        isListeningRef.current = false;
        if (jarvisState === 'listening') {
          setJarvisState('idle');
        }
      };

      recognitionRef.current = recognizer;
    }

    return () => {
      stopMicAudioAnalysis();
      stopSpeechAudio();
    };
  }, [addLog]);

  // Mic audio waveform analysis
  const startMicAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const checkMicAmp = () => {
        if (!isListeningRef.current) return;
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const normalized = Math.min(1, avg / 120);
        setAmplitude(normalized);
        animationFrameRef.current = requestAnimationFrame(checkMicAmp);
      };
      checkMicAmp();
    } catch (err) {
      console.warn('Mic analysis notice:', err);
    }
  };

  const stopMicAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setAmplitude(0);
  };

  const stopSpeechAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (_) {}
      audioSourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setAmplitude(0);
  }, []);

  // Voice Speech Output with real mouth amplitude sync
  const speakResponse = async (textToSpeak: string) => {
    if (isMuted || !textToSpeak) {
      setJarvisState('idle');
      return;
    }

    setJarvisState('speaking');
    addLog(`TRANSMITTING SPEECH SYNTHESIS`, 'info');

    // 1. Attempt Gemini TTS from server
    try {
      const ttsData = await requestJarvisTts(textToSpeak);

      if (ttsData.audioBase64) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = audioContextRef.current || new AudioCtx();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const binaryString = atob(ttsData.audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        source.connect(analyser);
        analyser.connect(ctx.destination);
        audioSourceRef.current = source;

        const freqData = new Uint8Array(analyser.frequencyBinCount);

        const analyzePlayback = () => {
          if (!audioSourceRef.current) return;
          analyser.getByteFrequencyData(freqData);
          let sum = 0;
          for (let i = 0; i < freqData.length; i++) {
            sum += freqData[i];
          }
          const avg = sum / freqData.length;
          const amp = Math.min(1, (avg / 140) * 1.4);
          setAmplitude(amp);
          animationFrameRef.current = requestAnimationFrame(analyzePlayback);
        };

        source.onended = () => {
          stopSpeechAudio();
          setJarvisState('idle');
        };

        source.start();
        analyzePlayback();
        return;
      }
    } catch (e) {
      console.warn('TTS playback notice:', e);
    }

    // 2. Fallback: Browser Web Speech API Synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.02;
      utterance.pitch = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const ukVoice =
        voices.find((v) => v.lang.includes('en-GB') || v.name.includes('UK') || v.name.includes('British')) ||
        voices.find((v) => v.lang.includes('en'));
      if (ukVoice) utterance.voice = ukVoice;

      let tick = 0;
      synthTimerRef.current = setInterval(() => {
        tick++;
        const modulation = Math.sin(tick * 0.4) * 0.4 + Math.sin(tick * 1.1) * 0.3 + 0.45;
        const jitter = (Math.random() - 0.5) * 0.15;
        const amp = Math.max(0.1, Math.min(0.95, modulation + jitter));
        setAmplitude(amp);
      }, 70);

      utterance.onend = () => {
        stopSpeechAudio();
        setJarvisState('idle');
      };

      utterance.onerror = () => {
        stopSpeechAudio();
        setJarvisState('idle');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setJarvisState('idle'), 2500);
    }
  };

  // Central Command Execution
  const handleExecuteCommand = async (command: string): Promise<string | void> => {
    stopSpeechAudio();
    setLastTranscript(command);
    setJarvisState('processing');
    addLog(`PROCESSING DIRECTIVE: "${command}"`, 'info');

    try {
      const result = await sendJarvisCommand(command);
      if (result.store) {
        setDataStore(result.store);
      }
      setJarvisSpeech(result.text);

      // Add to terminal history
      setTerminalHistory((prev) => [
        ...prev.slice(-6),
        { command, output: result.text },
      ]);

      addLog(`DIRECTIVE EXECUTED: ${result.executedTool?.name || 'VOICE SYNTHESIS'}`, 'success');

      // Speak aloud
      await speakResponse(result.text);

      setTimeout(() => {
        setLastTranscript('');
        setJarvisSpeech('');
      }, 12000);

      return result.text;
    } catch (err: any) {
      console.error('Command processing error:', err);
      const fallbackText = "I encountered a minor computational latency, Sir. All subroutines remain online.";
      setJarvisSpeech(fallbackText);
      addLog(`COMPUTATIONAL LATENCY DETECTED`, 'warn');
      setJarvisState('error');
      setTimeout(() => setJarvisState('idle'), 3000);
      return fallbackText;
    }
  };

  // Toggle Mic
  const handleMicToggle = () => {
    if (jarvisState === 'listening') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      isListeningRef.current = false;
      stopMicAudioAnalysis();
      setJarvisState('idle');
      addLog('VOCAL RECOGNITION STANDBY', 'info');
    } else {
      stopSpeechAudio();
      if (!recognitionRef.current) {
        addLog('MICROPHONE RECOGNITION NOT SUPPORTED', 'warn');
        return;
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        try {
          recognitionRef.current.abort();
          setTimeout(() => recognitionRef.current.start(), 150);
        } catch (_) {}
      }
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#010712] text-cyan-400 font-['Rajdhani',sans-serif] flex flex-col justify-between select-none">
      {/* Background Holographic Atmosphere & Grid */}
      <div className="absolute inset-0 hud-grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 hud-dots-bg opacity-20 pointer-events-none" />
      <div className="absolute inset-0 hud-scanline opacity-30 pointer-events-none" />

      {/* TOP NAVIGATION BAR */}
      <TopNav
        state={jarvisState}
        remindersCount={dataStore.reminders.length}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
      />

      {/* 3-COLUMN COCKPIT HUD (EXACT SCREENSHOT LAYOUT) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden relative z-10">
        {/* LEFT COLUMN: Biometrics, Resources, Network (3 cols on desktop) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col justify-between gap-3 h-full overflow-hidden">
          <BiometricsCard />
          <ResourcesCard />
          <NetworkCard />
        </div>

        {/* CENTER COLUMN: Central Radar Core, Arc Target, Soundwaves & Awaiting Command pill (6 cols) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col items-center justify-center h-full relative overflow-hidden">
          <CenterDisplay
            state={jarvisState}
            amplitude={amplitude}
            onMicClick={handleMicToggle}
            lastTranscript={lastTranscript}
            jarvisSpeech={jarvisSpeech}
            onReactorClick={() => handleExecuteCommand('Arc reactor telemetry and suit status report')}
          />
        </div>

        {/* RIGHT COLUMN: Armor Status, System Logs, Terminal (3 cols on desktop) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col justify-between gap-3 h-full overflow-hidden">
          <ArmorStatusCard onActionClick={(msg) => addLog(msg, 'info')} />
          <SystemLogsCard logs={systemLogs} />
          <TerminalCard
            onExecuteCommand={handleExecuteCommand}
            terminalHistory={terminalHistory}
          />
        </div>
      </div>

      {/* MOBILE HUD DRAWER CARDS TOGGLE (For smaller viewports) */}
      <div className="lg:hidden flex items-center justify-around py-2 px-3 bg-[#010916] border-t border-cyan-500/20 text-xs font-mono">
        <button
          onClick={() => setIsDashboardOpen(true)}
          className="text-cyan-300 font-bold px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-xs"
        >
          OPEN DASHBOARD (CALENDAR & TASKS)
        </button>
      </div>

      {/* SLIDE-OUT DASHBOARD DRAWER (Calendar, To-do List, Work/Projects, Reminders, Home) */}
      <SlideOutDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        data={dataStore}
        onRefreshData={loadData}
      />
    </main>
  );
}
