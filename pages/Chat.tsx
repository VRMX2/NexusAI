
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Loader2, User as UserIcon, Sparkles, ChevronLeft, AlertCircle, Paperclip, Image as ImageIcon, Video as VideoIcon, Mic, BrainCircuit, Globe, MapPin, ExternalLink, Volume2, X } from 'lucide-react';
import { db } from '../lib/supabase';
import { generateText, analyzeMedia, transcribeAudio, textToSpeech } from '../lib/gemini';
import { Role } from '../types';
import { LiveVoiceSession } from '../components/LiveVoiceSession';

const Chat: React.FC<{ user: any }> = ({ user }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{data: string, mimeType: string} | null>(null);
  const [userLocation, setUserLocation] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      });
    }
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const loadData = async () => {
      try {
        const projs = await db.projects.list();
        const currentProj = projs.find(p => p.id === projectId);
        if (!currentProj) { navigate('/projects'); return; }
        setProject(currentProj);
        const msgs = await db.messages.list(projectId);
        setMessages(msgs);
      } catch (err) { console.error(err); } finally { setIsInitializing(false); }
    };
    loadData();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAttachedFile({ data: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading || !projectId) return;

    const userMessage = input.trim();
    setInput('');
    const currentAttachment = attachedFile;
    setAttachedFile(null);
    setIsLoading(true);
    setError(null);

    try {
      const savedUserMsg = await db.messages.add(projectId, Role.USER, userMessage || "[Attached File]");
      setMessages(prev => [...prev, savedUserMsg]);

      let responseText = "";
      let grounding: any[] = [];

      if (currentAttachment) {
        if (currentAttachment.mimeType.startsWith('audio')) {
           responseText = await transcribeAudio(currentAttachment.data, currentAttachment.mimeType);
        } else {
           responseText = await analyzeMedia(userMessage || "Describe this media.", currentAttachment);
        }
      } else {
        const result = await generateText(userMessage, {
          useSearch,
          useMaps,
          useThinking,
          location: userLocation,
          history: messages.map(m => ({
            role: m.role === Role.USER ? 'user' : 'model',
            parts: [{ text: m.content }]
          }))
        });
        responseText = result.text;
        grounding = result.grounding;
      }

      const savedAiMsg = await db.messages.add(projectId, Role.ASSISTANT, responseText);
      setMessages(prev => [...prev, { ...savedAiMsg, grounding }]);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI response.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {showVoice && <LiveVoiceSession onClose={() => setShowVoice(false)} />}
      <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <div><h2 className="font-bold text-slate-900">{project?.name}</h2><div className="flex items-center gap-3 mt-0.5"><span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${useThinking ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>{useThinking ? 'Gemini 3 Pro (Thinking)' : 'Gemini 3 Flash'}</span></div></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setUseSearch(!useSearch)} className={`p-2 rounded-lg transition-all ${useSearch ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`} title="Search"><Globe className="w-5 h-5" /></button>
          <button onClick={() => setUseMaps(!useMaps)} className={`p-2 rounded-lg transition-all ${useMaps ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`} title="Maps"><MapPin className="w-5 h-5" /></button>
          <button onClick={() => setUseThinking(!useThinking)} className={`p-2 rounded-lg transition-all ${useThinking ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`} title="Thinking"><BrainCircuit className="w-5 h-5" /></button>
          <div className="h-8 w-[1px] bg-slate-200 mx-1" /><button onClick={() => setShowVoice(true)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"><Mic className="w-5 h-5" /></button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex items-start gap-4 ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${msg.role === Role.USER ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white border-slate-200 text-indigo-600'}`}>{msg.role === Role.USER ? <UserIcon className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}</div>
            <div className="max-w-[85%] space-y-2">
              <div className={`px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm border ${msg.role === Role.USER ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'}`}><div className="whitespace-pre-wrap">{msg.content}</div></div>
            </div>
          </div>
        ))}
        {isLoading && <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 animate-pulse border border-indigo-100"><Sparkles className="w-5 h-5 text-indigo-300" /></div><div className="h-10 w-48 bg-indigo-50/50 rounded-3xl animate-pulse" /></div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-6 bg-white border-t border-slate-200 shadow-2xl">
        <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto space-y-4">
          <div className="relative flex items-center">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*,audio/*" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute left-2 p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl"><Paperclip className="w-5 h-5" /></button>
            <input type="text" placeholder="Send a message..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} className="w-full pl-12 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
            <button type="submit" disabled={isLoading || (!input.trim() && !attachedFile)} className="absolute right-2 p-3 bg-indigo-600 text-white rounded-xl disabled:bg-slate-300 transition-all shadow-lg shadow-indigo-200"><Send className="w-5 h-5" /></button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
