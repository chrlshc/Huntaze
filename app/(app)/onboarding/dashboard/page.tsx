'use client';
/**
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import FeatureCard from '@/components/onboarding/FeatureCard';
import { Button } from "@/components/ui/button";

interface OnboardingStatus {
  progressPercentage: number;
  completedSteps: string[];
  currentStep: string;
  estimatedTimeRemaining: number;
  nextRecommendedStep: {
    id: string;
    title: string;
    description: string;
    estimatedMinutes: number;
  };
}

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isUnlocked: boolean;
  requirements?: any[];
}

export default function OnboardingDashboard() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadOnboardingStatus();
    loadFeatures();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status');
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    try {
      const [unlockedRes, lockedRes] = await Promise.all([
        fetch('/api/features/unlocked'),
        fetch('/api/features/locked')
      ]);

      const unlocked = await unlockedRes.json();
      const locked = await lockedRes.json();

      const allFeatures = [
        ...(unlocked.success ? unlocked.data.map((f: any) => ({ ...f, isUnlocked: true })) : []),
        ...(locked.success ? locked.data.map((f: any) => ({ ...f, isUnlocked: false })) : [])
      ];

      setFeatures(allFeatures);
    } catch (error) {
      console.error('Failed to load features:', error);
    }
  };

  const handleContinueOnboarding = () => {
    router.push('/onboarding/setup');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isComplete = status && status.progressPercentage >= 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isComplete ? 'Welcome to Huntaze! 🎉' : 'Continue Your Setup'}
              </h1>
              <p className="text-blue-100 mb-6">
                {isComplete 
                  ? 'Your account is fully configured and ready to go!'
                  : 'Complete your onboarding to unlock all features'
                }
              </p>
              
              {!isComplete && status && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white bg-opacity-20 rounded-full h-3">
                      <div
                        className="bg-white h-3 rounded-full transition-all duration-500"
                        style={{ width: `${status.progressPercentage}%` }}
                      />
                    </div>
                    <span className="font-semibold">
                      {Math.round(status.progressPercentage)}%
                    </span>
                  </div>
                  
                  {status.estimatedTimeRemaining > 0 && (
                    <div className="flex items-center gap-2 text-sm text-blue-100">
                      <Clock className="w-4 h-4" />
                      <span>About {status.estimatedTimeRemaining} minutes remaining</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {!isComplete && (
              <Button variant="primary" onClick={handleContinueOnboarding}>
  Continue Setup
                <ArrowRight className="w-5 h-5" />
</Button>
            )}
          </div>
        </div>

        {/* Next Recommended Step */}
        {!isComplete && status?.nextRecommendedStep && (
          <Card className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Next Step: {status.nextRecommendedStep.title}
                </h2>
                <p className="text-gray-600 mb-3">
                  {status.nextRecommendedStep.description}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    ⏱️ {status.nextRecommendedStep.estimatedMinutes} minutes
                  </span>
                  <Button variant="primary" onClick={handleContinueOnboarding}>
                    Start Now →
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Completed Steps</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {status?.completedSteps.length || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Steps finished
            </p>
          </Card>

          <Card className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Unlocked Features</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {features.filter(f => f.isUnlocked).length}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Features available
            </p>
          </Card>

          <Card className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Progress</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(status?.progressPercentage || 0)}%
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Setup complete
            </p>
          </Card>
        </div>

        {/* Features Overview */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Your Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(feature => (
              <FeatureCard
                key={feature.id}
                {...feature}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
