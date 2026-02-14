
import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, X, Volume2, Loader2, Sparkles } from 'lucide-react';

interface LiveVoiceSessionProps {
  onClose: () => void;
}

export const LiveVoiceSession: React.FC<LiveVoiceSessionProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [transcription, setTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  useEffect(() => {
    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = outputCtx;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setIsConnecting(false);
              setIsActive(true);
              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ 
                    media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
                  });
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.outputTranscription) {
                setTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
              }
              if (message.serverContent?.turnComplete) setTranscription('');

              const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioData) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const buffer = await decodeAudioData(decode(audioData), outputCtx);
                const source = outputCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(outputCtx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onclose: () => setIsActive(false),
            onerror: (e) => console.error("Live API Error:", e)
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            systemInstruction: "You are a friendly NexusAI voice assistant. Be conversational, concise, and helpful.",
            outputAudioTranscription: {}
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Failed to start Live session", err);
        onClose();
      }
    };

    startSession();

    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-950/80 backdrop-blur-xl p-6">
      <div className="bg-white/10 border border-white/20 rounded-3xl w-full max-w-lg p-10 flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="relative">
          <div className={`w-32 h-32 rounded-full bg-indigo-500/20 flex items-center justify-center transition-all duration-500 ${isActive ? 'scale-110 shadow-[0_0_50px_rgba(99,102,241,0.5)]' : ''}`}>
             {isConnecting ? <Loader2 className="w-12 h-12 text-white animate-spin" /> : <Mic className={`w-12 h-12 ${isActive ? 'text-indigo-400' : 'text-white/30'}`} />}
          </div>
          {isActive && (
            <div className="absolute inset-0 rounded-full border-4 border-indigo-400/30 animate-ping" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isConnecting ? 'Initializing Voice...' : isActive ? 'Listening...' : 'Connecting...'}
          </h2>
          <p className="text-indigo-200/70 text-sm">Have a natural conversation with NexusAI</p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[100px] flex items-center justify-center italic text-white/60 text-sm">
          {transcription || "..."}
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="px-8 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-full font-bold transition-all border border-rose-500/20 flex items-center gap-2">
            <MicOff className="w-4 h-4" /> End Session
          </button>
        </div>
      </div>
    </div>
  );
};
