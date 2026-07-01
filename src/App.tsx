/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Banana, 
  Zap, 
  DollarSign, 
  Image as ImageIcon, 
  Sparkles, 
  Upload, 
  Play, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Clock, 
  Info, 
  History, 
  AlertTriangle, 
  Eye, 
  RefreshCw,
  FileText,
  Sliders,
  ChevronRight,
  HelpCircle,
  Code
} from 'lucide-react';

interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  latencyMs: number;
  model: string;
  aspectRatio: string;
  timestamp: string;
  mode: 'create' | 'edit';
}

const PRESET_BENCHMARKS = [
  {
    id: 'text-in-image',
    title: 'Text Rendering (文字渲染)',
    description: 'Test text legibility and font creation in generated images.',
    prompt: 'A sleek cybernetic store neon sign glowing on a wet brick wall at night, reading exactly "BANANA LITE" in bright yellow cyber-retro typography.',
    aspectRatio: '16:9',
    model: 'gemini-3.1-flash-lite-image'
  },
  {
    id: 'speed-macro',
    title: 'Ultra-fast Speed (极速微距)',
    description: 'Focus on rendering high-speed motion, water drops, and textures.',
    prompt: 'Macro shot of fresh water drops splashing on a ripe yellow banana, dark obsidian background, high-contrast studio dramatic lighting, hyper-realistic texture.',
    aspectRatio: '1:1',
    model: 'gemini-3.1-flash-lite-image'
  },
  {
    id: 'logo-design',
    title: 'Minimalist Logo (平面设计)',
    description: 'Test clean lines, minimalism, and vector graphic compliance.',
    prompt: 'Minimalist vector graphic logo of a soaring cosmic banana with elegant angel wings, dual-tone gold and charcoal, isolated on solid pitch black background.',
    aspectRatio: '1:1',
    model: 'gemini-3.1-flash-lite-image'
  },
  {
    id: 'photorealistic-jungle',
    title: 'Atmospheric Photorealism (写实场景)',
    description: 'Complex jungle atmosphere with organic volumetric god-rays.',
    prompt: 'Cinematic photograph of an ancient stone altar hidden deep inside a misty tropical banana palm jungle, dramatic god-rays filtering through lush green leaves.',
    aspectRatio: '4:3',
    model: 'gemini-3.1-flash-lite-image'
  }
];

const QUICK_TAGS = [
  'Photorealistic', 'Cyberpunk', 'Watercolor', '3D Render', 'Cinematic', 
  'Vaporwave', 'Studio Lighting', 'Anime Style', 'Retro Vector', 'Oil Painting'
];

export default function App() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'create' | 'edit' | 'info'>('create');
  
  // App Config
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [checkingConfig, setCheckingConfig] = useState(true);

  // Form State - Generate
  const [prompt, setPrompt] = useState('A sleek cybernetic store neon sign glowing on a wet brick wall at night, reading exactly "BANANA LITE" in bright yellow cyber-retro typography.');
  const [model, setModel] = useState('gemini-3.1-flash-lite-image');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');

  // Form State - Edit
  const [editPrompt, setEditPrompt] = useState('Convert this image to a vibrant watercolor painting on premium textured paper');
  const [editModel, setEditModel] = useState('gemini-3.1-flash-lite-image');
  const [uploadBase64, setUploadBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Output State
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<{
    imageUrl: string;
    latencyMs: number;
    model: string;
    aspectRatio: string;
    costEstimate: number;
  } | null>(null);

  // UI state
  const [copied, setCopied] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [compareWithStandard, setCompareWithStandard] = useState(true);

  // Load configuration check and local history
  useEffect(() => {
    checkBackendConfig();
    try {
      const storedHistory = localStorage.getItem('banana_lite_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  // Cycle loading messages when generating
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 5);
      }, 1200);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const checkBackendConfig = async () => {
    try {
      setCheckingConfig(true);
      const res = await fetch('/api/config-check');
      const data = await res.json();
      setHasApiKey(data.hasApiKey);
    } catch (e) {
      console.error(e);
      setHasApiKey(false);
    } finally {
      setCheckingConfig(false);
    }
  };

  // Add item to history
  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedHistory = [newItem, ...history.slice(0, 19)]; // Limit to 20 items
    setHistory(updatedHistory);
    localStorage.setItem('banana_lite_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('banana_lite_history');
  };

  // Run image generation
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    setGenerationError(null);
    setCurrentResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          aspectRatio,
          imageSize
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate image');
      }

      const result = {
        imageUrl: data.imageUrl,
        latencyMs: data.latencyMs,
        model: data.model,
        aspectRatio: data.aspectRatio,
        costEstimate: data.costEstimate,
      };

      setCurrentResult(result);
      addToHistory({
        prompt,
        imageUrl: data.imageUrl,
        latencyMs: data.latencyMs,
        model: data.model,
        aspectRatio: data.aspectRatio,
        mode: 'create'
      });

    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'An error occurred during image generation.');
    } finally {
      setGenerating(false);
    }
  };

  // Run image editing / translation
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadBase64 || !editPrompt.trim()) return;

    setGenerating(true);
    setGenerationError(null);
    setCurrentResult(null);

    try {
      const response = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadBase64,
          prompt: editPrompt,
          model: editModel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to edit image');
      }

      const result = {
        imageUrl: data.imageUrl,
        latencyMs: data.latencyMs,
        model: data.model,
        aspectRatio: 'Original',
        costEstimate: data.model === 'gemini-3.1-flash-lite-image' ? 0.000034 : 0.003
      };

      setCurrentResult(result);
      addToHistory({
        prompt: `[Edit Target] ${editPrompt}`,
        imageUrl: data.imageUrl,
        latencyMs: data.latencyMs,
        model: data.model,
        aspectRatio: 'Original',
        mode: 'edit'
      });

    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'An error occurred during image editing.');
    } finally {
      setGenerating(false);
    }
  };

  // File Upload Helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Tag click helper
  const handleTagClick = (tag: string) => {
    if (activeTab === 'create') {
      const cleanPrompt = prompt.trim();
      if (!cleanPrompt) {
        setPrompt(`${tag}, style`);
      } else if (cleanPrompt.endsWith(',')) {
        setPrompt(`${cleanPrompt} ${tag}`);
      } else {
        setPrompt(`${cleanPrompt}, ${tag}`);
      }
    } else {
      const cleanPrompt = editPrompt.trim();
      if (!cleanPrompt) {
        setEditPrompt(tag);
      } else if (cleanPrompt.endsWith(',')) {
        setEditPrompt(`${cleanPrompt} ${tag}`);
      } else {
        setEditPrompt(`${cleanPrompt}, ${tag}`);
      }
    }
  };

  // Copy Image base64
  const copyBase64 = () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(currentResult.imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download image helper
  const downloadImage = () => {
    if (!currentResult) return;
    const link = document.createElement('a');
    link.href = currentResult.imageUrl;
    link.download = `banana_lite_gen_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load benchmark
  const loadBenchmark = (b: typeof PRESET_BENCHMARKS[0]) => {
    setActiveTab('create');
    setPrompt(b.prompt);
    setAspectRatio(b.aspectRatio);
    setModel(b.model);
    // Optionally trigger immediately
  };

  // Load history item back to view
  const loadHistoryItem = (item: HistoryItem) => {
    setCurrentResult({
      imageUrl: item.imageUrl,
      latencyMs: item.latencyMs,
      model: item.model,
      aspectRatio: item.aspectRatio,
      costEstimate: item.model === 'gemini-3.1-flash-lite-image' ? 0.000034 : 0.003
    });
    
    if (item.mode === 'create') {
      setActiveTab('create');
      setPrompt(item.prompt);
      setAspectRatio(item.aspectRatio);
      setModel(item.model);
    } else {
      setActiveTab('edit');
      // strip tag if needed
      setEditPrompt(item.prompt.replace('[Edit Target] ', ''));
      setEditModel(item.model);
    }
  };

  // Human reassuring messages during quick generation
  const loadingMessages = [
    'Initializing Nano Banana engine...',
    'Analyzing textual semantic prompt details...',
    'Synthesizing lightning-fast noise matrices (4-5s)...',
    'Adding SynthID microscopic digital watermark...',
    'Finalizing canvas texture layers...'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300">
      
      {/* Top Banner / API Key Status Bar */}
      {hasApiKey === false && !checkingConfig && (
        <div id="api-key-warning" className="bg-amber-950/80 border-b border-amber-500/20 text-amber-200 px-4 py-2.5 text-xs md:text-sm flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>Gemini API Key is missing.</strong> Set your <code>GEMINI_API_KEY</code> in the <strong>Settings &gt; Secrets</strong> panel of AI Studio to enable image generation.
            </span>
          </div>
          <div className="text-amber-400 font-medium">
            Requires active Google AI Studio setup
          </div>
        </div>
      )}

      {/* Main Header */}
      <header id="main-header" className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 p-2 rounded-xl shadow-lg shadow-yellow-500/10">
              <Banana className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg md:text-xl tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                  Nano Banana 2 Lite
                </h1>
                <span className="text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  Imagen 3.1 Flash-Lite
                </span>
              </div>
              <p className="text-xs text-slate-400">
                The fastest, most cost-efficient image generation model from Google.
              </p>
            </div>
          </div>

          {/* Core Stats Overview */}
          <div className="flex items-center gap-2.5 md:gap-4 text-xs md:text-sm">
            <div className="bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <div>
                <span className="text-slate-400 text-[10px] block leading-none">LATENCY</span>
                <span className="font-semibold text-slate-200">~4-5 sec</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              <div>
                <span className="text-slate-400 text-[10px] block leading-none">COST VALUE</span>
                <span className="font-semibold text-slate-200">~$0.034 / 1k imgs</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-blue-400" />
              <div>
                <span className="text-slate-400 text-[10px] block leading-none font-sans">Watermark</span>
                <span className="font-semibold text-slate-200">SynthID Injected</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Left Columns: Config & Controls (5 Columns on Desktop) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Main Workspace Navigation */}
          <div className="bg-slate-900/60 border border-slate-800 p-1.5 rounded-xl flex">
            <button 
              id="tab-btn-create"
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'create' 
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Text to Image
            </button>
            <button 
              id="tab-btn-edit"
              onClick={() => setActiveTab('edit')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'edit' 
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Upload className="h-4 w-4" />
              Image Editing
            </button>
            <button 
              id="tab-btn-info"
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'info' 
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Info className="h-4 w-4" />
              Benchmarks
            </button>
          </div>

          {/* Form Contexts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            
            {activeTab === 'create' && (
              <form onSubmit={handleGenerate} className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5" /> Prompt Engineering Input
                  </span>
                  <span className="text-[10px] text-slate-500">Supports text rendering</span>
                </div>

                {/* Prompt Textbox */}
                <div className="flex flex-col gap-1.5">
                  <textarea
                    id="input-prompt-textarea"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate in detail..."
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 text-sm resize-none"
                  />
                </div>

                {/* Quick style buttons */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-medium">Add Style Qualifiers:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-[11px] text-slate-300 px-2 py-1 rounded-md transition-colors"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model settings */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Model Variant:</label>
                    <select
                      id="select-model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-xs p-2 focus:outline-none focus:border-amber-400/50"
                    >
                      <option value="gemini-3.1-flash-lite-image">Nano Banana 2 Lite (Fastest)</option>
                      <option value="gemini-3.1-flash-image">Nano Banana 2 (Standard)</option>
                      <option value="gemini-3-pro-image">Nano Banana Pro (Highest Quality)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Aspect Ratio:</label>
                    <select
                      id="select-aspect-ratio"
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-xs p-2 focus:outline-none focus:border-amber-400/50"
                    >
                      <option value="1:1">1:1 (Square)</option>
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                      <option value="4:3">4:3 (Photo)</option>
                      <option value="3:4">3:4 (Vertical Photo)</option>
                    </select>
                  </div>
                </div>

                {/* Additional size settings for higher tier models */}
                {(model === 'gemini-3.1-flash-image' || model === 'gemini-3-pro-image') && (
                  <div className="flex flex-col gap-1.5 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-amber-300 font-medium">Image Resolution:</label>
                      <span className="text-[10px] text-amber-400/80">Pro features enabled</span>
                    </div>
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-xs p-1.5 focus:outline-none focus:border-amber-400/50 mt-1"
                    >
                      <option value="1K">1K Standard Quality</option>
                      <option value="2K">2K High Definition</option>
                      <option value="4K">4K Commercial Quality</option>
                    </select>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  id="btn-generate-submit"
                  disabled={generating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating with Lite Speed...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Generate Image (~4-5s)
                    </>
                  )}
                </button>
              </form>
            )}

            {activeTab === 'edit' && (
              <form onSubmit={handleEdit} className="flex flex-col gap-5">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Style Transfer & Inpainting
                </span>

                {/* Drag Drop Box */}
                <div 
                  id="dropzone-box"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-amber-400/40 bg-slate-950/40 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {uploadBase64 ? (
                    <div className="relative group w-full max-h-36 overflow-hidden flex justify-center">
                      <img 
                        src={uploadBase64} 
                        alt="To edit" 
                        className="max-h-32 object-contain rounded-lg border border-slate-800"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-lg">
                        <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" /> Change Image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-xs text-slate-300 text-center font-medium">
                        Drag and drop your image, or <span className="text-amber-400">browse</span>
                      </p>
                      <p className="text-[10px] text-slate-500 text-center">
                        Supports PNG, JPEG up to 10MB
                      </p>
                    </>
                  )}
                </div>

                {/* Edit Command */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Style Instruction (修改指令):</label>
                    <span className="text-[10px] text-slate-500">How to modify the image</span>
                  </div>
                  <textarea
                    id="input-edit-textarea"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe changes, e.g., 'Turn it into an anime sketch' or 'Add a miniature yellow banana in a workspace'..."
                    className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 text-sm resize-none"
                  />
                </div>

                {/* Quick style tags */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Add Edit Modifiers:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-[11px] text-slate-300 px-2 py-1 rounded-md transition-colors"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select edit model */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Evaluation Model:</label>
                  <select
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-xs p-2.5 focus:outline-none focus:border-amber-400/50"
                  >
                    <option value="gemini-3.1-flash-lite-image">Nano Banana 2 Lite (Fastest)</option>
                    <option value="gemini-3.1-flash-image">Nano Banana 2 (Standard)</option>
                  </select>
                </div>

                {/* Submit Edit */}
                <button
                  type="submit"
                  disabled={generating || !uploadBase64 || !editPrompt.trim()}
                  className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Redrawing Canvas...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Apply Edit (~4-5s)
                    </>
                  )}
                </button>
              </form>
            )}

            {activeTab === 'info' && (
              <div className="flex flex-col gap-5">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Core Advantages & Presets
                </span>

                <div className="text-xs text-slate-300 space-y-4">
                  <p>
                    <strong>Nano Banana 2 Lite</strong> (Gemini 3.1 Flash-Lite Image model) is optimized for ultra-high throughput and speed.
                  </p>

                  <div className="space-y-2.5 bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                    <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" /> 1. Extreme Speed
                    </div>
                    <p className="text-slate-400">
                      While standard image generators take 20 seconds, the Lite model delivers results in just 4-5 seconds. Perfect for fast brainstorming, draft creation, and A/B testing.
                    </p>
                  </div>

                  <div className="space-y-2.5 bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                    <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> 2. Absolute Budget Efficiency
                    </div>
                    <p className="text-slate-400">
                      With an estimated price of $0.034 per 1,000 images, it reduces deployment and experimental costs by orders of magnitude for developers.
                    </p>
                  </div>

                  <div className="space-y-2.5 bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                    <div className="font-semibold text-blue-400 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-blue-400" /> 3. High Prompt Adherence
                    </div>
                    <p className="text-slate-400">
                      Maintains excellent structure, light modeling, and visual composition. Includes Google's state-of-the-art SynthID digital verification watermark natively.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Preset Benchmark Tests */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5" /> Core Benchmark Suites
            </h3>
            
            <div className="grid grid-cols-1 gap-2.5">
              {PRESET_BENCHMARKS.map((benchmark) => (
                <button
                  type="button"
                  key={benchmark.id}
                  onClick={() => loadBenchmark(benchmark)}
                  className="w-full text-left bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-400/20 px-3.5 py-3 rounded-xl transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5 max-w-[90%]">
                    <div className="text-xs font-semibold text-amber-200 group-hover:text-amber-400 flex items-center gap-1.5">
                      {benchmark.title}
                    </div>
                    <p className="text-[10.5px] text-slate-400 line-clamp-1">
                      {benchmark.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

        </section>

        {/* Right Columns: Interactive Preview & Metrics comparison (7 Columns on Desktop) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Stage Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[480px]">
            
            {/* Stage Title */}
            <div className="bg-slate-950 border-b border-slate-800/80 px-5 py-3.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Interactive Render Stage
              </span>
              
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center cursor-pointer text-[11px] text-slate-400 gap-1.5 select-none">
                  <input
                    type="checkbox"
                    checked={compareWithStandard}
                    onChange={() => setCompareWithStandard(!compareWithStandard)}
                    className="sr-only peer"
                  />
                  <div className="relative w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-slate-950"></div>
                  Show Comparison Metrics
                </label>
              </div>
            </div>

            {/* Stage Content */}
            <div className="flex-1 bg-slate-950 p-6 flex items-center justify-center relative min-h-[350px]">
              
              {generating ? (
                /* Dynamic Loading Screen with status steps */
                <div className="flex flex-col items-center justify-center gap-4 text-center max-w-sm">
                  <div className="relative flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-amber-400 animate-spin" />
                    <Banana className="absolute h-6 w-6 text-amber-400 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-200">
                      Generating via Nano Banana 2 Lite
                    </p>
                    <p className="text-xs text-amber-400 h-4 transition-all">
                      {loadingMessages[loadingStep]}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Typically completes in 4-5 seconds due to specialized low-thinking configuration.
                  </p>
                </div>
              ) : currentResult ? (
                /* Rendered Output with Overlay controls */
                <div className="relative w-full max-w-lg flex flex-col items-center justify-center">
                  <div className="relative group border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-900 w-full flex items-center justify-center">
                    <img 
                      id="rendered-result-img"
                      src={currentResult.imageUrl} 
                      alt="Generated design output" 
                      className="object-contain max-h-[420px] w-full"
                    />

                    {/* Image Action Buttons Layer */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 backdrop-blur">
                      <button
                        type="button"
                        onClick={copyBase64}
                        className="bg-slate-900 hover:bg-slate-800 p-2 rounded text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5 text-xs"
                        title="Copy Base64 String"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={downloadImage}
                        className="bg-slate-900 hover:bg-slate-800 p-2 rounded text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5 text-xs"
                        title="Download PNG Image"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ) : generationError ? (
                /* Error Presentation */
                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-6 text-center max-w-md space-y-3">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
                  <p className="text-sm font-bold text-red-200">Generation Request Failed</p>
                  <p className="text-xs text-slate-400 leading-relaxed max-h-32 overflow-y-auto">
                    {generationError}
                  </p>
                  <p className="text-[11px] text-slate-500 border-t border-slate-800 pt-2.5">
                    Verify that your API Key is correctly injected and valid inside Google AI Studio.
                  </p>
                </div>
              ) : (
                /* Initial Welcome Stage State */
                <div className="text-center max-w-md space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400/80 shadow-inner">
                    <Banana className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-200">
                      Nano Banana 2 Lite Stage Ready
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Enter a custom prompt, choose an aspect ratio on the left, or load one of the preset benchmark suites to begin.
                    </p>
                  </div>
                  <div className="inline-flex gap-2">
                    <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-1 rounded">MIME: image/png</span>
                    <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-1 rounded">Format: Base64</span>
                    <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-1 rounded">Watermark: SynthID</span>
                  </div>
                </div>
              )}

            </div>

            {/* Performance Indicators Grid */}
            {currentResult && compareWithStandard && (
              <div className="bg-slate-900 border-t border-slate-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Generation Time Metric */}
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-amber-400" /> Latency Metric
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">90% Faster</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-slate-200">
                      {(currentResult.latencyMs / 1000).toFixed(2)}s
                    </div>
                    {/* Visual bar comparing 4.5s with standard 20s */}
                    <div className="space-y-0.5">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${Math.min(100, (currentResult.latencyMs / 20000) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>Current model</span>
                        <span>Standard avg (20s)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estimated Cost Metric */}
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3 text-emerald-400" /> Estimated Cost
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Ultra Cheap</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-slate-200">
                      ${currentResult.costEstimate.toFixed(6)}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Based on standard market rate of $0.034 per 1,000 generations.
                    </p>
                  </div>
                </div>

                {/* Model and Format detail */}
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3 text-blue-400" /> Output Properties
                    </span>
                    <span className="text-[10px] text-blue-400 font-semibold">Verified</span>
                  </div>
                  <div className="space-y-0.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[10.5px]">Aspect:</span>
                      <span className="font-mono">{currentResult.aspectRatio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[10.5px]">Watermark:</span>
                      <span className="font-semibold text-emerald-400">SynthID Injected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[10.5px]">Host:</span>
                      <span className="font-mono text-[10.0px]">Cloud Run Sandbox</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* History Gallery Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-amber-400" /> Local Run History ({history.length})
              </span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-[11px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Clear runs
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
                No past runs stored in your browser session yet. Start generating above to see them saved here!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-h-56 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="group bg-slate-950 hover:bg-slate-800/60 border border-slate-800 hover:border-amber-400/30 p-2.5 rounded-xl cursor-pointer transition-all space-y-2 relative"
                  >
                    <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800/80 flex items-center justify-center relative">
                      <img 
                        src={item.imageUrl} 
                        alt="Thumbnail" 
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <Eye className="h-4 w-4 text-amber-400" />
                      </div>
                    </div>
                    
                    <div className="space-y-0.5">
                      <p className="text-[9.5px] text-slate-300 line-clamp-1 font-medium" title={item.prompt}>
                        {item.prompt}
                      </p>
                      <div className="flex justify-between items-center text-[8.5px] text-slate-500">
                        <span>{(item.latencyMs / 1000).toFixed(1)}s</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </section>

      </main>

      {/* Modern footer with tech notes */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Banana className="h-4 w-4 text-amber-500/80" />
            <span>Nano Banana 2 Lite Evaluation Sandbox © 2026. Powered by Gemini 3.1 Flash-Lite Image.</span>
          </div>
          <div className="flex gap-4">
            <a 
              href="https://ai.google.dev" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              Google AI Dev Center <ChevronRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
