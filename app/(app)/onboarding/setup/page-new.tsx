'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Globe,
  Target,
  Palette,
  MessageSquare,
  Languages,
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
  Sparkles,
  Shield,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import './onboarding-styles.css';

type Step = 'profile' | 'niche' | 'platform' | 'ai-config' | 'plan' | 'complete';

export default function OnboardingSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  
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
    
    // Niche & Goals
    niche: '',
    goals: [] as string[],
    contentTypes: [] as string[],
    targetMonthlyRevenue: '',
    currentMonthlyRevenue: '',
    
    // AI Config
    personality: '',
    responseStyle: 'flirty',
    monthlyPrice: '9.99',
    welcomeMessage: '',
    
    // Platform
    connectedPlatforms: [] as string[],
  });

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'fr', name: 'French', flag: '🇫🇷' }
  ];

  const niches = [
    { id: 'fitness', name: 'Fitness & Health', icon: '💪', color: 'emerald' },
    { id: 'fashion', name: 'Fashion & Beauty', icon: '👗', color: 'pink' },
    { id: 'gaming', name: 'Gaming', icon: '🎮', color: 'purple' },
    { id: 'lifestyle', name: 'Lifestyle', icon: '✨', color: 'blue' },
    { id: 'adult', name: 'Adult Content', icon: '🔥', color: 'red' },
    { id: 'education', name: 'Education & Coaching', icon: '📚', color: 'indigo' },
    { id: 'art', name: 'Art & Creative', icon: '🎨', color: 'orange' },
    { id: 'other', name: 'Other', icon: '🌟', color: 'gray' }
  ];

  const businessGoals = [
    { id: 'revenue', name: 'Grow Revenue', icon: DollarSign, description: 'Maximize earnings from content' },
    { id: 'engagement', name: 'Increase Engagement', icon: Heart, description: 'Build stronger fan relationships' },
    { id: 'time', name: 'Save Time', icon: Clock, description: 'Automate repetitive tasks' },
    { id: 'growth', name: 'Grow Audience', icon: Users, description: 'Attract more subscribers' }
  ];

  const contentTypes = [
    { id: 'photos', name: 'Photos', icon: Image },
    { id: 'videos', name: 'Videos', icon: Video },
    { id: 'live', name: 'Live Streams', icon: Mic },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'posts', name: 'Text Posts', icon: FileText }
  ];

  const platforms = [
    { id: 'onlyfans', name: 'OnlyFans', icon: 'OF', color: 'blue', oauth: false },
    { id: 'threads', name: 'Threads', icon: '@', color: 'gray', oauth: true, url: '/auth/threads' },
    { id: 'instagram', name: 'Instagram', icon: 'IG', color: 'gradient', oauth: true, url: '/auth/instagram' },
    { id: 'tiktok', name: 'TikTok', icon: 'TT', color: 'black', oauth: true, url: '/auth/tiktok' },
    { id: 'reddit', name: 'Reddit', icon: 'R', color: 'orange', oauth: true, url: '/auth/reddit' },
    { id: 'patreon', name: 'Patreon', icon: 'P', color: 'coral', comingSoon: true }
  ];

  const responseStyles = [
    { id: 'friendly', name: 'Friendly & Casual', description: 'Warm and approachable tone' },
    { id: 'flirty', name: 'Flirty & Playful', description: 'Fun and teasing interactions' },
    { id: 'professional', name: 'Professional', description: 'Business-focused communication' },
    { id: 'motivational', name: 'Motivational', description: 'Inspiring and supportive' },
    { id: 'educational', name: 'Educational', description: 'Informative and helpful' },
    { id: 'mysterious', name: 'Mysterious', description: 'Intriguing and enigmatic' }
  ];

  const togglePlatform = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      connectedPlatforms: prev.connectedPlatforms.includes(id)
        ? prev.connectedPlatforms.filter((p) => p !== id)
        : [...prev.connectedPlatforms, id],
    }));
  };

  const toggleGoal = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(id)
        ? prev.goals.filter((g) => g !== id)
        : [...prev.goals, id],
    }));
  };

  const toggleContentType = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(id)
        ? prev.contentTypes.filter((c) => c !== id)
        : [...prev.contentTypes, id],
    }));
  };

  const steps = [
    { id: 'profile', title: 'Profile', icon: User, description: 'Basic information' },
    { id: 'niche', title: 'Business', icon: Target, description: 'Your goals & niche' },
    { id: 'platform', title: 'Platforms', icon: Zap, description: 'Connect accounts' },
    { id: 'ai-config', title: 'AI Setup', icon: Bot, description: 'Configure assistant' },
    { id: 'plan', title: 'Plan', icon: CreditCard, description: 'Choose pricing' },
  ];

  const handleNext = async () => {
    setLoading(true);
    setAnimating(true);
    
    // Add step-specific validations
    if (currentStep === 'profile' && !formData.gdprConsent) {
      alert('Please accept the Terms and Privacy Policy to continue.');
      setLoading(false);
      setAnimating(false);
      return;
    }

    // Simulate save operations (simplified for demo)
    await new Promise(resolve => setTimeout(resolve, 800));

    const stepOrder: Step[] = ['profile', 'niche', 'platform', 'ai-config', 'plan'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    } else if (currentStep === 'plan') {
      setCurrentStep('complete');
    }
    
    setLoading(false);
    setTimeout(() => setAnimating(false), 300);
  };

  const handlePrevious = () => {
    setAnimating(true);
    const stepOrder: Step[] = ['profile', 'niche', 'platform', 'ai-config', 'plan'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
    setTimeout(() => setAnimating(false), 300);
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(s => s.id === currentStep);
  };

  const progress = ((getCurrentStepIndex() + 1) / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'profile':
        return (
          <div className={`step-content ${animating ? 'animating' : ''}`}>
            <div className="step-header">
              <div className="step-icon-wrapper">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="step-title">Welcome to Huntaze! 👋</h2>
                <p className="step-subtitle">
                  Let's personalize your experience with some basic information
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Display Name */}
              <div className="form-group">
                <label className="form-label">
                  Display Name <span className="text-content-tertiary">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Your creator name"
                  className="form-input"
                />
              </div>

              {/* Language Selection */}
              <div className="form-group">
                <label className="form-label">Language</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setFormData({ ...formData, language: lang.code })}
                      className={`language-option ${formData.language === lang.code ? 'active' : ''}`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Type & Frequency */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Business Type</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value as any })}
                    className="form-select"
                  >
                    <option value="individual">Individual Creator</option>
                    <option value="agency">Agency</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Content Frequency</label>
                  <select
                    value={formData.contentFrequency}
                    onChange={(e) => setFormData({ ...formData, contentFrequency: e.target.value as any })}
                    className="form-select"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div className="form-group">
                <label className="form-label">
                  Bio <span className="text-content-tertiary">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell your fans about yourself..."
                  className="form-textarea"
                />
              </div>

              {/* Timezone */}
              <div className="form-group">
                <label className="form-label">
                  Timezone <span className="text-content-tertiary">(for optimal posting)</span>
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select timezone</option>
                  <option value="America/New_York">Eastern Time (EST)</option>
                  <option value="America/Chicago">Central Time (CST)</option>
                  <option value="America/Denver">Mountain Time (MST)</option>
                  <option value="America/Los_Angeles">Pacific Time (PST)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEDT)</option>
                </select>
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-3">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.gdprConsent}
                    onChange={(e) => setFormData({ ...formData, gdprConsent: e.target.checked })}
                    className="checkbox-input"
                  />
                  <span>I agree to the Terms and Privacy Policy *</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.marketingEmails}
                    onChange={(e) => setFormData({ ...formData, marketingEmails: e.target.checked })}
                    className="checkbox-input"
                  />
                  <span>Send me product updates and tips</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'niche':
        return (
          <div className={`step-content ${animating ? 'animating' : ''}`}>
            <div className="step-header">
              <div className="step-icon-wrapper bg-gradient-to-br from-purple-500 to-pink-600">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="step-title">Define Your Business 🎯</h2>
                <p className="step-subtitle">
                  Help us understand your content and goals to customize your experience
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Niche Selection */}
              <div className="form-group">
                <label className="form-label">What's your content niche?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {niches.map((niche) => (
                    <button
                      key={niche.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, niche: niche.id })}
                      className={`niche-card ${formData.niche === niche.id ? 'active' : ''} niche-${niche.color}`}
                    >
                      <div className="niche-icon">{niche.icon}</div>
                      <div className="niche-name">{niche.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Revenue Goals */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Current Monthly Revenue</label>
                  <div className="input-with-icon">
                    <DollarSign className="input-icon" />
                    <input
                      type="number"
                      min="0"
                      value={formData.currentMonthlyRevenue}
                      onChange={(e) => setFormData({ ...formData, currentMonthlyRevenue: e.target.value })}
                      placeholder="0"
                      className="form-input with-icon"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Monthly Revenue</label>
                  <div className="input-with-icon">
                    <TrendingUp className="input-icon" />
                    <input
                      type="number"
                      min="0"
                      value={formData.targetMonthlyRevenue}
                      onChange={(e) => setFormData({ ...formData, targetMonthlyRevenue: e.target.value })}
                      placeholder="10000"
                      className="form-input with-icon"
                    />
                  </div>
                </div>
              </div>

              {/* Business Goals */}
              <div className="form-group">
                <label className="form-label">What are your main goals?</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {businessGoals.map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = formData.goals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleGoal(goal.id)}
                        className={`goal-card ${isSelected ? 'active' : ''}`}
                      >
                        <div className="goal-icon">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="goal-content">
                          <div className="goal-name">{goal.name}</div>
                          <div className="goal-description">{goal.description}</div>
                        </div>
                        {isSelected && <Check className="goal-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Types */}
              <div className="form-group">
                <label className="form-label">What type of content do you create?</label>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.contentTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleContentType(type.id)}
                        className={`content-type-chip ${isSelected ? 'active' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{type.name}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'platform':
        return (
          <div className={`step-content ${animating ? 'animating' : ''}`}>
            <div className="step-header">
              <div className="step-icon-wrapper bg-gradient-to-br from-blue-500 to-purple-600">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="step-title">Connect Your Platforms 🔗</h2>
                <p className="step-subtitle">
                  Link your accounts to start managing everything in one place
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {platforms.map((platform) => {
                  const isConnected = formData.connectedPlatforms.includes(platform.id);
                  const platformClass = platform.color === 'gradient' 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                    : `bg-${platform.color}-500`;

                  if (platform.comingSoon) {
                    return (
                      <div key={platform.id} className="platform-card disabled">
                        <div className="platform-card-content">
                          <div className={`platform-icon ${platformClass} opacity-50`}>
                            {platform.icon}
                          </div>
                          <div>
                            <h3 className="platform-name">{platform.name}</h3>
                            <p className="platform-status">Coming Soon</p>
                          </div>
                        </div>
                        <div className="platform-badge">
                          <span className="text-content-tertiary text-sm">Soon</span>
                        </div>
                      </div>
                    );
                  }

                  if (platform.oauth) {
                    return (
                      <a
                        key={platform.id}
                        href={platform.url}
                        className={`platform-card ${isConnected ? 'connected' : ''}`}
                      >
                        <div className="platform-card-content">
                          <div className={`platform-icon ${platformClass}`}>
                            {platform.icon}
                          </div>
                          <div>
                            <h3 className="platform-name">{platform.name}</h3>
                            <p className="platform-status">
                              {isConnected ? 'Connected' : 'Connect via OAuth'}
                            </p>
                          </div>
                        </div>
                        <div className="platform-badge">
                          {isConnected ? (
                            <Check className="w-5 h-5 text-success" />
                          ) : (
                            <Plus className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </a>
                    );
                  }

                  // OnlyFans custom connection
                  return (
                    <div key={platform.id} className={`platform-card ${isConnected ? 'connected' : ''}`}>
                      <div className="platform-card-content">
                        <div className={`platform-icon ${platformClass}`}>
                          {platform.icon}
                        </div>
                        <div>
                          <h3 className="platform-name">{platform.name}</h3>
                          <p className="platform-status">
                            {isConnected ? 'Connected' : 'Connect with API'}
                          </p>
                        </div>
                      </div>
                      <div className="platform-badge">
                        {isConnected ? (
                          <Check className="w-5 h-5 text-success" />
                        ) : (
                          <button 
                            onClick={() => togglePlatform(platform.id)}
                            className="btn-sm btn-primary"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="info-box">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Platform connections are optional</p>
                  <p className="text-sm text-content-tertiary">
                    You can connect platforms now or add them later from your dashboard. 
                    Each platform unlocks specific features and automation capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai-config':
        return (
          <div className={`step-content ${animating ? 'animating' : ''}`}>
            <div className="step-header">
              <div className="step-icon-wrapper bg-gradient-to-br from-orange-500 to-red-600">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="step-title">Configure Your AI Assistant 🤖</h2>
                <p className="step-subtitle">
                  Customize how your AI interacts with fans on your behalf
                </p>
              </div>
            </div>

            {formData.niche && (
              <div className="ai-optimization-banner">
                <Sparkles className="w-5 h-5" />
                <div>
                  <p className="font-medium">
                    AI optimized for {niches.find(n => n.id === formData.niche)?.name}
                  </p>
                  <p className="text-sm text-content-tertiary">
                    Your assistant will be trained with industry-specific knowledge and communication styles
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* AI Personality */}
              <div className="form-group">
                <label className="form-label">AI Personality & Background</label>
                <p className="form-helper mb-3">
                  Describe your persona, interests, and interaction style
                </p>
                <textarea
                  rows={6}
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  placeholder={
                    formData.niche === 'fitness' 
                      ? "Example: You are a 25-year-old fitness coach who loves helping people achieve their goals. Be motivating and supportive, share workout tips and healthy recipes. You're passionate about wellness and creating a positive community..."
                      : formData.niche === 'adult'
                      ? "Example: You are confident and playful. Be flirty and engaging while maintaining boundaries. Use emojis to express personality. You enjoy creating exclusive content and making fans feel special..."
                      : "Example: Describe your background, interests, personality traits, and how you want to interact with your audience. Be specific about your communication style and what makes you unique..."
                  }
                  className="form-textarea"
                />
              </div>

              {/* Response Style */}
              <div className="form-group">
                <label className="form-label">Response Style</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {responseStyles.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, responseStyle: style.id })}
                      className={`response-style-card ${formData.responseStyle === style.id ? 'active' : ''}`}
                    >
                      <div className="response-style-content">
                        <div className="response-style-name">{style.name}</div>
                        <div className="response-style-description">{style.description}</div>
                      </div>
                      {formData.responseStyle === style.id && (
                        <Check className="response-style-check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing & Welcome Message */}
              {formData.connectedPlatforms.length > 0 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Monthly Subscription Price</label>
                    <div className="input-with-icon">
                      <DollarSign className="input-icon" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthlyPrice}
                        onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                        className="form-input with-icon"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Welcome Message</label>
                    <p className="form-helper mb-3">
                      Automatically sent to new subscribers
                    </p>
                    <textarea
                      rows={3}
                      value={formData.welcomeMessage}
                      onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                      placeholder="Hey! Welcome to my exclusive content 💕 I'm so glad you're here! Feel free to message me anytime..."
                      className="form-textarea"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'plan':
        return <PlanSelection onSkip={() => setCurrentStep('complete')} />;

      case 'complete':
        return (
          <div className={`step-content text-center ${animating ? 'animating' : ''}`}>
            <div className="complete-animation">
              <div className="complete-icon">
                <Check className="w-12 h-12 text-white" />
              </div>
              <div className="complete-sparkles">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`sparkle sparkle-${i + 1}`}>✨</div>
                ))}
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-3xl font-bold text-content-primary mb-3">
                You're all set! 🎉
              </h2>
              <p className="text-lg text-content-secondary mb-8">
                Your personalized dashboard is ready to help you grow
              </p>
            </div>

            <div className="complete-summary">
              <h3 className="font-semibold text-content-primary mb-4">Setup Summary:</h3>
              <div className="grid grid-cols-2 gap-3 text-left">
                {formData.displayName && (
                  <div className="summary-item">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span>Profile: {formData.displayName}</span>
                  </div>
                )}
                {formData.niche && (
                  <div className="summary-item">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span>{niches.find(n => n.id === formData.niche)?.name} niche</span>
                  </div>
                )}
                {formData.goals.length > 0 && (
                  <div className="summary-item">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span>{formData.goals.length} business goals</span>
                  </div>
                )}
                {formData.connectedPlatforms.length > 0 && (
                  <div className="summary-item">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span>{formData.connectedPlatforms.length} platforms</span>
                  </div>
                )}
                {formData.personality && (
                  <div className="summary-item">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span>AI configured</span>
                  </div>
                )}
                <div className="summary-item">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Ready to grow!</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="btn-primary btn-lg mt-8"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );
    }
  };

  return (
    <div className="onboarding-container">
      {/* Background Effects */}
      <div className="onboarding-bg">
        <div className="bg-gradient" />
        <div className="bg-pattern" />
      </div>

      <div className="onboarding-content pb-safe">
        {/* Progress Bar */}
        {currentStep !== 'complete' && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Step Indicators */}
            <div className="steps-container">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = getCurrentStepIndex() > index;
                const Icon = step.icon;
                
                return (
                  <div key={step.id} className="step-indicator-wrapper">
                    <div className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="step-info">
                      <p className="step-name">{step.title}</p>
                      <p className="step-desc">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="onboarding-card">
          {renderStepContent()}
          
          {/* Navigation */}
          {currentStep !== 'complete' && currentStep !== 'plan' && (
            <div className="navigation-container">
              {currentStep !== 'profile' && (
                <button
                  onClick={handlePrevious}
                  disabled={loading}
                  className="btn-secondary"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={loading || (currentStep === 'profile' && !formData.gdprConsent)}
                className="btn-primary ml-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {currentStep === 'platform' && formData.connectedPlatforms.length === 0 
                        ? 'Skip for Now' 
                        : 'Continue'}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanSelection({ onSkip }: { onSkip: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for getting started',
      price: { monthly: 0, yearly: 0 },
      features: [
        'Basic AI assistant',
        'Up to 100 messages/month',
        'Email support',
        'Basic analytics'
      ],
      cta: 'Start Free',
      recommended: false
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Best for growing creators',
      price: { monthly: 29, yearly: 24 },
      features: [
        'Advanced AI automations',
        'Unlimited messaging',
        'Priority support',
        'Advanced analytics',
        'Custom AI training',
        'Multi-platform support'
      ],
      cta: 'Start Free Trial',
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For agencies & teams',
      price: { monthly: 99, yearly: 84 },
      features: [
        'Everything in Pro',
        'Team management',
        'White label options',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantees'
      ],
      cta: 'Contact Sales',
      recommended: false
    }
  ];

  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-icon-wrapper bg-gradient-to-br from-green-500 to-emerald-600">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="step-title">Choose Your Plan 💳</h2>
          <p className="step-subtitle">
            Start with a 14-day free trial. Cancel anytime, no questions asked.
          </p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="billing-toggle">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={billingCycle === 'monthly' ? 'active' : ''}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={billingCycle === 'yearly' ? 'active' : ''}
        >
          Yearly
          <span className="save-badge">Save 20%</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.recommended ? 'recommended' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.recommended && (
              <div className="recommended-badge">
                <Star className="w-4 h-4" />
                Recommended
              </div>
            )}

            <div className="plan-header">
              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-description">{plan.description}</p>
            </div>

            <div className="plan-price">
              <span className="price-currency">$</span>
              <span className="price-amount">
                {plan.price[billingCycle]}
              </span>
              {plan.price[billingCycle] > 0 && (
                <span className="price-period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              )}
            </div>

            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              className={`plan-cta ${plan.id === 'starter' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (plan.id === 'starter') {
                  onSkip();
                }
              }}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Trial Info */}
      <div className="trial-info">
        <Shield className="w-5 h-5 text-success flex-shrink-0" />
        <div>
          <p className="font-medium mb-1">14-day free trial on all paid plans</p>
          <p className="text-sm text-content-tertiary">
            No credit card required. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
