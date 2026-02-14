
import React, { useState } from 'react';
import { 
  ImageIcon, 
  VideoIcon, 
  Sparkles, 
  Loader2, 
  Download, 
  Settings2, 
  Maximize,
  Square,
  AlertCircle
} from 'lucide-react';
import { generateImage, generateVideo, editImage } from '../lib/gemini';

export const MediaLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Image Config
  const [ratio, setRatio] = useState('1:1');
  const [size, setSize] = useState<"1K" | "2K" | "4K">('1K');

  // Video Config
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16'>('16:9');
  const [baseImage, setBaseImage] = useState<{data: string, mimeType: string} | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() && activeTab === 'image') return;
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      if (activeTab === 'image') {
        const url = await generateImage(prompt, { aspectRatio: ratio, imageSize: size });
        setResult(url);
      } else {
        const url = await generateVideo(prompt, { image: baseImage || undefined, aspectRatio: videoRatio });
        setResult(url);
      }
    } catch (err: any) {
      setError(err.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const ratios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Sparkles className="text-indigo-600 w-8 h-8" /> Media Lab
        </h1>
        <p className="text-slate-500">Create professional visual content with Nano Banana Pro and Veo.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-1 rounded-2xl border border-slate-200 flex shadow-sm">
            <button onClick={() => setActiveTab('image')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'image' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <ImageIcon className="w-4 h-4" /> Image Gen
            </button>
            <button onClick={() => setActiveTab('video')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'video' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <VideoIcon className="w-4 h-4" /> Animate / Video
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Creative Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeTab === 'image' ? "Describe the image in detail..." : "Describe the motion or scene..."}
                className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
              />
            </div>

            {activeTab === 'image' ? (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    {/* Fixed: Replaced AspectRatio with Square */}
                    <Square className="w-4 h-4 text-slate-400" /> Aspect Ratio
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {ratios.map(r => (
                      <button key={r} onClick={() => setRatio(r)} className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${ratio === r ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-slate-400" /> Resolution
                  </label>
                  <div className="flex gap-2">
                    {(['1K', '2K', '4K'] as const).map(s => (
                      <button key={s} onClick={() => setSize(s)} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${size === s ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Video Ratio</label>
                  <div className="flex gap-2">
                    {['16:9', '9:16'].map(r => (
                      <button key={r} onClick={() => setVideoRatio(r as any)} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${videoRatio === r ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Reference Image (Optional)</label>
                  <input type="file" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const r = new FileReader();
                      r.onload = () => setBaseImage({ data: (r.result as string).split(',')[1], mimeType: file.type });
                      r.readAsDataURL(file);
                    }
                  }} className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
              </>
            )}

            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Create Now</>}
            </button>
          </div>
        </div>

        {/* Result Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 bg-white border border-slate-200 rounded-3xl min-h-[500px] flex items-center justify-center relative overflow-hidden group shadow-sm">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-6 p-10 text-center animate-in fade-in duration-500">
                <div className="relative">
                   <div className="w-24 h-24 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                   <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Magical things taking shape...</h3>
                  <p className="text-slate-400 mt-2">Our AI is meticulously crafting your masterpiece.</p>
                </div>
              </div>
            ) : result ? (
              <div className="w-full h-full animate-in zoom-in duration-500">
                {activeTab === 'image' ? (
                  <img src={result} className="w-full h-full object-contain" />
                ) : (
                  <video src={result} controls autoPlay loop className="w-full h-full" />
                )}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={result} download="nexusai-creation" className="p-3 bg-white/90 backdrop-blur rounded-2xl text-indigo-600 shadow-2xl flex items-center gap-2 font-bold text-sm">
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center p-12 max-w-sm">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  {activeTab === 'image' ? <ImageIcon className="w-10 h-10" /> : <VideoIcon className="w-10 h-10" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900">The canvas is waiting</h3>
                <p className="text-slate-400 mt-2 text-sm">Your generated content will appear here once ready.</p>
              </div>
            )}

            {error && (
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm flex items-center gap-3 shadow-xl animate-in slide-in-from-bottom-4">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
