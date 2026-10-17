import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { JarvisState } from '../types';
import { requestJarvisTts } from '../services/api';

interface VoiceControlsProps {
  state: JarvisState;
  setState: (s: JarvisState) => void;
  isMuted: boolean;
  onSendCommand: (command: string) => Promise<string | void>;
  onAmplitudeChange: (amplitude: number) => void;
  lastTranscript: string;
  jarvisSpeech: string;
  onClearSpeech: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  state,
  setState,
  isMuted,
  onSendCommand,
  onAmplitudeChange,
  lastTranscript,
  jarvisSpeech,
  onClearSpeech,
}) => {
  const [textInput, setTextInput] = useState('');
  const [micSupported, setMicSupported] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Recognition ref
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Audio Context and Playback refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const synthTimerRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';

    recognizer.onstart = () => {
      isListeningRef.current = true;
      setState('listening');
      setPermissionError(null);
      startMicAudioAnalysis();
    };

    recognizer.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      if (event.results[current].isFinal) {
        stopMicAudioAnalysis();
        isListeningRef.current = false;
        handleCommand(transcript);
      }
    };

    recognizer.onerror = (event: any) => {
      console.warn('Speech recognition event:', event.error);
      stopMicAudioAnalysis();
      isListeningRef.current = false;
      if (event.error === 'not-allowed') {
        setPermissionError('Microphone permission denied. Enable mic in browser settings.');
      }
      setState('idle');
    };

    recognizer.onend = () => {
      stopMicAudioAnalysis();
      isListeningRef.current = false;
      if (state === 'listening') {
        setState('idle');
      }
    };

    recognitionRef.current = recognizer;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      stopMicAudioAnalysis();
      stopSpeechAudio();
    };
  }, []);

  // Microphone audio visualizer analysis (reactive to user voice)
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
        onAmplitudeChange(normalized);
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
    onAmplitudeChange(0);
  };

  // Toggle Listening
  const toggleListening = () => {
    if (state === 'listening') {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      isListeningRef.current = false;
      stopMicAudioAnalysis();
      setState('idle');
    } else {
      stopSpeechAudio();
      if (!micSupported) {
        setPermissionError('Speech Recognition is not supported in this browser. Use typed directive.');
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

  // Stop any ongoing speech
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
    onAmplitudeChange(0);
  }, [onAmplitudeChange]);

  // Play synthetic voice with real mouth synchronization
  const speakResponse = async (textToSpeak: string) => {
    if (isMuted || !textToSpeak) {
      setState('idle');
      return;
    }

    setState('speaking');

    // 1. Attempt Gemini TTS from server
    try {
      const ttsData = await requestJarvisTts(textToSpeak);

      if (ttsData.audioBase64) {
        // Play base64 WAV with Web Audio API for exact amplitude synchronization
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = audioContextRef.current || new AudioCtx();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Decode base64 to ArrayBuffer
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
          onAmplitudeChange(amp);
          animationFrameRef.current = requestAnimationFrame(analyzePlayback);
        };

        source.onended = () => {
          stopSpeechAudio();
          setState('idle');
        };

        source.start();
        analyzePlayback();
        return;
      }
    } catch (e) {
      console.warn('TTS playback note, falling back to browser synthesis:', e);
    }

    // 2. Fallback: Browser Web Speech API Synthesis with dynamic amplitude generator
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.02;
      utterance.pitch = 0.95; // Slightly deeper, refined British tone

      // Select British or English voice if available
      const voices = window.speechSynthesis.getVoices();
      const ukVoice =
        voices.find((v) => v.lang.includes('en-GB') || v.name.includes('UK') || v.name.includes('British')) ||
        voices.find((v) => v.lang.includes('en'));
      if (ukVoice) utterance.voice = ukVoice;

      let tick = 0;
      synthTimerRef.current = setInterval(() => {
        tick++;
        // Natural speech modulation rhythm with pauses and phoneme peaks
        const modulation = Math.sin(tick * 0.4) * 0.4 + Math.sin(tick * 1.1) * 0.3 + 0.45;
        const jitter = (Math.random() - 0.5) * 0.15;
        const amp = Math.max(0.1, Math.min(0.95, modulation + jitter));
        onAmplitudeChange(amp);
      }, 70);

      utterance.onend = () => {
        stopSpeechAudio();
        setState('idle');
      };

      utterance.onerror = () => {
        stopSpeechAudio();
        setState('idle');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // If neither is available, show text and transition to idle
      setTimeout(() => setState('idle'), 2500);
    }
  };

  // Dispatch Command Execution
  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    stopSpeechAudio();
    setState('processing');

    try {
      const response = await onSendCommand(trimmed);
      if (response) {
        await speakResponse(response);
      } else {
        setState('idle');
      }
    } catch (err: any) {
      console.error('Command failed:', err);
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || state === 'processing') return;
    const cmd = textInput;
    setTextInput('');
    handleCommand(cmd);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 z-20 flex flex-col items-center">
      {/* Short Holographic Transcript Overlay (Discreet & Minimal, Auto-Fading) */}
      {(lastTranscript || jarvisSpeech) && (
        <div className="mb-4 max-w-lg w-full text-center px-4 py-2 bg-[#020d1c]/80 border border-cyan-500/30 rounded-sm backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-opacity duration-300">
          {lastTranscript && (
            <div className="text-xs font-mono text-cyan-400/70 truncate">
              <span className="text-cyan-200 uppercase font-semibold">Sir:</span> &ldquo;{lastTranscript}&rdquo;
            </div>
          )}
          {jarvisSpeech && (
            <div className="text-sm font-sans tracking-wide text-cyan-200 mt-0.5">
              <span className="text-cyan-400 font-mono font-bold mr-1.5 text-xs">J.A.R.V.I.S.:</span>
              {jarvisSpeech}
            </div>
          )}
        </div>
      )}

      {/* Permission Notice if mic is blocked */}
      {permissionError && (
        <div className="mb-2 text-xs font-mono text-red-400 bg-red-950/60 border border-red-500/40 px-3 py-1 rounded-sm text-center">
          {permissionError}
        </div>
      )}

      {/* Center Voice Mic Control & Minimal HUD Command Bar */}
      <div className="flex items-center gap-3 w-full justify-center">
        {/* Futuristic Glowing Microphone Button */}
        <div className="relative flex items-center justify-center">
          {/* Audio Resonance Rings when listening or speaking */}
          {state === 'listening' && (
            <div className="absolute -inset-2.5 rounded-full border border-cyan-400/60 animate-ping opacity-60" />
          )}

          <button
            onClick={toggleListening}
            disabled={state === 'processing'}
            className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer shadow-lg ${
              state === 'listening'
                ? 'bg-cyan-500 text-black border-white shadow-[0_0_25px_rgba(0,240,255,0.85)] scale-110'
                : state === 'processing'
                ? 'bg-blue-950 text-cyan-400 border-cyan-400 animate-pulse'
                : state === 'speaking'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#031526] text-cyan-400 border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.5)]'
            }`}
            title={state === 'listening' ? 'Click to stop listening' : 'Click to speak to J.A.R.V.I.S.'}
          >
            {state === 'processing' ? (
              <Loader2 className="w-6 h-6 animate-spin text-cyan-300" />
            ) : state === 'listening' ? (
              <Mic className="w-6 h-6 animate-pulse" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Minimalist Command Input Field (Single-line HUD, No Chat Bloat) */}
        <form
          onSubmit={handleFormSubmit}
          className="flex-1 flex items-center bg-[#020d1a]/90 border border-cyan-500/40 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(0,240,255,0.25)] rounded-sm px-3 py-1.5 transition-all"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={
              state === 'listening'
                ? 'Transmitting speech input...'
                : state === 'processing'
                ? 'J.A.R.V.I.S. computing directive...'
                : 'Speak or enter directive (e.g. Schedule meeting tomorrow at 3 PM)...'
            }
            disabled={state === 'processing'}
            className="w-full bg-transparent text-sm text-cyan-200 placeholder-cyan-500/40 focus:outline-hidden font-sans"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || state === 'processing'}
            className="ml-2 text-cyan-400 hover:text-cyan-200 disabled:opacity-30 disabled:hover:text-cyan-400 transition-colors cursor-pointer"
            title="Transmit Directive"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
