'use client';

/**
 * New Automation Page (Flow Builder)
 * Create a new automation using the visual flow builder or AI generator
 * Requirements: 9.3 - Visual flow builder with AI suggestions
 * Feature: dashboard-ux-overhaul
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FlowBuilder } from '@/components/automations/FlowBuilder';
import { AIFlowGenerator } from '@/components/automations/AIFlowGenerator';
import type { AutomationStep } from '@/lib/automations/types';
import { 
  Sparkles, 
  Wrench, 
  Save, 
  FileText, 
  X,
  AlertCircle
} from 'lucide-react';

type BuilderMode = 'ai' | 'manual';

export default function NewAutomationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<BuilderMode>('ai');

  // Handle AI-generated flow
  const handleFlowGenerated = (
    generatedName: string, 
    generatedDescription: string, 
    generatedSteps: AutomationStep[]
  ) => {
    setName(generatedName);
    setDescription(generatedDescription);
    setSteps(generatedSteps);
    setMode('manual'); // Switch to manual mode to allow editing
  };

  // Save automation
  const saveAutomation = async (status: 'draft' | 'active') => {
    if (!name.trim()) {
      setError('Please enter a name for your automation');
      return;
    }

    if (steps.length === 0) {
      setError('Please add at least one step to your automation');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          steps,
          status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/automations');
      } else {
        setError(data.error || 'Failed to save automation');
      }
    } catch (err) {
      console.error('Error saving automation:', err);
      setError('Failed to save automation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ContentPageErrorBoundary pageName="New Automation">
      <PageLayout
        title="Create Automation"
        subtitle="Build an automated workflow to engage with your fans"
        breadcrumbs={[
          { label: 'Automations', href: '/automations' },
          { label: 'New' }
        ]}
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/automations')}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        }
      >
        {/* Mode Selector */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === 'ai' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode('ai')}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI Generator
          </Button>
          <Button
            variant={mode === 'manual' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode('manual')}
            className="flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Manual Builder
          </Button>
        </div>

        {/* AI Generator Mode */}
        {mode === 'ai' && (
          <div className="mb-6">
            <AIFlowGenerator onFlowGenerated={handleFlowGenerated} />
            <div className="text-center mt-4">
              <button
                onClick={() => setMode('manual')}
                className="text-sm text-[var(--color-text-sub)] hover:text-[var(--color-text-main)] transition-colors"
              >
                Or build manually →
              </button>
            </div>
          </div>
        )}

        {/* Manual Builder Mode */}
        {mode === 'manual' && (
          <>
            {/* Show AI Generator toggle */}
            {steps.length === 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setMode('ai')}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  Use AI to generate
                </button>
              </div>
            )}

            {/* Name & Description */}
            <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 mb-6 shadow-[var(--shadow-soft)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">
                    Automation Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Welcome New Subscribers"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-[var(--bg-surface)] text-[var(--color-text-main)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this automation does..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-[var(--bg-surface)] text-[var(--color-text-main)] focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </Card>

            {/* Flow Builder */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-[var(--color-text-main)] mb-4">
                Workflow Steps
              </h2>
              <FlowBuilder steps={steps} onChange={setSteps} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={() => saveAutomation('active')}
                disabled={saving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save & Activate'}
              </Button>
              <Button
                variant="outline"
                onClick={() => saveAutomation('draft')}
                disabled={saving}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
            </div>
          </>
        )}
      </PageLayout>
    </ContentPageErrorBoundary>
  );
}
