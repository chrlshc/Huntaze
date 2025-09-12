'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './onboarding-styles.css';
import { useOnboarding } from '@/hooks/useOnboarding';
import { presets } from '@/presets/onlyfans-2025';
import { NICHES, DEFAULTS } from '@/src/lib/onboarding/config';
import { StepShellV2 as StepShell } from '@/components/onboarding/StepShellV2';
import LoadDemoButton from '@/components/onboarding/LoadDemoButton';
import { ONBOARDING_COPY as C } from '@/src/lib/onboarding/copy';
import { PREVIEW_TEMPLATES } from '@/src/lib/onboarding/previewTemplates';
import { ppvTypicalWithMultipliers } from '@/src/lib/onboarding/price';
import { detectTimezone } from '@/src/lib/onboarding/timezone';
import { useAnalytics } from '@/hooks/useAnalytics';
import { showToast } from '@/components/Toast';
import ComplianceChecker from '@/components/ComplianceChecker';
import EditableField from '@/components/EditableField';
import { 
  ArrowRight, 
  ArrowLeft,
  Check, 
  Loader2, 
  CreditCard, 
  Bot, 
  User, 
  Zap, 
  Plus,
  Upload,
  MessageSquare,
  // Languages,
  Image,
  Video,
  Mic,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Heart,
  Star,
  CheckCircle,
  Sparkles,
  Rocket,
  X,
  Target,
  Share2,
  Brain,
  Sliders,
  Wand2,
  // Missing icons used in niche mapping
  Dumbbell,
  Camera,
  Gamepad2,
  Flame,
  BookOpen,
  Palette,
  Instagram,
  Music2,
  Megaphone,
  Plane,
  Copy
} from 'lucide-react';

type Step = 'profile' | 'sell-plan' | 'niche' | 'platform' | 'ai-config' | 'plan' | 'complete';

export default function OnboardingSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeOnboarding, sellPlan, setSellPlan, updateOps } = useOnboarding();
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  // Sell Plan is persisted in store now
  const [loading, setLoading] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  // No JS measurement for progress connectors; handled via CSS pseudo-elements
  
  const [formData, setFormData] = useState({
    // Profile
    displayName: '',
    bio: '',
    timezone: '',
    language: 'en',
    businessType: 'individual' as 'individual' | 'agency' | 'studio',
    contentFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    gdprConsent: false,
    marketingEmails: false,
    avatarUrl: '',
    
    // Niche & Goals
    niche: '',
    goals: [] as string[],
    contentTypes: [] as string[],
    targetMonthlyRevenue: '1k-5k',
    currentMonthlyRevenue: '0-1k',
    
    // AI Config
    personality: '',
    responseStyle: 'flirty',
    automationLevel: 70,
    autoReply: true,
    welcomeMessage: '',
    monthlyPrice: '9.99',
    
    // Platform
    connectedPlatforms: [] as string[],
    socialPlatforms: {
      instagram: false,
      tiktok: false,
      reddit: false,
    },
    
    // AI Personality
    aiPersonality: {
      tone: 'flirty' as 'flirty' | 'friendly' | 'professional' | 'casual',
      responseSpeed: 'medium' as 'instant' | 'medium' | 'delayed',
      traits: [] as string[],
      voiceSample: null as File | null,
      writingSamples: [] as string[],
    },
  });

  const [showPlaybook, setShowPlaybook] = useState(false);
  const { track } = useAnalytics();
  const [customPlaybook, setCustomPlaybook] = useState<{
    dmSequences?: Partial<Record<'day1'|'day2'|'day3'|'day4'|'day5'|'day6'|'day7', string>>;
    cadence?: { postsPerWeek: number; storiesPerWeek: number; dmCheckinsPerDay: number };
    upsellMenu?: { name: string; price: string; eta: string }[];
  }>({});
  const [editingDM, setEditingDM] = useState<Partial<Record<'day1'|'day2'|'day3'|'day4'|'day5'|'day6'|'day7', boolean>>>({});
  const [editCadence, setEditCadence] = useState(false);
  const [editUpsells, setEditUpsells] = useState(false);
  const [autoSave, setAutoSave] = useState(false);

  useEffect(() => {
    if (showPlaybook && formData.niche) {
      try { track('playbook_opened', { niche: formData.niche }); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPlaybook]);

  const copyToClipboard = async (label: string, text: string, meta: Record<string, any> = {}) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`);
      try { track(meta.event || 'copied', meta); } catch {}
    } catch {
      // ignore
    }
  };

  const saveDraft = async (changed: 'dm' | 'cadence' | 'upsells') => {
    try {
      const niche = formData.niche || (typeof window !== 'undefined' ? localStorage.getItem('selectedNiche') : null);
      const overrides: any = {};
      if (changed === 'dm' && customPlaybook.dmSequences) overrides.dmSequences = customPlaybook.dmSequences;
      if (changed === 'cadence' && customPlaybook.cadence) overrides.cadence = customPlaybook.cadence;
      if (changed === 'upsells' && customPlaybook.upsellMenu) overrides.upsellMenu = customPlaybook.upsellMenu;
      await fetch('/api/onboarding/save-playbook-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, ...overrides })
      });
      try { track('playbook_draft_saved', { niche, changed }); } catch {}
    } catch {}
  };

  const steps = [
    { id: 'profile', title: 'Profile', icon: User },
    { id: 'sell-plan', title: 'Sell Plan', icon: DollarSign },
    { id: 'niche', title: 'Business', icon: Target },
    { id: 'platform', title: 'Platforms', icon: Zap },
    { id: 'ai-config', title: 'AI Setup', icon: Bot },
    { id: 'plan', title: 'Choose Plan', icon: CreditCard },
  ] as const;
  const totalSteps = steps.length;

  // Curated, revenue-focused niches for creators
  const colorMap: Record<string, string> = {
    gfe: 'rose', cosplay: 'indigo', dominatrix: 'red', fetish: 'rose', milf: 'amber', alt: 'purple', bbw: 'violet', gamer: 'violet', fitness: 'emerald', fashion: 'pink', couple: 'cyan', college: 'amber', ethnic: 'purple', luxury: 'blue',
  };
  const niches = NICHES.map(n => ({ id: n.id, name: n.name, icon: 'star', color: colorMap[n.id] || 'gray' }));

  // Derive visible strategy bullets from the selected preset
  const getPresetTips = (id: string) => {
    const preset = (presets as any)[id];
    if (!preset) return [] as string[];
    const tips: string[] = [];
    tips.push(`Cadence: ${preset.cadence.postsPerWeek}/wk posts · ${preset.cadence.storiesPerWeek}/wk stories · ${preset.cadence.dmCheckinsPerDay}/day DMs`);
    tips.push(`KPIs: Conv ${preset.kpis.subConvRate} · PPV ${preset.kpis.ppvAttachRate} · Churn ${preset.kpis.monthlyChurn}`);
    if (preset.price) tips.push(`Suggested price: $${preset.price}`);
    return tips;
  };

  // Revenue ranges for steppers + selects
  const revenueRanges = ['0-1k','1k-5k','5k-10k','10k-25k','25k-50k','>50k'] as const;

  const stepRevenue = (type: 'current' | 'target', dir: -1 | 1) => {
    const arr = revenueRanges as unknown as string[];
    const current = type === 'current' ? (formData.currentMonthlyRevenue || arr[0]) : (formData.targetMonthlyRevenue || arr[0]);
    let idx = Math.max(0, arr.indexOf(current));
    idx = Math.min(arr.length - 1, idx + dir);
    if (type === 'current') {
      setFormData({ ...formData, currentMonthlyRevenue: arr[idx] });
    } else {
      setFormData({ ...formData, targetMonthlyRevenue: arr[idx] });
    }
  };

  // Auto-detect timezone on first render; lock language to English (US market)
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && !formData.timezone) {
        setFormData(prev => ({ ...prev, timezone: tz }));
      }
    } catch {}
  }, []);

  // OAuth return handling (banner removed)
  useEffect(() => {
    // Check if returning from OAuth
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    
    if (platform && status === 'connected') {
      // Update connected platforms
      if (platform === 'onlyfans') {
        setFormData(prev => ({
          ...prev,
          connectedPlatforms: [...prev.connectedPlatforms, platform]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          socialPlatforms: {
            ...prev.socialPlatforms,
            [platform]: true
          }
        }));
      }
      
      // Return to platform step
      const returnStep = sessionStorage.getItem('onboarding_return');
      if (returnStep) {
        setCurrentStep(returnStep as Step);
        sessionStorage.removeItem('onboarding_return');
      }
    }
  }, [searchParams])

  const handleNext = async () => {
    setLoading(true);
    setAnimationDirection('forward');
    
    try {
      // Save data based on current step
      switch(currentStep) {
        case 'profile':
          await fetch('/api/onboarding/save-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              displayName: formData.displayName,
              bio: formData.bio,
              timezone: formData.timezone,
              language: formData.language,
              avatar: formData.avatarUrl
            })
          });
          break;
          
        case 'ai-config':
          await fetch('/api/onboarding/save-ai-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tone: formData.aiPersonality.tone,
              responseSpeed: formData.aiPersonality.responseSpeed,
              personalityTraits: formData.aiPersonality.traits,
              contentTypes: formData.contentTypes,
              voiceSample: formData.aiPersonality.voiceSample ? 'uploaded' : null,
              writingSamples: formData.aiPersonality.writingSamples,
              autoLearn: true,
              selectedNicheId: formData.niche || null,
              price: formData.monthlyPrice || null,
              ...(formData.niche && (presets as any)[formData.niche]
                ? (() => {
                    const p = (presets as any)[formData.niche];
                    const dm = customPlaybook.dmSequences
                      ? { ...p.dmSequences, ...customPlaybook.dmSequences }
                      : p.dmSequences;
                    const cadence = customPlaybook.cadence || p.cadence;
                    return {
                      dmSequences: dm,
                      cadence,
                      upsellMenu: customPlaybook.upsellMenu || p.upsellMenu,
                    };
                  })()
                : {}),
            })
          });
          // Route to optimization step instead of inline stepper
          try { router.push('/onboarding/optimize'); } catch {}
          return;
          break;
      }
      
      // Move to next step
      const stepOrder: Step[] = ['profile', 'sell-plan', 'niche', 'platform', 'ai-config', 'plan', 'complete'];
      const currentIndex = stepOrder.indexOf(currentStep);
      
      if (currentIndex < stepOrder.length - 1) {
        setCurrentStep(stepOrder[currentIndex + 1]);
      } else if (currentStep === 'plan') {
        // Complete onboarding: call API to set cookie/server flag, sync client store, then redirect
        try {
          const resp = await fetch('/api/onboarding/complete', { method: 'POST' });
          if (!resp.ok) {
            console.warn('Failed to persist onboarding completion to server');
          }
        } catch (e) {
          console.log('Onboarding completion API not reachable');
        }

        // Mark as completed locally for UI that relies on the store
        try { completeOnboarding(); } catch {}
        try { localStorage.setItem('onboarding_completed', 'true'); } catch {}

        // Show completion screen briefly, then go to dashboard
        setCurrentStep('complete');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setAnimationDirection('backward');
    const stepOrder: Step[] = ['profile', 'sell-plan', 'niche', 'platform', 'ai-config', 'plan'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  // Helper to mark onboarding completed and route
  const completeAndRoute = async () => {
    setLoading(true);
    try {
      try {
        const resp = await fetch('/api/onboarding/complete', { method: 'POST' });
        if (!resp.ok) console.warn('Failed to persist onboarding completion to server');
      } catch {}
      try { completeOnboarding(); } catch {}
      try { localStorage.setItem('onboarding_completed', 'true'); } catch {}
      setCurrentStep('complete');
      setTimeout(() => router.push('/dashboard'), 1200);
    } finally {
      setLoading(false);
    }
  };

  const getStepProgress = () => {
    // Progress aligned to visible step bubbles
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const getVerticalFill = () => {
    // Deprecated: no longer used with CSS-only connectors.
    return '0%';
  };

  // Simple feature-based hints driven by Sell Plan
  const suggestsFlirty = (sellPlan || []).includes('sexting' as any) || (sellPlan || []).includes('ppv' as any);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'profile':
        return (
          <StepShell
            step={1}
            total={totalSteps}
            title={C.welcome.title}
            subtitle={C.welcome.subtitle}
            onBack={handlePrevious}
            onSkip={() => setCurrentStep('sell-plan')}
            onContinue={handleNext}
          >
            <div className="space-y-6">
              <div className="form-group">
                <label className="form-label text-center block mb-2">Display name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g. Ava Hart"
                  className="form-input text-center text-2xl font-semibold"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label text-center block mb-2">Primary language</label>
                <input
                  type="text"
                  value="English (United States)"
                  readOnly
                  className="form-input text-center opacity-70 cursor-not-allowed"
                />
              </div>

              <div className="form-group">
                <label className="form-label text-center block mb-2">Time zone (auto‑detected)</label>
                <input
                  type="text"
                  value={formData.timezone || detectTimezone()}
                  readOnly
                  placeholder="Auto‑detected"
                  className="form-input text-center opacity-70 cursor-not-allowed"
                />
              </div>
            </div>
          </StepShell>
        );

      case 'sell-plan':
        return (
          <StepShell
            step={2}
            total={totalSteps}
            title={C.sellPlan.title}
            subtitle={C.sellPlan.subtitle}
            onBack={handlePrevious}
            onSkip={() => setCurrentStep('niche')}
            onContinue={handleNext}
            rightRail={
              <div className="space-y-2">
                <div className="platform-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Recommended setup</div>
                      <div className="text-xs text-content-tertiary">{C.sellPlan.recommendedTip}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSellPlan(['subs','ppv']); updateOps?.({ sellPlan: ['subs','ppv'] }); handleNext(); }}
                      className="btn-outline"
                    >
                      <Check className="w-4 h-4 mr-1 inline-block" /> {C.sellPlan.primaryCta}
                    </button>
                  </div>
                </div>
              </div>
            }
          >

            <div className="form-group">
              <label className="form-label">Choose what you plan to sell</label>
              <div className="niche-grid">
                {C.sellPlan.options.map((o) => {
                  const selected = sellPlan.includes(o.key as any);
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => {
                        const s = new Set(sellPlan || []);
                        s.has(o.key as any) ? s.delete(o.key as any) : s.add(o.key as any);
                        const next = Array.from(s) as any;
                        setSellPlan(next);
                        updateOps?.({ sellPlan: next });
                      }}
                      className={`niche-card ${selected ? 'selected' : ''}`}
                    >
                      <h4 className="niche-title">{o.label}</h4>
                      {o.caption && <p className="text-xs text-content-tertiary">{o.caption}</p>}
                    </button>
                  );
                })}
              </div>
            </div>

          </StepShell>
        );

      case 'niche':
        return (
          <StepShell
            step={3}
            total={totalSteps}
            title={C.nichesGoals.title}
            subtitle={C.nichesGoals.subtitle}
            onBack={handlePrevious}
            onSkip={() => setCurrentStep('platform')}
            onContinue={handleNext}
          >

            <div className="form-group">
              <label className="form-label">Choose Your Niche</label>
              <div className="niche-grid">
                {niches.map((n) => {
                  const Icon = {
                    dumbbell: Dumbbell,
                    shirt: Camera, /* no Shirt icon in lucide-react here; reuse neutral */
                    'gamepad-2': Gamepad2,
                    sparkles: Sparkles,
                    flame: Flame,
                    'book-open': BookOpen,
                    palette: Palette,
                    star: Star,
                    camera: Camera,
                    users: Users,
                    heart: Heart,
                    target: Target,
                    'wand-2': Wand2,
                    plane: Plane,
                  }[n.icon as keyof any] || Star;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        const preset = (presets as any)[n.id];
                        if (preset) {
                          setFormData({
                            ...formData,
                            niche: n.id,
                            contentTypes: preset.contentTypes,
                            monthlyPrice: preset.price,
                            aiPersonality: {
                              ...formData.aiPersonality,
                              tone: preset.tone,
                              traits: preset.traits,
                            },
                          });
                          try { localStorage.setItem('selectedNiche', n.id); } catch {}
                        } else {
                          setFormData({ ...formData, niche: n.id });
                          try { localStorage.setItem('selectedNiche', n.id); } catch {}
                        }
                        try { setNiches([n.id]); setGoals({ automationLevel: DEFAULTS.automation.defaultPct }); } catch {}
                      }}
                      className={`niche-card ${formData.niche === n.id ? 'selected' : ''}`}
                    >
                      <div className={`niche-icon-container bg-${n.color}-500`}>
                        <Icon className="niche-icon" />
                      </div>
                      <h4 className="niche-title">{n.name}</h4>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.niche && (
              <div className="mt-2">
                <div className="platform-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-content-primary">AI Strategy for {niches.find(x => x.id === formData.niche)?.name}</div>
                    <div className="flex items-center gap-3">
                      {(presets as any)[formData.niche] && (
                        <button
                          type="button"
                          onClick={() => setShowPlaybook(true)}
                          className="text-xs font-semibold text-purple-600 hover:text-purple-700 underline"
                        >
                          View full playbook
                        </button>
                      )}
                      <div className="text-xs text-content-tertiary">Applied automatically</div>
                      {(presets as any)[formData.niche]?.confidence && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            ((presets as any)[formData.niche].confidence === 'high' && 'bg-green-100 text-green-700') ||
                            ((presets as any)[formData.niche].confidence === 'medium' && 'bg-amber-100 text-amber-700') ||
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Confidence: {(presets as any)[formData.niche].confidence}
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="grid sm:grid-cols-3 gap-2 text-sm text-content-secondary">
                    {getPresetTips(formData.niche)?.map((t: string, i: number) => (
                      <li key={i} className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" />{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Full Playbook Modal */}
            {showPlaybook && formData.niche && (presets as any)[formData.niche] && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 relative">
                  <button
                    aria-label="Close"
                    className="absolute top-3 right-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setShowPlaybook(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  {(() => {
                    const p = (presets as any)[formData.niche];
                    return (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <h3 className="text-lg font-semibold">Full Playbook</h3>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  try {
                                    const niche = formData.niche || 'playbook';
                                    const p = (presets as any)[formData.niche as any] || {};
                                    const dm = customPlaybook.dmSequences ? { ...p.dmSequences, ...customPlaybook.dmSequences } : p.dmSequences;
                                    const cadence = customPlaybook.cadence || p.cadence;
                                    const upsellMenu = customPlaybook.upsellMenu || p.upsellMenu;
                                    // Helper: deep strip emojis from all string fields
                                    const stripEmojis = (input: any): any => {
                                      const emojiRegex = /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}]/gu;
                                      const cleanse = (v: any): any => {
                                        if (typeof v === 'string') return v.replace(emojiRegex, '');
                                        if (Array.isArray(v)) return v.map(cleanse);
                                        if (v && typeof v === 'object') {
                                          const out: any = {};
                                          for (const k of Object.keys(v)) out[k] = cleanse(v[k]);
                                          return out;
                                        }
                                        return v;
                                      };
                                      return cleanse(input);
                                    };
                                    const payload = stripEmojis({
                                      niche,
                                      aiPersonality: {
                                        tone: formData.aiPersonality.tone,
                                        traits: formData.aiPersonality.traits,
                                      },
                                      price: formData.monthlyPrice,
                                      contentTypes: formData.contentTypes,
                                      dmSequences: dm,
                                      cadence,
                                      upsellMenu,
                                      kpis: p.kpis,
                                      complianceNotes: p.complianceNotes,
                                      ppvPriceBands: p.ppvPriceBands,
                                      platforms: p.platforms,
                                      exportedAt: new Date().toISOString(),
                                      generatedBy: 'Huntaze',
                                      version: '2025-presets',
                                    });
                                    const json = JSON.stringify(payload, null, 2);
                                    const blob = new Blob([json], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `huntaze-${niche}-playbook.json`;
                                    a.click();
                                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                                    try { track('playbook_exported', { niche, format: 'json', size: json.length }); } catch {}
                                  } catch {}
                                }}
                                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                              >
                                Export JSON
                              </button>
                              <label className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={autoSave}
                                  onChange={(e) => {
                                    setAutoSave(e.target.checked);
                                    try { track(e.target.checked ? 'playbook_autosave_enabled' : 'playbook_autosave_disabled', { niche: formData.niche }); } catch {}
                                  }}
                                />
                                Auto‑save
                              </label>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-content-tertiary">DM sequences, cadence, upsells, pricing, and compliance</p>
                            {p.confidence && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                  (p.confidence === 'high' && 'bg-green-100 text-green-700') ||
                                  (p.confidence === 'medium' && 'bg-amber-100 text-amber-700') ||
                                  'bg-gray-100 text-gray-700'
                                }`}
                              >
                                Confidence: {p.confidence}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="border border-border-light rounded-lg p-4">
                            <div className="font-semibold mb-2">7‑Day DM Sequence</div>
                            <ul className="space-y-3 text-sm">
                              {(['day1','day2','day3','day4','day5','day6','day7'] as const).map(key => {
                                const currentVal = (customPlaybook.dmSequences && customPlaybook.dmSequences[key]) || p.dmSequences[key];
                                const isEditing = !!editingDM[key];
                                return (
                                  <li key={key}>
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium uppercase text-xs mt-1 mr-1">{key}</span>
                                      <div className="flex-1">
                                        {isEditing ? (
                                          <div className="flex items-start gap-2">
                                            <textarea
                                              defaultValue={currentVal}
                                              className="flex-1 p-2 border rounded min-h-[70px]"
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setCustomPlaybook(prev => ({
                                                  ...prev,
                                                  dmSequences: { ...(prev.dmSequences || {}), [key]: val },
                                                }));
                                              }}
                                            />
                                            <div className="flex flex-col gap-2">
                                              <button
                                                className="px-3 py-1 text-xs bg-green-600 text-white rounded"
                                                onClick={async () => {
                                                  setEditingDM(prev => ({ ...prev, [key]: false }));
                                                  if (autoSave) await saveDraft('dm');
                                                }}
                                              >
                                                Enregistrer
                                              </button>
                                              <button
                                                className="px-3 py-1 text-xs bg-gray-100 rounded"
                                                onClick={() => setEditingDM(prev => ({ ...prev, [key]: false }))}
                                              >
                                                Annuler
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="group flex items-start gap-2">
                                            <span className="flex-1">{currentVal}</span>
                                            <button
                                              type="button"
                                              className="text-[11px] text-blue-600 hover:underline mr-1"
                                              onClick={() => setEditingDM(prev => ({ ...prev, [key]: true }))}
                                            >
                                              Personnaliser
                                            </button>
                                            <button
                                              aria-label={`Copy ${key} message`}
                                              className="opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                              onClick={() => copyToClipboard(`Day ${key} message`, currentVal, { event: 'dm_sequence_copied', niche: formData.niche, day: key, message_length: currentVal?.length || 0 })}
                                            >
                                              <Copy className="w-4 h-4" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <ComplianceChecker
                                      content={currentVal}
                                      niche={formData.niche || 'gfe'}
                                      context="dm_message"
                                      className="mt-2"
                                      autoCheck={false}
                                    />
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                          <div className="space-y-4">
                            <div className="border border-border-light rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold">Cadence {(customPlaybook.cadence ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Modifié</span> : null)}</div>
                                <button
                                  type="button"
                                  className="text-[11px] text-blue-600 hover:underline"
                                  onClick={() => setEditCadence(!editCadence)}
                                >
                                  {editCadence ? 'Annuler' : 'Personnaliser'}
                                </button>
                              </div>
                              {editCadence ? (
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <label className="flex flex-col">
                                    <span className="text-xs text-gray-500">Posts/week</span>
                                    <input
                                      type="number"
                                      defaultValue={(customPlaybook.cadence?.postsPerWeek ?? p.cadence.postsPerWeek)}
                                      className="p-2 border rounded"
                                      onChange={(e) => setCustomPlaybook(prev => ({
                                        ...prev,
                                        cadence: {
                                          postsPerWeek: Number(e.target.value || 0),
                                          storiesPerWeek: prev.cadence?.storiesPerWeek ?? p.cadence.storiesPerWeek,
                                          dmCheckinsPerDay: prev.cadence?.dmCheckinsPerDay ?? p.cadence.dmCheckinsPerDay,
                                        }
                                      }))}
                                    />
                                  </label>
                                  <label className="flex flex-col">
                                    <span className="text-xs text-gray-500">Stories/week</span>
                                    <input
                                      type="number"
                                      defaultValue={(customPlaybook.cadence?.storiesPerWeek ?? p.cadence.storiesPerWeek)}
                                      className="p-2 border rounded"
                                      onChange={(e) => setCustomPlaybook(prev => ({
                                        ...prev,
                                        cadence: {
                                          postsPerWeek: prev.cadence?.postsPerWeek ?? p.cadence.postsPerWeek,
                                          storiesPerWeek: Number(e.target.value || 0),
                                          dmCheckinsPerDay: prev.cadence?.dmCheckinsPerDay ?? p.cadence.dmCheckinsPerDay,
                                        }
                                      }))}
                                    />
                                  </label>
                                  <label className="flex flex-col">
                                    <span className="text-xs text-gray-500">DM/day</span>
                                    <input
                                      type="number"
                                      defaultValue={(customPlaybook.cadence?.dmCheckinsPerDay ?? p.cadence.dmCheckinsPerDay)}
                                      className="p-2 border rounded"
                                      onChange={(e) => setCustomPlaybook(prev => ({
                                        ...prev,
                                        cadence: {
                                          postsPerWeek: prev.cadence?.postsPerWeek ?? p.cadence.postsPerWeek,
                                          storiesPerWeek: prev.cadence?.storiesPerWeek ?? p.cadence.storiesPerWeek,
                                          dmCheckinsPerDay: Number(e.target.value || 0),
                                        }
                                      }))}
                                    />
                                  </label>
                                  <div className="col-span-3 flex items-center gap-2 mt-2">
                                    <button
                                      className="px-3 py-1 text-xs bg-green-600 text-white rounded"
                                      onClick={async () => {
                                        setEditCadence(false);
                                        if (autoSave) await saveDraft('cadence');
                                      }}
                                    >
                                      Enregistrer
                                    </button>
                                    <button
                                      className="px-3 py-1 text-xs bg-gray-100 rounded"
                                      onClick={() => {
                                        setEditCadence(false);
                                        setCustomPlaybook(prev => ({ ...prev, cadence: undefined }));
                                      }}
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="text-sm">Posts: {(customPlaybook.cadence?.postsPerWeek ?? p.cadence.postsPerWeek)}/week</div>
                                  <div className="text-sm">Stories: {(customPlaybook.cadence?.storiesPerWeek ?? p.cadence.storiesPerWeek)}/week</div>
                                  <div className="text-sm">DM check‑ins: {(customPlaybook.cadence?.dmCheckinsPerDay ?? p.cadence.dmCheckinsPerDay)}/day</div>
                                </>
                              )}
                            </div>
                            <div className="border border-border-light rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold">Upsell Menu {(customPlaybook.upsellMenu ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Modifié</span> : null)}</div>
                                <button
                                  type="button"
                                  className="text-[11px] text-blue-600 hover:underline"
                                  onClick={() => setEditUpsells(!editUpsells)}
                                >
                                  {editUpsells ? 'Terminer' : 'Personnaliser'}
                                </button>
                              </div>
                              {editUpsells ? (
                                <ul className="space-y-3 text-sm">
                                  {(customPlaybook.upsellMenu || p.upsellMenu).map((u: any, idx: number) => (
                                    <li key={idx} className="border rounded p-3">
                                      <div className="grid grid-cols-3 gap-3">
                                        <EditableField
                                          label="Name"
                                          value={u.name}
                                          onSave={async (val) => {
                                            setCustomPlaybook(prev => {
                                              const base = prev.upsellMenu || p.upsellMenu;
                                              const next = base.map((x: any, i: number) => i === idx ? { ...x, name: val } : x);
                                              return { ...prev, upsellMenu: next };
                                            });
                                            if (autoSave) await saveDraft('upsells');
                                          }}
                                        />
                                        <EditableField
                                          label="Price"
                                          value={u.price}
                                          onSave={async (val) => {
                                            setCustomPlaybook(prev => {
                                              const base = prev.upsellMenu || p.upsellMenu;
                                              const next = base.map((x: any, i: number) => i === idx ? { ...x, price: val } : x);
                                              return { ...prev, upsellMenu: next };
                                            });
                                            if (autoSave) await saveDraft('upsells');
                                          }}
                                        />
                                        <EditableField
                                          label="ETA"
                                          value={u.eta}
                                          onSave={async (val) => {
                                            setCustomPlaybook(prev => {
                                              const base = prev.upsellMenu || p.upsellMenu;
                                              const next = base.map((x: any, i: number) => i === idx ? { ...x, eta: val } : x);
                                              return { ...prev, upsellMenu: next };
                                            });
                                            if (autoSave) await saveDraft('upsells');
                                          }}
                                        />
                                      </div>
                                    </li>
                                  ))}
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="px-3 py-1 text-xs bg-green-600 text-white rounded"
                                      onClick={async () => {
                                        setEditUpsells(false);
                                        if (autoSave) await saveDraft('upsells');
                                      }}
                                    >
                                      Enregistrer
                                    </button>
                                    <button
                                      className="px-3 py-1 text-xs bg-gray-100 rounded"
                                      onClick={() => {
                                        setEditUpsells(false);
                                        setCustomPlaybook(prev => ({ ...prev, upsellMenu: undefined }));
                                      }}
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </ul>
                              ) : (
                                <ul className="space-y-2 text-sm">
                                  {(customPlaybook.upsellMenu || p.upsellMenu).map((u: any, idx: number) => (
                                    <li key={idx} className="flex items-center justify-between group">
                                      <span>{u.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-content-tertiary">{u.price} · {u.eta}</span>
                                        <button
                                          aria-label={`Copy upsell: ${u.name}`}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                          onClick={() => copyToClipboard('Upsell item', `${u.name} — ${u.price} — ${u.eta}`, { event: 'upsell_item_copied', niche: formData.niche, name: u.name, price: u.price })}
                                        >
                                          <Copy className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div className="border border-border-light rounded-lg p-4">
                              <div className="font-semibold mb-2">KPIs & Compliance</div>
                              <div className="text-sm">Conv: {p.kpis.subConvRate} · PPV: {p.kpis.ppvAttachRate} · Churn: {p.kpis.monthlyChurn}</div>
                              <ul className="mt-2 text-sm list-disc list-inside text-content-secondary">
                                {p.complianceNotes?.map((c: string, idx: number) => (
                                  <li key={idx}>{c}</li>
                                ))}
                              </ul>
                            </div>
                            {p.ppvPriceBands?.length ? (
                              <div className="border border-border-light rounded-lg p-4">
                                <div className="font-semibold mb-2">Pricing Guidance</div>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  {p.ppvPriceBands.map((band: string, i: number) => (
                                    <div key={i} className="bg-gray-50 dark:bg-gray-800/60 p-2 rounded text-sm">
                                      <div className="text-xs text-gray-500">Tier {i + 1}</div>
                                      <div className="font-medium">{band}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Current Monthly Revenue (range)</label>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Previous range" onClick={() => stepRevenue('current', -1)} className="p-2 rounded-lg border border-border-light hover:border-purple-600/40 text-content-tertiary hover:text-content-primary">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <select
                    value={formData.currentMonthlyRevenue}
                    onChange={(e) => setFormData({ ...formData, currentMonthlyRevenue: e.target.value })}
                    className="form-select flex-1"
                  >
                    <option value="0-1k">$0 – $1k</option>
                    <option value="1k-5k">$1k – $5k</option>
                    <option value="5k-10k">$5k – $10k</option>
                    <option value="10k-25k">$10k – $25k</option>
                    <option value="25k-50k">$25k – $50k</option>
                    <option value=">50k">$50k+</option>
                  </select>
                  <button type="button" aria-label="Next range" onClick={() => stepRevenue('current', 1)} className="p-2 rounded-lg border border-border-light hover:border-purple-600/40 text-content-tertiary hover:text-content-primary">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Monthly Revenue (range)</label>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Previous range" onClick={() => stepRevenue('target', -1)} className="p-2 rounded-lg border border-border-light hover:border-purple-600/40 text-content-tertiary hover:text-content-primary">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <select
                    value={formData.targetMonthlyRevenue}
                    onChange={(e) => setFormData({ ...formData, targetMonthlyRevenue: e.target.value })}
                    className="form-select flex-1"
                  >
                    <option value="1k-5k">$1k – $5k</option>
                    <option value="5k-10k">$5k – $10k</option>
                    <option value="10k-25k">$10k – $25k</option>
                    <option value="25k-50k">$25k – $50k</option>
                    <option value=">50k">$50k+</option>
                  </select>
                  <button type="button" aria-label="Next range" onClick={() => stepRevenue('target', 1)} className="p-2 rounded-lg border border-border-light hover:border-purple-600/40 text-content-tertiary hover:text-content-primary">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </StepShell>
        );

      case 'platform':
        return (
          <StepShell
            step={4}
            total={totalSteps}
            title={C.connect.title}
            subtitle={C.connect.subtitle}
            onBack={handlePrevious}
            onSkip={() => setCurrentStep('ai-config')}
            onContinue={handleNext}
          >
            {(sellPlan || []).includes('calls' as any) && (
              <div className="rounded-lg border p-3 text-xs text-content-tertiary mb-3">
                Calls are selected in your Sell Plan. Call options become available after platform connect.
              </div>
            )}
            <div className="platform-grid">
              {/* OnlyFans */}
              <div className={`platform-card ${formData.connectedPlatforms.includes('onlyfans') ? 'selected' : ''}`}>
                <div className="platform-header">
                  <div className="platform-icon-container bg-blue-500">
                    <MessageSquare className="platform-icon text-white" />
                  </div>
                  <h3 className="platform-name">OnlyFans</h3>
                </div>
                <ul className="platform-features">
                  <li className="platform-feature"><Check className="platform-feature-icon" /><span>Smart auto‑DMs</span></li>
                  <li className="platform-feature"><Check className="platform-feature-icon" /><span>Schedule posts</span></li>
                  <li className="platform-feature"><Check className="platform-feature-icon" /><span>Insights & alerts</span></li>
                </ul>
                <button
                  onClick={async () => {
                    if (!formData.connectedPlatforms.includes('onlyfans')) {
                      setLoading(true);
                      try {
                        const response = await fetch('/api/onboarding/connect-platform', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ platform: 'onlyfans', action: 'connect' })
                        });
                        const data = await response.json();
                        if (data.authUrl) {
                          // In production, redirect to OAuth
                          // window.location.href = data.authUrl;
                          // For demo, just mark as connected and apply auto calibration
                          setFormData({ 
                            ...formData, 
                            connectedPlatforms: [...formData.connectedPlatforms, 'onlyfans'] 
                          });
                          try {
                            const res = await fetch('/api/onboarding/mock-ingest');
                            if (res.ok) {
                              const mock = await res.json();
                              const niche = formData.niche || (typeof window !== 'undefined' ? localStorage.getItem('selectedNiche') || '' : '');
                              const def = NICHES.find(x => x.id === niche);
                              const mult = def?.ppvMultiplier || 1.0;
                              const typical = Math.round((mock.ppvAnchor || DEFAULTS.ppv.typical) * mult);
                              const min = Math.max(DEFAULTS.ppv.min, Math.round(typical * 0.33));
                              const max = Math.round(typical * 2.5);
                              updateMonetization({ ppvRange: { min, typical, max } });
                              if (Array.isArray(mock.peakHours) && mock.peakHours.length > 0) {
                                const h = mock.peakHours[0];
                                updateOps({ activeHours: [{ start: h.start, end: h.end }] });
                              }
                              if (mock.sendVolume === 'high') {
                                updateOps({ dailyCaps: { global: DEFAULTS.caps.dailyGlobal, vip: DEFAULTS.caps.dailyVip } });
                              }
                              if (mock.suggestLowerWhaleThreshold) {
                                updateSegmentation({ whaleThreshold: mock.suggestLowerWhaleThreshold });
                              }
                              if (mock.igRisk || mock.ttRisk) {
                                updateBoundaries({ platformRulesFlags: { IG: !!mock.igRisk, TT: !!mock.ttRisk } });
                              }
                            }
                          } catch {}
                          alert('OnlyFans connected! Auto‑calibration applied. (Demo mode)');
                        }
                      } catch (error) {
                        alert('Failed to connect OnlyFans');
                      } finally {
                        setLoading(false);
                      }
                    } else {
                      // Disconnect
                      setFormData({ 
                        ...formData, 
                        connectedPlatforms: formData.connectedPlatforms.filter(p => p !== 'onlyfans') 
                      });
                    }
                  }}
                  className="btn-primary w-full mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : formData.connectedPlatforms.includes('onlyfans') ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Connected
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Connect OnlyFans
                    </>
                  )}
                </button>
              </div>

              {/* Social Media Promotion */}
              <div className="platform-card">
                <div className="platform-header">
                  <div className="platform-icon-container bg-gradient-to-br from-purple-500 to-pink-500">
                    <Share2 className="platform-icon text-white" />
                  </div>
                  <h3 className="platform-name">Social Media</h3>
                </div>
                <p className="platform-description">Promote your OnlyFans across social platforms</p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {/* Instagram */}
                  <button
                    onClick={() => { sessionStorage.setItem('onboarding_return', 'platform'); window.location.href = '/api/auth/instagram'; }}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg text-white bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90"
                    aria-label="Connect Instagram"
                  >
                    <Instagram className="w-4 h-4" /> IG
                  </button>
                  {/* TikTok */}
                  <button
                    onClick={() => { sessionStorage.setItem('onboarding_return', 'platform'); window.location.href = '/api/auth/tiktok'; }}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg bg-black text-white border border-neutral-700 hover:border-pink-500/50"
                    aria-label="Connect TikTok"
                  >
                    <Music2 className="w-4 h-4 text-cyan-400" /> TT
                  </button>
                  {/* Reddit */}
                  <button
                    onClick={() => { sessionStorage.setItem('onboarding_return', 'platform'); window.location.href = '/api/auth/reddit'; }}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg text-white bg-orange-500 hover:bg-orange-600"
                    aria-label="Connect Reddit"
                  >
                    <Megaphone className="w-4 h-4" /> Reddit
                  </button>
                </div>
              </div>
            </div>
          </StepShell>
        );

      case 'ai-config':
        return (
          <StepShell
            step={5}
            total={totalSteps}
            title={C.persona.title}
            subtitle={C.persona.subtitle}
            onBack={handlePrevious}
            onSkip={() => setCurrentStep('plan')}
            onContinue={handleNext}
            rightRail={<LoadDemoButton />}
          >

            {/* AI Tone Selection */}
            <div className="form-group">
              <label className="form-label">Conversation tone</label>
              {suggestsFlirty && (
                <p className="text-xs text-content-tertiary mb-2">Tip: With Sexting or PPV selected, a flirty tone tends to perform best.</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 'flirty', label: 'Flirty', desc: 'Playful and teasing' },
                  { value: 'friendly', label: 'Friendly', desc: 'Warm and welcoming' },
                  { value: 'professional', label: 'Professional', desc: 'Business-like' },
                  { value: 'casual', label: 'Casual', desc: 'Laid-back and chill' },
                ].map((tone) => {
                  const recommended = formData.niche === 'gfe' && tone.value === 'flirty';
                  return (
                    <button
                      key={tone.value}
                      onClick={() => setFormData({
                        ...formData,
                        aiPersonality: { ...formData.aiPersonality, tone: tone.value as any }
                      })}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        formData.aiPersonality.tone === tone.value
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {recommended && (
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">Recommended</span>
                      )}
                      <div className="font-semibold">{tone.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{tone.desc}</div>
                    </button>
                  );
                })}
              </div>
              {formData.niche === 'gfe' && (
                <p className="text-xs text-content-tertiary mt-2">Recommended for Girlfriend Experience conversations.</p>
              )}
            </div>

            {/* Personality Traits */}
            <div className="form-group">
              <label className="form-label">Personality Traits{(() => {
                const p = (formData.niche && (presets as any)[formData.niche]) || null;
                if (!p) return '';
                const a = (formData.aiPersonality.traits || []).slice().sort().join('|');
                const b = (p.traits || []).slice().sort().join('|');
                return a !== b ? ' • Modifié' : '';
              })()}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Funny', 'Romantic', 'Mysterious', 'Dominant', 'Submissive', 
                  'Intellectual', 'Adventurous', 'Caring', 'Confident', 'Playful'
                ].map((trait) => (
                  <button
                    key={trait}
                    onClick={() => {
                      const traits = formData.aiPersonality.traits.includes(trait)
                        ? formData.aiPersonality.traits.filter(t => t !== trait)
                        : [...formData.aiPersonality.traits, trait];
                      setFormData({
                        ...formData,
                        aiPersonality: { ...formData.aiPersonality, traits }
                      });
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.aiPersonality.traits.includes(trait)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {trait}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <EditableField
                  label="Edit traits (comma separated)"
                  value={(formData.aiPersonality.traits || []).join(', ')}
                  onSave={(newTraits) => {
                    const arr = newTraits.split(',').map((t) => t.trim()).filter(Boolean);
                    setFormData({
                      ...formData,
                      aiPersonality: { ...formData.aiPersonality, traits: arr },
                    });
                  }}
                />
              </div>
            </div>

            {/* Pricing with inline customization */}
            <div className="form-group">
              <EditableField
                label={`Suggested monthly price ($/month)${(() => {
                  const p = (formData.niche && (presets as any)[formData.niche]) || null;
                  if (!p) return '';
                  return String(formData.monthlyPrice || '').trim() !== String(p.price || '').trim() ? ' • Modifié' : '';
                })()}`}
                value={String(formData.monthlyPrice || '')}
                onSave={(newPrice) => {
                  setFormData({ ...formData, monthlyPrice: newPrice })
                  const n = parseFloat(String(newPrice))
                  if (!isNaN(n)) {
                    try { monetizationSchema.parse({ subPrice: n }); updateMonetization({ subPrice: n }); } catch {}
                  }
                }}
              />
              <p className="text-xs text-content-tertiary mt-1">Auto‑set from niche. You can adjust anytime.</p>
              <p className="text-xs text-content-tertiary mt-1">
                Guidance: if your PPV content is usually under $10, keep a lower subscription to maximize volume. If you sell higher‑priced PPV bundles, set your subscription higher for positioning.
              </p>
            </div>

            {/* Dynamic Preview (DM + PPV suggestion) */}
            <div className="rounded-2xl p-6 border border-border-light bg-white dark:bg-gray-900">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Live Preview</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI DM Example</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {(() => {
                      const tone = formData.aiPersonality.tone;
                      const niche = formData.niche;
                      const flair = niche === 'cosplay' ? '✨' : niche === 'dominatrix' ? '👠' : niche === 'gfe' ? '💕' : '⭐️';
                      if (tone === 'friendly') return `Hi there! I’m so glad you’re here ${flair} What do you want to see next?`;
                      if (tone === 'flirty') return `Hey you… I saved something special for you ${flair} Want a peek?`;
                      if (tone === 'professional') return `Hello! I’m here to help — tell me what you’re in the mood for today.`;
                      return `Hey! I’ve got new ideas lined up — want me to surprise you ${flair}?`;
                    })()}
                  </div>
                </div>
                <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suggested PPV (by niche)</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(() => {
                      const niche = formData.niche;
                      const def = NICHES.find(x => x.id === niche);
                      const mult = def?.ppvMultiplier || 1.0;
                      const typical = Math.round(DEFAULTS.ppv.typical * mult);
                      try { monetizationSchema.parse({ ppvRange: { typical } }); } catch {}
                      return `$${typical}`;
                    })()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Auto‑calibrates after OnlyFans connect</div>
                </div>
              </div>
            </div>

            {/* AI Personality Setup */}
            <div className="form-group">
              <label className="form-label">Welcome message (sent to new fans)</label>
              <textarea
                placeholder="Ex: Welcome! I’m excited you’re here — check my latest post and say hi!"
                className="form-textarea"
                rows={4}
                onChange={(e) => setFormData({
                  ...formData,
                  welcomeMessage: e.target.value
                })}
              />
              <p className="text-xs text-gray-500 mt-2">Used to greet new subscribers automatically.</p>
              <ComplianceChecker
                content={formData.welcomeMessage || ''}
                niche={formData.niche || 'gfe'}
                context="dm_message"
                className="mt-2"
                onContentChange={(fixed) => setFormData({ ...formData, welcomeMessage: fixed })}
              />
            </div>

            {/* Writing Examples */}
            <div className="form-group">
              <label className="form-label">Your typical replies (optional)</label>
              <textarea
                placeholder="Example: Thanks for the support! What kind of content do you like most?"
                className="form-textarea"
                rows={5}
                onChange={(e) => setFormData({
                  ...formData,
                  aiPersonality: { 
                    ...formData.aiPersonality, 
                    writingSamples: e.target.value.split('\n').filter(s => s.trim()) 
                  }
                })}
              />
            </div>

            {/* Live Preview & Apply multipliers */}
            <div className="rounded-2xl p-6 border border-border-light bg-white dark:bg-gray-900">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Live Preview</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI DM Example</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {(() => {
                      const niches = formData.niche ? [formData.niche] : [];
                      const price = `$${ppvTypicalWithMultipliers(niches)}`;
                      const primary = formData.niche || 'generic';
                      const tmpl = (PREVIEW_TEMPLATES as any)[primary] || PREVIEW_TEMPLATES.generic;
                      return tmpl(price);
                    })()}
                  </div>
                </div>
                <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suggested PPV (by niche)</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(() => `$${ppvTypicalWithMultipliers(formData.niche ? [formData.niche] : [])}`)()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Auto‑calibrates after OnlyFans connect</div>
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const niches = formData.niche ? [formData.niche] : [];
                    const newTyp = ppvTypicalWithMultipliers(niches);
                    updateMonetization({ ppvRange: { min: DEFAULTS.ppv.min, typical: newTyp, max: DEFAULTS.ppv.max } });
                    alert(`Typical PPV → $${newTyp} (based on niche multipliers)`);
                  }}
                >
                  {C.monetization.applyMultipliers}
                </button>
              </div>
            </div>

          </StepShell>
        );

      case 'plan':
        return (
          <StepShell
            step={6}
            total={totalSteps}
            title={C.launch.title}
            onBack={handlePrevious}
            onSkip={completeAndRoute}
            onContinue={completeAndRoute}
            rightRail={<LoadDemoButton />}
          >

            <div className="pricing-grid">
              {/* Starter Plan */}
              <div className="pricing-card">
                <div className="pricing-header">
                  <h3 className="pricing-title">Starter</h3>
                  <div className="pricing-price">
                    $0<span className="pricing-price-unit">/mo</span>
                  </div>
                  <p className="pricing-description">Perfect for beginners</p>
                </div>
                <ul className="pricing-features">
                  <li className="pricing-feature">
                    <Check className="pricing-feature-icon" />
                    <span className="pricing-feature-text">Basic AI assistant</span>
                  </li>
                  <li className="pricing-feature">
                    <Check className="pricing-feature-icon" />
                    <span className="pricing-feature-text">Up to 100 messages/mo</span>
                  </li>
                  <li className="pricing-feature">
                    <Check className="pricing-feature-icon" />
                    <span className="pricing-feature-text">Email support</span>
                  </li>
                </ul>
                <button 
                  onClick={completeAndRoute}
                  className="btn-secondary w-full"
                >
                  Continue Free
                </button>
              </div>

              {/* Pro Plan */}
              <div className="pricing-card recommended">
                <span className="pricing-badge">Recommended</span>
                <div className="pricing-header">
                  <h3 className="pricing-title">Pro</h3>
                  <div className="pricing-price">
                    $49<span className="pricing-price-unit">/mo</span>
                  </div>
                  <p className="pricing-description">Best for growing creators</p>
                </div>
                <ul className="pricing-features">
                  <li className="pricing-feature">
                    <Check className="pricing-feature-icon" />
                    <span className="pricing-feature-text">Advanced AI with learning</span>
                  </li>
                  <li className="pricing-feature">
                    <Check className="pricing-feature-icon" />
                    <span className="pricing-feature-text">Unlimited messaging</span>
                  </li>
                  <li className="pricing-feature">
                    <Check className="pricing-feature-icon" />
                    <span className="pricing-feature-text">Priority support</span>
                  </li>
                  <li className="pricing-feature">
                    <Check className="pricing-feature-icon" />
                    <span className="pricing-feature-text">Analytics dashboard</span>
                  </li>
                </ul>
                <button onClick={completeAndRoute} className="btn-primary w-full">
                  Start Free Trial
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="pricing-card">
                <div className="pricing-header">
                  <h3 className="pricing-title">Enterprise</h3>
                  <div className="pricing-price">
                    $199<span className="pricing-price-unit">/mo</span>
                  </div>
                  <p className="pricing-description">For agencies & teams</p>
                </div>
                <ul className="pricing-features">
                  <li className="pricing-feature">
                    <Check className="pricing-feature-icon" />
                    <span className="pricing-feature-text">Everything in Pro</span>
                  </li>
                  <li className="pricing-feature">
                    <Check className="pricing-feature-icon" />
                    <span className="pricing-feature-text">Team management</span>
                  </li>
                  <li className="pricing-feature">
                    <Check className="pricing-feature-icon" />
                    <span className="pricing-feature-text">Custom integrations</span>
                  </li>
                  <li className="pricing-feature">
                    <Check className="pricing-feature-icon" />
                    <span className="pricing-feature-text">Dedicated support</span>
                  </li>
                </ul>
                <button className="btn-outline w-full">
                  Contact Sales
                </button>
              </div>
            </div>
          </StepShell>
        );

      case 'complete':
        return (
          <div className="complete-container">
            <div className="complete-icon-container">
              <Rocket className="complete-icon" />
            </div>
            
            <h2 className="complete-title">You're all set! 🎉</h2>
            <p className="complete-message">
              Your AI assistant is ready to help you grow
            </p>

            <div className="complete-stats">
              <div className="complete-stat">
                <div className="complete-stat-value">24/7</div>
                <div className="complete-stat-label">AI Response</div>
              </div>
              <div className="complete-stat">
                <div className="complete-stat-value">5x</div>
                <div className="complete-stat-label">Time Saved</div>
              </div>
              <div className="complete-stat">
                <div className="complete-stat-value">∞</div>
                <div className="complete-stat-label">Possibilities</div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="btn-primary"
            >
              <Sparkles className="w-5 h-5" />
              Go to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface flex flex-col">
      {/* Top progress (desktop & mobile) */}
      <div className="progress-container max-w-4xl mx-auto w-full px-4 pt-8">
        <div className="progress-steps">
          {steps.map((step, index) => {
            const currentStepIndex = steps.findIndex(s => s.id === currentStep);
            const isActive = step.id === currentStep;
            const isCompleted = currentStepIndex > index;
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => isCompleted && setCurrentStep(step.id)}
              >
                <div className="progress-step-indicator">
                  {isCompleted && !isActive ? (
                    <Check className="progress-step-icon" />
                  ) : (
                    <Icon className="progress-step-icon" />
                  )}
                </div>
                <span className="progress-step-label">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-8 pb-safe">
        <div className="max-w-3xl mx-auto">
          <div className="step-content">
            {renderStepContent()}

            {/* Navigation */}
            {currentStep !== 'complete' && (
              <div className="nav-buttons">
                {currentStep !== 'profile' ? (
                  <button onClick={handlePrevious} className="btn-back">
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {currentStep !== 'plan' && (
                  <button onClick={handleNext} disabled={loading} className="btn-continue">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
