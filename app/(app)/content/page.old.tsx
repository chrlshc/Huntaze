'use client';

/**
 * Content Studio Page - End 2025 Compliant
 * 
 * Transforms an idea into 3 ready-to-post assets (TikTok/Reels/Shorts) in 1 click.
 * Shopify-like clean UI with 2-column layout.
 * 
 * Features:
 * - Dropzone upload (video or link)
 * - AI Script Generator (Hook/Body/CTA)
 * - Production switches (Captions, Smart cuts, Safe-zone crop)
 * - Job status stepper (Queued → Processing → Needs review → Ready)
 */

export const dynamic = 'force-dynamic';

import { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  Link2, 
  Sparkles, 
  Film, 
  Subtitles, 
  Scissors, 
  Shield, 
  Play,
  Download,
  Send,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  FileVideo,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/Toggle';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

type SourceType = 'upload' | 'link';
type ScriptMode = 'simple' | 'pro';
type JobStatus = 'idle' | 'queued' | 'processing' | 'needs_review' | 'ready' | 'failed';
type AudienceType = 'existing_fans' | 'new_fans' | 'all';
type GoalType = 'views' | 'link_taps' | 'new_subs';

interface ScriptOutput {
  hook: string;
  body: string;
  cta: string;
  variations?: { hook: string; body: string; cta: string }[];
}

interface ProductionJob {
  id: string;
  status: JobStatus;
  outputs?: { variant: string; url: string; duration: string }[];
  error?: string;
}

export default function ContentStudioPage() {
  // Source state
  const [sourceType, setSourceType] = useState<SourceType>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Script state
  const [idea, setIdea] = useState('');
  const [audience, setAudience] = useState<AudienceType>('all');
  const [goal, setGoal] = useState<GoalType>('views');
  const [scriptMode, setScriptMode] = useState<ScriptMode>('simple');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [script, setScript] = useState<ScriptOutput | null>(null);

  // Production switches
  const [captions, setCaptions] = useState(true);
  const [smartCuts, setSmartCuts] = useState(true);
  const [safeZoneCrop, setSafeZoneCrop] = useState(true);
  const [watermarkFree, setWatermarkFree] = useState(true);

  // Job state
  const [job, setJob] = useState<ProductionJob | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      simulateUpload();
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      simulateUpload();
    }
  }, []);

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleGenerateScript = async () => {
    if (!idea.trim()) return;
    
    setIsGeneratingScript(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const generatedScript: ScriptOutput = {
      hook: `"Wait, you're still doing it wrong..." (pattern interrupt)`,
      body: `Here's the thing about ${idea.toLowerCase()} that nobody talks about. Most people think it's about X, but it's actually about Y. Let me show you...`,
      cta: `Link in bio for the full guide. Drop a 🔥 if you want part 2!`,
    };

    if (scriptMode === 'pro') {
      generatedScript.variations = [
        {
          hook: `POV: You just discovered the ${idea.toLowerCase()} hack`,
          body: `This changed everything for me. Here's what I learned...`,
          cta: `Save this for later and follow for more tips!`,
        },
        {
          hook: `Stop scrolling if you care about ${idea.toLowerCase()}`,
          body: `I tested this for 30 days and the results were insane...`,
          cta: `Comment "GUIDE" and I'll send you the full breakdown!`,
        },
      ];
    }

    setScript(generatedScript);
    setIsGeneratingScript(false);
  };

  const handleLaunchProduction = async () => {
    const newJob: ProductionJob = {
      id: `job_${Date.now()}`,
      status: 'queued',
    };
    setJob(newJob);

    // Simulate job progression
    await new Promise(resolve => setTimeout(resolve, 1500));
    setJob(prev => prev ? { ...prev, status: 'processing' } : null);

    await new Promise(resolve => setTimeout(resolve, 3000));
    setJob(prev => prev ? { ...prev, status: 'needs_review' } : null);

    await new Promise(resolve => setTimeout(resolve, 1000));
    setJob(prev => prev ? {
      ...prev,
      status: 'ready',
      outputs: [
        { variant: '15s TikTok', url: '#', duration: '0:15' },
        { variant: '25s Reels', url: '#', duration: '0:25' },
        { variant: 'Story Crop', url: '#', duration: '0:12' },
      ],
    } : null);
  };

  const handleSaveDraft = () => {
    setIsDraft(true);
    setTimeout(() => setIsDraft(false), 2000);
  };

  const clearFile = () => {
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isSourceReady = sourceType === 'upload' ? (file && uploadProgress === 100) : linkUrl.trim().length > 0;
  const canLaunch = isSourceReady && script;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header - Shopify style */}
      <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Content Studio
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create and produce ready-to-post content
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              onClick={handleSaveDraft}
              disabled={!idea.trim()}
            >
              {isDraft ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Saved
                </>
              ) : (
                'Save draft'
              )}
            </Button>
            <Button 
              variant="primary"
              onClick={handleLaunchProduction}
              disabled={!canLaunch || (job && job.status !== 'ready' && job.status !== 'failed')}
            >
              <Play className="w-4 h-4" />
              Launch production
            </Button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dropzone Upload Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Video Source
                </h2>
                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setSourceType('upload')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      sourceType === 'upload'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-1.5" />
                    Upload
                  </button>
                  <button
                    onClick={() => setSourceType('link')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      sourceType === 'link'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Link2 className="w-4 h-4 inline mr-1.5" />
                    Paste Link
                  </button>
                </div>
              </div>

              {sourceType === 'upload' ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    file
                      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {file ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        <FileVideo className="w-10 h-10 text-emerald-500" />
                        <div className="text-left">
                          <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                          <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); clearFile(); }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                        >
                          <X className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                      
                      {isUploading ? (
                        <div className="w-full max-w-xs mx-auto">
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-200"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-sm text-slate-500 mt-1">Uploading... {uploadProgress}%</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">Ready</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-600 dark:text-slate-300 font-medium">
                        Drag & drop your video here
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        or click to browse • MP4, MOV, WebM up to 500MB
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Paste TikTok or video URL..."
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Use only content you own. For best quality, upload the original file without watermarks.
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Idea → Script Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Idea → Script
                  </h2>
                  <InfoTooltip
                    title="AI Script Generator"
                    description="Our AI creates hook-body-CTA scripts optimized for short-form video."
                    whyItMatters="A strong hook keeps 80% more viewers past 3 seconds."
                    tip="Be specific with your idea for better results."
                  />
                </div>
                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setScriptMode('simple')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      scriptMode === 'simple'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    onClick={() => setScriptMode('pro')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      scriptMode === 'pro'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Pro
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Idea
                  </label>
                  <input
                    type="text"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="e.g., Tenue de sport, Morning routine, Behind the scenes..."
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Audience
                    </label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value as AudienceType)}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All audiences</option>
                      <option value="existing_fans">Existing fans</option>
                      <option value="new_fans">New fans</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Goal
                    </label>
                    <select
                      value={goal}
                      onChange={(e) => setGoal(e.target.value as GoalType)}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="views">Maximize views</option>
                      <option value="link_taps">Drive link taps</option>
                      <option value="new_subs">Get new subscribers</option>
                    </select>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={handleGenerateScript}
                  disabled={!idea.trim() || isGeneratingScript}
                  className="w-full"
                >
                  {isGeneratingScript ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Script
                    </>
                  )}
                </Button>

                {script && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                              0-2s
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Hook</span>
                          </div>
                          <p className="text-slate-900 dark:text-white">{script.hook}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                              2-10s
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Body</span>
                          </div>
                          <p className="text-slate-900 dark:text-white">{script.body}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded">
                              10-15s
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">CTA</span>
                          </div>
                          <p className="text-slate-900 dark:text-white">{script.cta}</p>
                        </div>
                      </div>
                    </div>

                    {scriptMode === 'pro' && script.variations && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          A/B Variations
                        </p>
                        {script.variations.map((variation, idx) => (
                          <div 
                            key={idx}
                            className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <p className="text-xs font-medium text-slate-500 mb-1">Variation {idx + 1}</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              <span className="font-medium">Hook:</span> {variation.hook}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Production Switches */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Production Settings
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Subtitles className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-captions</span>
                    <InfoTooltip
                      title="Auto-captions"
                      description="Automatically add subtitles to your video."
                      whyItMatters="85% of social videos are watched without sound."
                      tip="Captions increase watch time by 40%."
                    />
                  </div>
                  <Toggle
                    checked={captions}
                    onChange={setCaptions}
                    label=""
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Smart cuts (3 variants)</span>
                    <InfoTooltip
                      title="Smart Cuts"
                      description="Creates 3 optimized versions: 15s, 25s, and story crop."
                      whyItMatters="Different platforms favor different lengths."
                      tip="15s works best for TikTok, 25s for Reels."
                    />
                  </div>
                  <Toggle
                    checked={smartCuts}
                    onChange={setSmartCuts}
                    label=""
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Safe-zone crop</span>
                    <InfoTooltip
                      title="Safe-zone Crop"
                      description="Avoids UI overlays on TikTok/Reels (like buttons, captions area)."
                      whyItMatters="Keeps your content visible and unobstructed."
                    />
                  </div>
                  <Toggle
                    checked={safeZoneCrop}
                    onChange={setSafeZoneCrop}
                    label=""
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Watermark-free export</span>
                  </div>
                  {sourceType === 'upload' ? (
                    <Toggle
                      checked={watermarkFree}
                      onChange={setWatermarkFree}
                      label=""
                      size="sm"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Upload only</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Job Status */}
            {job && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Production Status
                </h2>

                <div className="space-y-3">
                  {(['queued', 'processing', 'needs_review', 'ready'] as const).map((status, idx) => {
                    const isActive = job.status === status;
                    const isPast = ['queued', 'processing', 'needs_review', 'ready'].indexOf(job.status) > idx;
                    const isFailed = job.status === 'failed';

                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isPast || isActive
                            ? 'bg-emerald-100 dark:bg-emerald-900/30'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          {isPast ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : isActive ? (
                            status === 'processing' ? (
                              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                            ) : (
                              <Clock className="w-5 h-5 text-emerald-500" />
                            )
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${
                          isPast || isActive
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {status === 'queued' && 'Queued'}
                          {status === 'processing' && 'Processing'}
                          {status === 'needs_review' && 'Needs review'}
                          {status === 'ready' && 'Ready'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {job.status === 'ready' && job.outputs && (
                  <div className="mt-6 space-y-3">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Your assets are ready!
                    </p>
                    {job.outputs.map((output, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {output.variant}
                          </span>
                          <span className="text-xs text-slate-400">{output.duration}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="primary" className="w-full mt-4">
                      <Send className="w-4 h-4" />
                      Send to Distribution
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Quick Tips */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>• Upload raw files for best quality</li>
                <li>• Strong hooks keep viewers past 3 seconds</li>
                <li>• Test different CTAs to find what converts</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
  );
}
