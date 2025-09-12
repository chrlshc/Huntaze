'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { abTestVariants, type ABTestVariant } from '@/presets/ab-tests';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useOnboarding } from '@/hooks/useOnboarding';
import ComplianceChecker from '@/components/ComplianceChecker';

interface ABTestCardProps {
  test: ABTestVariant;
  testId: string;
  selected: boolean;
  onSelect: () => void;
  niche: string;
}

const ABTestCard = ({ test, testId, selected, onSelect, niche }: ABTestCardProps) => {
  const [variantA, setVariantA] = useState<string>(test.variantA);
  const [variantB, setVariantB] = useState<string>(test.variantB);
  const preview = useMemo(() => {
    switch (test.type) {
      case 'price':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div className="text-xs text-gray-500">A</div>
              <div className="font-bold text-lg">${test.variantA}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded text-sm border border-blue-200">
              <div className="text-xs text-blue-600">B</div>
              <div className="font-bold text-lg text-blue-700">${test.variantB}</div>
            </div>
          </div>
        );
      case 'hook':
        return (
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-500 mb-2">Variant A:</div>
              <div className="text-sm mb-2">{variantA}</div>
              <ComplianceChecker
                content={variantA}
                niche={niche}
                context="hook"
                autoCheck={false}
                className="text-xs"
                onContentChange={(fixed) => setVariantA(fixed)}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <div className="text-xs text-blue-600 mb-2">Variant B:</div>
              <div className="text-sm mb-2">{variantB}</div>
              <ComplianceChecker
                content={variantB}
                niche={niche}
                context="hook"
                autoCheck={false}
                className="text-xs"
                onContentChange={(fixed) => setVariantB(fixed)}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-600">
            {test.variantA} → {test.variantB}
          </div>
        );
    }
  }, [test]);

  return (
    <div
      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
      role="button"
      aria-pressed={selected}
      tabIndex={0}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg capitalize">{test.type.replace('_', ' ')} Test</h3>
          <p className="text-gray-600 text-sm">{test.description}</p>
        </div>
        <div className="flex gap-2 items-center">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              (test.confidence === 'high' && 'bg-green-100 text-green-700') ||
              (test.confidence === 'medium' && 'bg-yellow-100 text-yellow-700') ||
              'bg-gray-100 text-gray-700'
            }`}
          >
            {test.confidence} confidence
          </span>
          <input type="checkbox" checked={selected} onChange={() => {}} className="w-5 h-5" />
        </div>
      </div>

      {preview}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500 text-xs">Expected Impact</div>
            <div className="font-medium text-green-600">{test.expectedImpact}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Duration</div>
            <div className="font-medium">{test.testDuration}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Success Metrics</div>
            <div className="font-medium">{test.successMetrics.length} KPIs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OptimizePage() {
  const router = useRouter();
  const { track } = useAnalytics();
  const { completeOnboarding } = useOnboarding();

  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [niche, setNiche] = useState<string>('gfe');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('selectedNiche');
      if (stored) setNiche(stored);
    } catch {}
  }, []);

  const availableTests = abTestVariants[niche] || [];

  const handleTestSelect = (testId: string) => {
    const included = selectedTests.includes(testId);
    const next = included ? selectedTests.filter((t) => t !== testId) : [...selectedTests, testId];
    setSelectedTests(next);
    try {
      track('ab_test_selected', { niche, test_type: testId, selected: !included });
    } catch {}
  };

  const finalizeAndGoDashboard = async () => {
    try {
      // Mark onboarding complete for gating
      await fetch('/api/onboarding/complete', { method: 'POST' });
    } catch {}
    try { completeOnboarding(); } catch {}
    try { localStorage.setItem('onboarding_completed', 'true'); } catch {}
    router.push('/dashboard?onboarding=complete');
  };

  const handleStartTests = async () => {
    try { track('ab_test_campaign_started', { niche, test_count: selectedTests.length, selected_tests: selectedTests }); } catch {}

    try {
      await fetch('/api/onboarding/save-ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTests, niche }),
      });
    } catch {}

    await finalizeAndGoDashboard();
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Optimize Your Strategy</h1>
          <p className="text-gray-600">
            Select A/B tests to maximize your {niche.toUpperCase()} performance. Based on data from top creators.
          </p>
        </div>

        <div className="grid gap-6">
          {availableTests.map((test, index) => {
            const id = `${test.type}-${index}`;
            return (
              <ABTestCard
                key={id}
                test={test}
                testId={id}
                selected={selectedTests.includes(id)}
                onSelect={() => handleTestSelect(id)}
                niche={niche}
              />
            );
          })}
          {availableTests.length === 0 && (
            <div className="p-6 border rounded-lg text-sm text-content-tertiary">No recommended tests for this niche yet.</div>
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <button onClick={() => router.back()} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Back
          </button>
          <div className="flex gap-3">
            <button onClick={finalizeAndGoDashboard} className="px-6 py-2 text-gray-600 hover:text-gray-800">
              Skip Testing
            </button>
            <button
              onClick={handleStartTests}
              disabled={selectedTests.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Start {selectedTests.length || ''} {selectedTests.length === 1 ? 'Test' : 'Tests'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
