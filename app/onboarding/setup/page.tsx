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
  Star
} from 'lucide-react';

type Step = 'profile' | 'platform' | 'niche' | 'ai-config' | 'complete';

export default function OnboardingSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Profile
    displayName: '',
    bio: '',
    timezone: '',
    language: 'en',
    
    // Niche & Goals
    niche: '',
    goals: [] as string[],
    contentTypes: [] as string[],
    
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
    { code: 'it', name: 'Italian', flag: '🇮🇹' }
  ];

  const niches = [
    { id: 'fitness', name: 'Fitness & Health', icon: '💪', color: 'green' },
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

  const togglePlatform = (id: string) => {
    setFormData((prev) => {
      const exists = prev.connectedPlatforms.includes(id);
      return {
        ...prev,
        connectedPlatforms: exists
          ? prev.connectedPlatforms.filter((p) => p !== id)
          : [...prev.connectedPlatforms, id],
      };
    });
  };

  const toggleGoal = (id: string) => {
    setFormData((prev) => {
      const exists = prev.goals.includes(id);
      return {
        ...prev,
        goals: exists
          ? prev.goals.filter((g) => g !== id)
          : [...prev.goals, id],
      };
    });
  };

  const toggleContentType = (id: string) => {
    setFormData((prev) => {
      const exists = prev.contentTypes.includes(id);
      return {
        ...prev,
        contentTypes: exists
          ? prev.contentTypes.filter((c) => c !== id)
          : [...prev.contentTypes, id],
      };
    });
  };

  const steps = [
    { id: 'profile', title: 'Profile Setup', icon: User },
    { id: 'niche', title: 'Your Business', icon: Target },
    { id: 'platform', title: 'Platforms', icon: Zap },
    { id: 'ai-config', title: 'AI Assistant', icon: Bot },
  ];

  useEffect(() => {
    // Check if returning from Stripe
    const sessionId = searchParams.get('session_id');
    const step = searchParams.get('step');
    
    if (sessionId && step === 'complete') {
      // Payment successful, mark as complete
      const completeOnboarding = async () => {
        await fetch('/api/users/onboarding-status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentStep: 'complete',
            steps: { profile: true, niche: true, aiConfig: true, payment: true },
            completed: true,
          }),
        });
        setCurrentStep('complete');
      };
      completeOnboarding().catch(console.error);
    }
  }, [searchParams]);

  const handleNext = async () => {
    setLoading(true);
    
    // Save current step data
    if (currentStep === 'profile') {
      // Save profile data
      try {
        const response = await fetch('/api/users/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: formData.displayName,
            bio: formData.bio,
            timezone: formData.timezone,
            language: formData.language,
          }),
        });

        if (!response.ok) {
          console.warn('Profile API failed, continuing anyway for demo');
        }
        
        // Update onboarding status
        try {
          await fetch('/api/users/onboarding-status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentStep: 'niche',
              steps: { profile: true, niche: false, aiConfig: false, payment: false },
            }),
          });
        } catch (e) {
          console.warn('Onboarding status API failed, continuing anyway');
        }
        
        setCurrentStep('niche');
      } catch (error) {
        console.error('Failed to save profile:', error);
        // Continue anyway for demo purposes
        setCurrentStep('niche');
      }
    } else if (currentStep === 'niche') {
      // Save niche data
      try {
        const profileResponse = await fetch('/api/users/profile');
        if (profileResponse.ok) {
          const currentProfile = await profileResponse.json();
          await fetch('/api/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...currentProfile,
              niche: formData.niche,
              goals: formData.goals,
              contentTypes: formData.contentTypes,
            }),
          });
        }
      } catch (e) {
        console.warn('Failed to save niche data, continuing');
      }
      setCurrentStep('platform');
    } else if (currentStep === 'platform') {
      try {
        const existing = await fetch('/api/ai/config', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({}));
        const updated = { ...existing, platforms: formData.connectedPlatforms };
        await fetch('/api/ai/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      } catch (e) {
        console.warn('Failed to persist platforms, continuing');
      }
      setCurrentStep('ai-config');
    } else if (currentStep === 'ai-config') {
      // Save AI configuration
      try {
        const response = await fetch('/api/ai/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personality: formData.personality,
            responseStyle: formData.responseStyle,
            pricing: {
              monthlyPrice: formData.monthlyPrice,
              welcomeMessage: formData.welcomeMessage,
            },
            niche: formData.niche,
            contentTypes: formData.contentTypes,
          }),
        });
        
        if (!response.ok) {
          console.warn('AI config API failed, continuing anyway for demo');
        }
        
        // Update onboarding status
        try {
          await fetch('/api/users/onboarding-status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentStep: 'payment',
              steps: { profile: true, niche: true, aiConfig: true, payment: false },
            }),
          });
        } catch (e) {
          console.warn('Onboarding status API failed, continuing anyway');
        }
        
        setCurrentStep('complete');
      } catch (error) {
        console.error('Failed to save AI config:', error);
        // Continue anyway for demo purposes
        setCurrentStep('complete');
      }
    }
    
    setLoading(false);
  };

  const handlePrevious = () => {
    const stepOrder: Step[] = ['profile', 'niche', 'platform', 'ai-config'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Huntaze! Let's personalize your experience
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Tell us a bit about yourself to customize your dashboard
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Your creator name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setFormData({ ...formData, language: lang.code })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.language === lang.code
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{lang.flag}</span>
                        <span className="font-medium text-sm">{lang.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell your fans about yourself..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone <span className="text-gray-400">(for optimal posting)</span>
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
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
            </div>
          </div>
        );

      case 'niche':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Define Your Business
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This helps us customize features and analytics for your specific needs
              </p>
            </div>

            <div className="space-y-6">
              {/* Niche Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  What's your content niche?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {niches.map((niche) => (
                    <button
                      key={niche.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, niche: niche.id })}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        formData.niche === niche.id
                          ? `border-${niche.color}-500 bg-${niche.color}-50 dark:bg-${niche.color}-900/20`
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{niche.icon}</div>
                      <div className="text-sm font-medium">{niche.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  What are your main goals? (Select all that apply)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {businessGoals.map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = formData.goals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleGoal(goal.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            isSelected ? 'bg-purple-100 dark:bg-purple-800/30' : 'bg-gray-100 dark:bg-gray-800'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              isSelected ? 'text-purple-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{goal.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{goal.description}</div>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  What type of content do you create? (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-3">
                  {contentTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.contentTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleContentType(type.id)}
                        className={`px-4 py-2.5 rounded-lg border-2 transition-all inline-flex items-center gap-2 ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{type.name}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai-config':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Configure your AI assistant
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Customize how your AI responds to messages on your platforms
              </p>
              {formData.niche && (
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    💡 <strong>AI optimized for {niches.find(n => n.id === formData.niche)?.name}:</strong> Your assistant will be trained with industry-specific knowledge and communication styles.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Personality & Background Story
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Describe your persona, interests, and how you want the AI to interact with fans.
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Response Style
                </label>
                <select
                  value={formData.responseStyle}
                  onChange={(e) => setFormData({ ...formData, responseStyle: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                >
                  <option value="friendly">Friendly & Casual</option>
                  <option value="flirty">Flirty & Playful</option>
                  <option value="professional">Professional</option>
                  <option value="motivational">Motivational & Supportive</option>
                  <option value="educational">Educational & Informative</option>
                  <option value="mysterious">Mysterious & Intriguing</option>
                </select>
              </div>

              {formData.connectedPlatforms.length > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Monthly Subscription Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.monthlyPrice}
                      onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Welcome Message (Auto-sent to new subscribers)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.welcomeMessage}
                      onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                      placeholder={
                        formData.niche === 'fitness'
                          ? "Welcome to my fitness journey! 💪 I'm excited to help you reach your goals. Check out my exclusive workout plans and nutrition tips..."
                          : "Hey! Welcome to my exclusive content 💕 I'm so glad you're here! Feel free to message me anytime..."
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'platform':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Connect Your Platforms
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Link your content platforms to start managing everything in one place
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* OnlyFans Card */}
              <button
                type="button"
                onClick={() => togglePlatform('onlyfans')}
                className={`group relative p-6 border-2 rounded-xl transition-all ${
                  formData.connectedPlatforms.includes('onlyfans')
                    ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">OF</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">OnlyFans</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Connect your OnlyFans account
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    formData.connectedPlatforms.includes('onlyfans')
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-purple-600 dark:text-purple-400'
                  }`}>
                    {formData.connectedPlatforms.includes('onlyfans') ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Connect</span>
                      </>
                    )}
                  </div>
                </div>
              </button>

              {/* Fansly Card */}
              <button
                type="button"
                onClick={() => togglePlatform('fansly')}
                className={`group relative p-6 border-2 rounded-xl transition-all ${
                  formData.connectedPlatforms.includes('fansly')
                    ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">F</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fansly</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Connect your Fansly account
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    formData.connectedPlatforms.includes('fansly')
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-purple-600 dark:text-purple-400'
                  }`}>
                    {formData.connectedPlatforms.includes('fansly') ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Connect</span>
                      </>
                    )}
                  </div>
                </div>
              </button>

              {/* Patreon Card - Coming Soon */}
              <div className="relative p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl opacity-60">
                <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <span className="text-gray-500 font-medium">Coming Soon</span>
                </div>
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">P</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Patreon</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Support coming soon
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Platform */}
              <div className="relative p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl opacity-60">
                <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <span className="text-gray-500 font-medium">Coming Soon</span>
                </div>
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Other Platforms</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      More platforms soon
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                💡 <strong>Tip:</strong> You can connect multiple accounts and add more platforms later from your dashboard. Platform connections are optional but recommended for full functionality.
              </p>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                You're all set! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your personalized dashboard is ready
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What's been configured:</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {formData.displayName && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Profile: {formData.displayName}</span>
                  </li>
                )}
                {formData.niche && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Niche: {niches.find(n => n.id === formData.niche)?.name}</span>
                  </li>
                )}
                {formData.goals.length > 0 && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{formData.goals.length} business goals set</span>
                  </li>
                )}
                {formData.connectedPlatforms.length > 0 && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{formData.connectedPlatforms.length} platform(s) connected</span>
                  </li>
                )}
                {formData.personality && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>AI assistant configured</span>
                  </li>
                )}
              </ul>
            </div>

            <button
              onClick={handleComplete}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        {currentStep !== 'complete' && (
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                      isActive ? 'bg-purple-600 ring-4 ring-purple-100' : isCompleted ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <step.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      )}
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={`w-16 sm:w-24 h-1 transition-all ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between mt-3">
              {steps.map(step => (
                <p key={step.id} className={`text-xs sm:text-sm ${
                  step.id === currentStep ? 'text-purple-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          {renderStepContent()}
          
          {/* Navigation */}
          {currentStep !== 'complete' && (
            <div className="mt-8 flex justify-between">
              {currentStep !== 'profile' && (
                <button
                  onClick={handlePrevious}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Previous
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ml-auto shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {currentStep === 'ai-config' ? 'Complete Setup' : 
                     currentStep === 'platform' && formData.connectedPlatforms.length === 0 ? 'Skip for Now' : 'Continue'}
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
