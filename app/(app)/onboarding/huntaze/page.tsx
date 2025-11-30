'use client';
/**
 * Requires user authentication or user-specific data
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';


/**
 * Huntaze Onboarding Page
 * 
 * Page d'onboarding complète avec guide de configuration flexible.
 * Integrates SetupGuide, CompletionNudge, and GuardRailModal.
 * 
 * Requirements: 1.3, 1.4, 6.2, 6.3, 12.1
 */

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { 
  SetupGuideContainer, 
  CompletionNudge, 
  GuardRailModal 
} from '@/components/onboarding/huntaze-onboarding';

export default function ShopifyStyleOnboardingPage() {
  const [showGuardRail, setShowGuardRail] = useState(false);
  const [guardRailData, setGuardRailData] = useState({
    missingStep: 'payments',
    message: 'Vous devez configurer les paiements avant de publier votre boutique',
    action: {
      type: 'open_modal' as const,
      modal: 'payments_setup',
    },
  });

  // Mock user data - replace with real auth
  const mockUser = {
    id: 'demo-user-123',
    role: 'owner' as const,
    market: 'FR',
  };

  // Mock onboarding state - this would come from API
  const [mockProgress, setMockProgress] = useState(35);
  const [mockRemainingSteps, setMockRemainingSteps] = useState(4);
  const [snoozeCount, setSnoozeCount] = useState(0);

  const handleSnooze = async (days: number) => {
    console.log(`[Demo] Snoozing for ${days} days`);
    setSnoozeCount(prev => prev + 1);
    // In production, this would call the API
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const handleDismiss = () => {
    console.log('[Demo] Nudge dismissed');
  };

  const handleLearnMore = (stepId: string) => {
    console.log('[Demo] Learn more about:', stepId);
    alert(`Documentation pour l'étape: ${stepId}\n\nCeci ouvrirait normalement un modal d'aide ou redirigerait vers la documentation.`);
  };

  const handleError = (error: Error) => {
    console.error('[Demo] Onboarding error:', error);
    alert(`Erreur: ${error.message}`);
  };

  const simulateGatedAction = () => {
    console.log('[Demo] Attempting gated action...');
    setShowGuardRail(true);
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className="border-b border-border-default bg-surface-raised">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-content-primary">
            Huntaze Setup
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            Flexible setup guide to get started quickly
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Completion Nudge */}
        <div className="mb-6">
          <CompletionNudge
            remainingSteps={mockRemainingSteps}
            progress={mockProgress}
            onSnooze={handleSnooze}
            onDismiss={handleDismiss}
            snoozeCount={snoozeCount}
            maxSnoozes={3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Setup Guide */}
          <div className="lg:col-span-2">
            <SetupGuideContainer
              userId={mockUser.id}
              userRole={mockUser.role}
              market={mockUser.market}
              onLearnMore={handleLearnMore}
              onError={handleError}
            />
          </div>

          {/* Sidebar - Demo Controls */}
          <div className="space-y-6">
            {/* Demo Info Card */}
            <Card className="rounded-2xl border border-border-default bg-surface-raised p-4">
              <h3 className="font-semibold text-content-primary mb-3">
                📊 Demo status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-content-secondary">Progress:</span>
                  <span className="font-medium text-content-primary">{mockProgress}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-secondary">Steps remaining:</span>
                  <span className="font-medium text-content-primary">{mockRemainingSteps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-secondary">Snoozes used:</span>
                  <span className="font-medium text-content-primary">{snoozeCount}/3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-secondary">Role:</span>
                  <span className="font-medium text-content-primary capitalize">{mockUser.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-secondary">Market:</span>
                  <span className="font-medium text-content-primary">{mockUser.market}</span>
                </div>
              </div>
            </Card>

            {/* Demo Actions Card */}
            <Card className="rounded-2xl border border-border-default bg-surface-raised p-4">
              <h3 className="font-semibold text-content-primary mb-3">
                🎮 Test actions
              </h3>
              <div className="space-y-2">
                <Button variant="primary" onClick={simulateGatedAction}>
                  Test Guard-Rail Modal
                </Button>
                <p className="text-xs text-content-secondary">
                  Simulates a blocked action requiring prior setup
                </p>
              </div>
            </Card>

            {/* Features Card */}
            <Card className="rounded-2xl border border-border-default bg-surface-raised p-4">
              <h3 className="font-semibold text-content-primary mb-3">
                ✨ Features
              </h3>
              <ul className="space-y-2 text-sm text-content-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Non-blocking onboarding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Skip/snooze steps</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Contextual guard-rails</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Role-based permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>WCAG 2.1 AA accessibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Mobile-first responsive</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Optimistic UI updates</span>
                </li>
              </ul>
            </Card>

            {/* API Status Card */}
            <Card className="rounded-2xl border border-border-default bg-surface-raised p-4">
              <h3 className="font-semibold text-content-primary mb-3">
                🔌 Endpoints API
              </h3>
              <ul className="space-y-1 text-xs font-mono text-content-secondary">
                <li>GET /api/onboarding</li>
                <li>PATCH /api/onboarding/steps/:id</li>
                <li>POST /api/onboarding/snooze</li>
                <li>POST /api/store/publish (gated)</li>
                <li>POST /api/checkout/* (gated)</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-8 p-4 rounded-xl border border-border-default bg-surface-muted">
          <p className="text-sm text-content-secondary">
            📚 <strong>Documentation:</strong> See{' '}
            <code className="px-2 py-1 bg-surface-raised rounded text-xs">
              components/onboarding/shopify-style/README.md
            </code>{' '}
            for more information on usage and integration.
          </p>
        </div>
      </div>

      {/* Guard Rail Modal */}
      <GuardRailModal
        isOpen={showGuardRail}
        missingStep={guardRailData.missingStep}
        message={guardRailData.message}
        action={guardRailData.action}
        onClose={() => setShowGuardRail(false)}
        onComplete={() => {
          setShowGuardRail(false);
          alert('Setup completed! In production, this would update the step status.');
        }}
        correlationId="demo-correlation-id-123"
      />
    </div>
  );
}
