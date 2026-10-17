/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IronManHologram } from './components/IronManHologram';
import { SlideOutDashboard } from './components/SlideOutDashboard';
import { JarvisState, JarvisDataStore } from './types';
import { fetchJarvisData, sendJarvisCommand, requestJarvisTts } from './services/api';
import { useAuth } from './firebase/AuthContext';
import {
  subscribeToUserData,
  addFirestoreCalendarEvent,
  addFirestoreTask,
  addFirestoreReminder,
  addFirestoreMemory,
} from './firebase/firestoreService';
import { playStarkStartupSound, playStarkPowerDownSound } from './services/soundEffects';

const initialStore: JarvisDataStore = {
  calendar: [],
  tasks: [],
  projects: [],
  reminders: [],
  memories: [],
  systemStats: {
    coreTemperature: '48.2 °C',
    reactorOutput: '10.84 GJ/s',
    suitEfficiency: '99.4%',
    defenseGrid: 'ONLINE',
    neuroLinkLatency: '1.2 ms',
  },
};

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signOutUser } = useAuth();

  // Persistent initial mode: 'active' or 'sleeping'
  const [jarvisState, setJarvisState] = useState<JarvisState>(() => {
    const saved = localStorage.getItem('jarvis_mode');
    return saved === 'sleeping' ? 'sleeping' : 'idle';
  });

  const [wakingStage, setWakingStage] = useState<number>(0);
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(true);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const [amplitude, setAmplitude] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [dataStore, setDataStore] = useState<JarvisDataStore>(initialStore);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [jarvisSpeech, setJarvisSpeech] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [timeStr, setTimeStr] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showEdgeRipple, setShowEdgeRipple] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Audio & Speech references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const synthTimerRef = useRef<any>(null);

  // Recognition references
  const recognitionRef = useRef<any>(null);
  const wakeRecognizerRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const isWakingRef = useRef<boolean>(false);
  const wakeTimeoutRef = useRef<any>(null);

  // Keep state ref in sync for event handlers
  const stateRef = useRef<JarvisState>(jarvisState);
  useEffect(() => {
    stateRef.current = jarvisState;
    if (jarvisState === 'sleeping') {
      localStorage.setItem('jarvis_mode', 'sleeping');
    } else if (jarvisState !== 'waking') {
      localStorage.setItem('jarvis_mode', 'active');
    }
  }, [jarvisState]);

  // Digital Clock
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

  // Initial Data Load
  const loadData = useCallback(async () => {
    try {
      const data = await fetchJarvisData();
      setDataStore(data);
    } catch {
      // offline fallback
    }
  }, []);

  // Real-Time Firebase Firestore Synchronization
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToUserData(
        user.uid,
        (updater) => {
          setDataStore(updater);
        },
        initialStore
      );
      return () => unsubscribe();
    } else {
      loadData();
    }
  }, [user, loadData]);

  // Check speech recognition capability
  useEffect(() => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechSupported(false);
    }
  }, []);

  // Mic audio analysis
  const startMicAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicPermissionDenied(false);

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
    } catch {
      setMicPermissionDenied(true);
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
  const speakResponse = async (textToSpeak: string, nextState: JarvisState = 'listening') => {
    if (isMuted || !textToSpeak) {
      setJarvisState(nextState);
      return;
    }

    setJarvisState('speaking');

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
          // State Machine: SPEAKING -> LISTENING
          setJarvisState(nextState);
          if (nextState === 'listening') {
            startListeningForCommand();
          }
        };

        source.start();
        analyzePlayback();
        return;
      }
    } catch {
      // fallback to browser synthesis
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
        // State Machine: SPEAKING -> LISTENING
        setJarvisState(nextState);
        if (nextState === 'listening') {
          startListeningForCommand();
        }
      };

      utterance.onerror = () => {
        stopSpeechAudio();
        setJarvisState(nextState);
        if (nextState === 'listening') {
          startListeningForCommand();
        }
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setJarvisState(nextState);
        if (nextState === 'listening') {
          startListeningForCommand();
        }
      }, 2500);
    }
  };

  // Start active voice command listening
  const startListeningForCommand = () => {
    stopSpeechAudio();
    if (stateRef.current === 'sleeping' || stateRef.current === 'processing' || stateRef.current === 'speaking') return;

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }

    const recognizer = new SpeechRec();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';

    recognizer.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setJarvisState('listening');
      startMicAudioAnalysis();
    };

    recognizer.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      if (event.results[current].isFinal) {
        stopMicAudioAnalysis();
        isListeningRef.current = false;
        setIsListening(false);

        // Visual and haptic feedback signal when valid voice command received
        if (navigator.vibrate) {
          try {
            navigator.vibrate(50);
          } catch (_) {}
        }
        setShowEdgeRipple(true);
        setTimeout(() => setShowEdgeRipple(false), 700);

        handleExecuteCommand(transcript);
      }
    };

    recognizer.onerror = () => {
      stopMicAudioAnalysis();
      isListeningRef.current = false;
      setIsListening(false);
      if (stateRef.current === 'listening' || stateRef.current === 'idle') {
        setTimeout(() => {
          if (stateRef.current === 'idle' || stateRef.current === 'listening') {
            startListeningForCommand();
          }
        }, 1000);
      }
    };

    recognizer.onend = () => {
      stopMicAudioAnalysis();
      isListeningRef.current = false;
      setIsListening(false);
      if (stateRef.current === 'listening' || stateRef.current === 'idle') {
        setTimeout(() => {
          if (stateRef.current === 'idle' || stateRef.current === 'listening') {
            startListeningForCommand();
          }
        }, 500);
      }
    };

    recognitionRef.current = recognizer;
    try {
      recognizer.start();
    } catch {
      // ignore
    }
  };

  // Auto-listen when idle
  useEffect(() => {
    if (jarvisState === 'idle') {
      const timer = setTimeout(() => {
        if (stateRef.current === 'idle') {
          startListeningForCommand();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [jarvisState]);

  // Stop active listening
  const stopActiveListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    stopMicAudioAnalysis();
  };

  // Put JARVIS into Sleep Mode
  const goToSleep = useCallback((announce = false) => {
    stopActiveListening();
    stopSpeechAudio();
    if (wakeTimeoutRef.current) {
      clearTimeout(wakeTimeoutRef.current);
      wakeTimeoutRef.current = null;
    }
    isWakingRef.current = false;
    setWakingStage(0);
    setAmplitude(0);
    setLastTranscript('');
    setJarvisSpeech('');

    if (announce) {
      playStarkPowerDownSound();
    }
    setJarvisState('sleeping');
  }, [stopSpeechAudio]);

  // Cinematic Wake-Up Sequence
  const triggerWakeUp = useCallback(() => {
    if (isWakingRef.current) return;
    isWakingRef.current = true;

    if (wakeRecognizerRef.current) {
      try {
        wakeRecognizerRef.current.abort();
      } catch (_) {}
      wakeRecognizerRef.current = null;
    }

    setJarvisState('waking');
    setWakingStage(1);
    playStarkStartupSound();

    setTimeout(() => setWakingStage(2), 800);
    setTimeout(() => setWakingStage(3), 1600);
    setTimeout(() => setWakingStage(4), 2400);
    setTimeout(() => setWakingStage(5), 3200);

    const t5 = setTimeout(async () => {
      isWakingRef.current = false;
      setJarvisSpeech('At your service, Sir.');
      await speakResponse('At your service, Sir.', 'listening');
    }, 3700);

    wakeTimeoutRef.current = t5;
  }, [speakResponse]);

  // Background Wake Word Detection ("Hey Jarvis")
  useEffect(() => {
    if (jarvisState !== 'sleeping' || !wakeWordEnabled || isWakingRef.current) {
      if (wakeRecognizerRef.current) {
        try {
          wakeRecognizerRef.current.abort();
        } catch (_) {}
        wakeRecognizerRef.current = null;
      }
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechSupported(false);
      return;
    }

    let active = true;
    const recognizer = new SpeechRec();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';

    recognizer.onresult = (event: any) => {
      if (!active || isWakingRef.current) return;
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const text = event.results[i][0].transcript.toLowerCase();
        if (
          text.includes('hey jarvis') ||
          text.includes('jarvis') ||
          text.includes('wake up') ||
          text.includes('hello jarvis')
        ) {
          active = false;
          try {
            recognizer.abort();
          } catch (_) {}
          triggerWakeUp();
          break;
        }
      }
    };

    recognizer.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setMicPermissionDenied(true);
      }
    };

    recognizer.onend = () => {
      if (active && stateRef.current === 'sleeping' && !isWakingRef.current) {
        try {
          recognizer.start();
        } catch {
          setTimeout(() => {
            if (active && stateRef.current === 'sleeping' && !isWakingRef.current) {
              try {
                recognizer.start();
              } catch (_) {}
            }
          }, 1000);
        }
      }
    };

    wakeRecognizerRef.current = recognizer;
    try {
      recognizer.start();
    } catch {
      // ignore
    }

    return () => {
      active = false;
      try {
        recognizer.abort();
      } catch (_) {}
      wakeRecognizerRef.current = null;
    };
  }, [jarvisState, wakeWordEnabled, triggerWakeUp]);

  // Central Command Execution
  const handleExecuteCommand = async (command: string): Promise<string | void> => {
    stopSpeechAudio();
    setLastTranscript(command);

    const lowerCmd = command.toLowerCase().trim();
    if (
      lowerCmd.includes('go to sleep') ||
      lowerCmd.includes('sleep mode') ||
      lowerCmd === 'sleep' ||
      lowerCmd.includes('power down') ||
      lowerCmd.includes('shut down') ||
      lowerCmd.includes('goodnight jarvis')
    ) {
      setJarvisSpeech('Entering sleep mode. Standby subroutines engaged.');
      await speakResponse('Entering sleep mode. Standby subroutines engaged.', 'sleeping');
      goToSleep(true);
      return;
    }

    setJarvisState('processing');

    try {
      const result = await sendJarvisCommand(command, user?.uid, dataStore.memories);

      if (user && result.executedTool?.result) {
        const { name: toolName, result: toolRes } = result.executedTool;
        if (toolName === 'remember_information' && toolRes.memory) {
          addFirestoreMemory(user.uid, toolRes.memory).catch(console.error);
        } else if (toolName === 'schedule_calendar_event' && toolRes.event) {
          addFirestoreCalendarEvent(user.uid, toolRes.event).catch(console.error);
        } else if (toolName === 'add_task' && toolRes.task) {
          addFirestoreTask(user.uid, toolRes.task).catch(console.error);
        } else if (toolName === 'add_reminder' && toolRes.reminder) {
          addFirestoreReminder(user.uid, toolRes.reminder).catch(console.error);
        }
      }

      if (result.store && !user) {
        setDataStore(result.store);
      }
      setJarvisSpeech(result.text);

      await speakResponse(result.text, 'listening');

      setTimeout(() => {
        setLastTranscript('');
        setJarvisSpeech('');
      }, 12000);

      return result.text;
    } catch {
      const fallbackText = 'I encountered a minor computational latency, Sir. All subroutines remain online.';
      setJarvisSpeech(fallbackText);
      setJarvisState('error');
      setTimeout(() => setJarvisState('idle'), 3000);
      return fallbackText;
    }
  };

  const isSleeping = jarvisState === 'sleeping';
  const isWaking = jarvisState === 'waking';

  return (
    <main
      className={`relative w-screen h-screen overflow-hidden transition-colors duration-1000 ${
        isSleeping ? 'bg-black' : 'bg-[#020610]'
      } text-cyan-400 font-['Rajdhani',sans-serif] flex flex-col justify-between select-none`}
    >
      {showEdgeRipple && (
        <div className="absolute inset-0 pointer-events-none z-50 border-2 border-cyan-400 animate-edge-ripple" />
      )}

      {!isSleeping && (
        <>
          <div className="absolute inset-0 hud-grid-bg opacity-25 pointer-events-none transition-opacity duration-1000" />
          <div className="absolute inset-0 hud-dots-bg opacity-15 pointer-events-none transition-opacity duration-1000" />
          <div className="absolute inset-0 hud-scanline opacity-25 pointer-events-none transition-opacity duration-1000" />

          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/40 pointer-events-none" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/40 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400/40 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400/40 pointer-events-none" />
        </>
      )}

      {/* CENTERPIECE: IRON MAN FACE & ARC REACTOR */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative z-10 w-full overflow-hidden my-auto py-2 cursor-pointer select-none"
        onClick={() => {
          if (isSleeping) {
            triggerWakeUp();
          } else {
            goToSleep(true);
          }
        }}
      >
        <IronManHologram
          state={jarvisState}
          amplitude={amplitude}
          wakingStage={wakingStage}
          className={isListening ? 'animate-vibrate' : ''}
          onReactorClick={() => {
            if (isSleeping) {
              triggerWakeUp();
            } else {
              goToSleep(true);
            }
          }}
        />

        {!isSleeping && (lastTranscript || jarvisSpeech) && (
          <div className="mt-4 max-w-lg w-full text-center px-4 py-2 bg-[#020b18]/85 border border-cyan-500/30 rounded-xs backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            {lastTranscript && (
              <div className="text-[11px] font-mono text-cyan-400/70 truncate">
                &ldquo;{lastTranscript}&rdquo;
              </div>
            )}
            {jarvisSpeech && (
              <div className="text-xs sm:text-sm font-sans tracking-wide text-cyan-100 mt-0.5">
                {jarvisSpeech}
              </div>
            )}
          </div>
        )}
      </div>

      <SlideOutDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        data={dataStore}
        onRefreshData={loadData}
      />
    </main>
  );
}
